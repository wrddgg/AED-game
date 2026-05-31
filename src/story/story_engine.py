"""剧情引擎，驱动整个故事流程的核心控制器。"""

from typing import Any, Optional

from src.models.story_data import StoryGraph, StoryNode, ChoiceData
from src.models.game_context import GameContext
from src.models.events import StoryNodeEnteredEvent, StoryChoiceSelectedEvent
from src.story.variable_system import VariableStore
from src.story.condition_system import ConditionEvaluator
from src.story.action_system import ActionExecutor
from src.story.choice_system import ChoiceSystem
from src.story.story_node import StoryNodeProcessor


class StoryEngine:
    """剧情引擎，协调各子系统驱动故事流程。

    负责故事加载、节点跳转、玩家选择处理、暂停/恢复等核心流程。
    通过事件总线与 UI 层通信。
    """

    def __init__(
        self,
        event_bus: Any,
        variable_store: VariableStore,
        condition_evaluator: ConditionEvaluator,
        action_executor: ActionExecutor,
        choice_system: ChoiceSystem,
        node_processor: StoryNodeProcessor,
    ) -> None:
        """初始化剧情引擎。

        Args:
            event_bus: 事件总线，用于发布事件。
            variable_store: 变量存储。
            condition_evaluator: 条件评估器。
            action_executor: 动作执行器。
            choice_system: 选项系统。
            node_processor: 节点处理器。
        """
        self.event_bus = event_bus
        self.variable_store = variable_store
        self.condition_evaluator = condition_evaluator
        self.action_executor = action_executor
        self.choice_system = choice_system
        self.node_processor = node_processor

        self._graph: Optional[StoryGraph] = None
        self._context: GameContext = GameContext()
        self._current_node: Optional[StoryNode] = None
        self._paused: bool = False
        self._stopped: bool = False

    def load_story(self, graph: StoryGraph) -> None:
        """加载剧情图。

        Args:
            graph: 剧情图数据对象。
        """
        self._graph = graph
        self._context = GameContext()

    def start(self, story_id: Optional[str] = None) -> None:
        """从起始节点开始故事。

        Args:
            story_id: 可选的故事 ID，用于区分不同故事线。

        Raises:
            RuntimeError: 未加载剧情图或起始节点不存在。
        """
        if self._graph is None:
            raise RuntimeError("未加载剧情图，请先调用 load_story()")

        self._stopped = False
        self._paused = False
        self._context = GameContext()

        start_node_id = getattr(self._graph, "start_node", None)
        if start_node_id is None:
            raise RuntimeError("剧情图未定义起始节点")

        self.goto_node(start_node_id)

    def goto_node(self, node_id: str) -> None:
        """跳转到指定节点。

        执行当前节点的退出逻辑，更新上下文，执行新节点的进入逻辑，
        并发布节点进入事件。

        Args:
            node_id: 目标节点 ID。

        Raises:
            RuntimeError: 未加载剧情图。
            ValueError: 节点不存在。
        """
        if self._graph is None:
            raise RuntimeError("未加载剧情图")

        nodes = getattr(self._graph, "nodes", {})
        node = nodes.get(node_id) if isinstance(nodes, dict) else None

        # 如果 nodes 是列表，按 id 查找
        if node is None and isinstance(nodes, list):
            for n in nodes:
                if getattr(n, "id", None) == node_id:
                    node = n
                    break

        if node is None:
            raise ValueError(f"节点不存在: {node_id}")

        # 退出当前节点
        if self._current_node is not None:
            try:
                self.node_processor.exit_node(self._current_node, self._context)
            except Exception as e:
                print(f"[StoryEngine] 退出节点异常: {e}")

        # 更新上下文
        self._context.current_node_id = node_id
        self._current_node = node

        # 进入新节点
        render_data = self.node_processor.enter_node(node, self._context)

        # 发布节点进入事件
        self._publish_event("story_node_entered", StoryNodeEnteredEvent(
            node_id=node_id,
            node_type=getattr(node, "type", ""),
            render_data=render_data,
        ))

        # 处理条件不满足时的自动跳转
        redirect = render_data.get("redirect")
        if redirect:
            self.goto_node(redirect)
            return

        # 非交互节点的自动跳转
        auto_next = self.node_processor.get_auto_next(node, self._context)
        if auto_next and getattr(node, "type", "choice") != "choice":
            self._schedule_auto_next(auto_next, getattr(node, "duration", None))

    def choose(self, choice_id: str) -> None:
        """处理玩家选择。

        从当前节点的选项中找到匹配的选项，执行选择逻辑并跳转。

        Args:
            choice_id: 选项 ID。

        Raises:
            RuntimeError: 当前无节点或无可用选项。
            ValueError: 选项不存在。
        """
        if self._paused:
            return

        if self._current_node is None:
            raise RuntimeError("当前没有活跃节点")

        choices = getattr(self._current_node, "choices", None)
        if not choices:
            raise RuntimeError("当前节点没有可选项")

        # 查找匹配的选项
        selected = None
        for choice in choices:
            cid = getattr(choice, "id", None)
            if cid == choice_id:
                selected = choice
                break

        if selected is None:
            raise ValueError(f"选项不存在: {choice_id}")

        # 评估选项是否可见
        visible = self.choice_system.evaluate_choices(choices, self._context)
        if selected not in visible:
            raise ValueError(f"选项 '{choice_id}' 当前不可用")

        # 执行选择
        next_node_id = self.choice_system.select_choice(selected, self._context)

        # 发布选择事件
        self._publish_event("story_choice_selected", StoryChoiceSelectedEvent(
            choice_id=choice_id,
            next_node_id=next_node_id,
        ))

        # 跳转到下一节点
        self.goto_node(next_node_id)

    def pause(self) -> None:
        """暂停故事流程。"""
        self._paused = True

    def resume(self) -> None:
        """恢复故事流程。"""
        self._paused = False

    def stop(self) -> None:
        """停止故事流程。"""
        self._stopped = True
        self._paused = False

    def get_current_node(self) -> Optional[StoryNode]:
        """获取当前节点。

        Returns:
            当前剧情节点，无则返回 None。
        """
        return self._current_node

    def get_available_choices(self) -> list[ChoiceData]:
        """获取当前可用选项。

        Returns:
            当前节点中满足条件的选项列表。
        """
        if self._current_node is None:
            return []
        choices = getattr(self._current_node, "choices", None)
        if not choices:
            return []
        return self.choice_system.evaluate_choices(choices, self._context)

    def is_at_end(self) -> bool:
        """判断是否到达结局节点。

        结局节点的特征：没有 next_node、没有 choices、类型为 ending。

        Returns:
            是否到达结局。
        """
        if self._current_node is None:
            return True

        node_type = getattr(self._current_node, "type", "")
        if node_type == "ending":
            return True

        has_choices = bool(getattr(self._current_node, "choices", None))
        has_next = bool(getattr(self._current_node, "next_node", None))
        auto_next = self.node_processor.get_auto_next(
            self._current_node, self._context
        )

        return not has_choices and not has_next and auto_next is None

    def _handle_node_timeout(self) -> None:
        """节点超时处理。

        如果当前节点定义了 failure_node，则跳转到 failure_node；
        否则扣减病人状态作为超时惩罚。
        """
        if self._current_node is None:
            return

        failure_node = getattr(self._current_node, "failure_node", None)
        if failure_node:
            self.goto_node(failure_node)
        else:
            # 扣减病人状态
            if self._context.patient_state is not None:
                current = self._context.patient_state.get("stability", 100)
                self._context.patient_state["stability"] = max(0, current - 15)
            self._publish_event("node_timeout", {
                "node_id": getattr(self._current_node, "id", ""),
            })

    def _schedule_auto_next(
        self, next_node_id: str, duration: Optional[float]
    ) -> None:
        """调度自动跳转（由外部定时器调用）。

        对于有 duration 的节点，在指定时间后自动跳转。
        此方法仅记录目标，实际计时由 UI 层或 Clock 机制处理。

        Args:
            next_node_id: 跳转目标节点 ID。
            duration: 延迟时间（秒），None 表示立即跳转。
        """
        if duration is None or duration <= 0:
            self.goto_node(next_node_id)
        else:
            # 通知 UI 层设置定时器
            self._publish_event("schedule_auto_next", {
                "next_node_id": next_node_id,
                "duration": duration,
            })

    def _publish_event(self, event_type: str, data: Any) -> None:
        """通过事件总线发布事件。

        Args:
            event_type: 事件类型。
            data: 事件数据。
        """
        if self.event_bus is not None:
            if hasattr(self.event_bus, "emit"):
                self.event_bus.emit(event_type, data)
            elif hasattr(self.event_bus, "publish"):
                self.event_bus.publish(event_type, data)
            elif callable(self.event_bus):
                self.event_bus(event_type, data)
