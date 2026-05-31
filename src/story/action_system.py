"""动作执行系统，处理剧情中的各类动作指令。"""

from typing import Any, Optional

from src.models.game_context import GameContext
from src.models.events import MiniGameStartedEvent
from src.story.variable_system import VariableStore


class ActionExecutor:
    """动作执行器，负责执行剧情节点和选项中定义的动作。

    支持变量操作、标志管理、音视频播放、场景跳转、小游戏触发等动作类型。
    通过事件总线与 UI 层通信。
    """

    def __init__(self, variable_store: VariableStore, event_bus: Any = None) -> None:
        """初始化动作执行器。

        Args:
            variable_store: 变量存储实例。
            event_bus: 事件总线实例，用于发布事件通知 UI 层。
        """
        self.variable_store = variable_store
        self.event_bus = event_bus

    def execute(self, actions: list[dict], context: GameContext) -> None:
        """执行动作列表。

        按顺序执行每个动作，某个动作失败不影响后续动作执行。

        Args:
            actions: 动作字典列表。
            context: 游戏上下文。
        """
        if not actions:
            return
        for action in actions:
            try:
                self._execute_single(action, context)
            except Exception as e:
                print(f"[ActionExecutor] 执行动作失败: {action}, 错误: {e}")

    def _execute_single(self, action: dict, context: GameContext) -> None:
        """执行单个动作。

        根据 action 的 type 字段分发到对应的处理逻辑。

        Args:
            action: 动作字典，包含 type 及相关参数。
            context: 游戏上下文。

        Raises:
            ValueError: 未知的动作类型。
        """
        action_type = action.get("type")

        if action_type == "set_var":
            key = action.get("key")
            value = action.get("value")
            if key is not None:
                self.variable_store.set(key, value)

        elif action_type == "add_var":
            key = action.get("key")
            value = action.get("value", 0)
            if key is not None:
                self.variable_store.add(key, value)

        elif action_type == "sub_var":
            key = action.get("key")
            value = action.get("value", 0)
            if key is not None:
                self.variable_store.sub(key, value)

        elif action_type == "set_flag":
            flag = action.get("value") or action.get("flag")
            if flag:
                context.flags.add(flag)

        elif action_type == "remove_flag":
            flag = action.get("value") or action.get("flag")
            if flag:
                context.flags.discard(flag)

        elif action_type == "play_audio":
            self._publish_event("play_audio", {
                "audio": action.get("audio"),
                "loop": action.get("loop", False),
                "volume": action.get("volume", 1.0),
            })

        elif action_type == "play_video":
            self._publish_event("play_video", {
                "video": action.get("video"),
                "loop": action.get("loop", False),
            })

        elif action_type == "navigate":
            self._publish_event("navigate", {
                "target": action.get("target"),
                "transition": action.get("transition"),
            })

        elif action_type == "trigger_minigame":
            self._publish_event("minigame_started", MiniGameStartedEvent(
                minigame_id=action.get("minigame_id", ""),
                minigame_type=action.get("minigame_type", ""),
                params=action.get("params", {}),
            ))

        elif action_type == "write_record":
            record_key = action.get("key")
            record_value = action.get("value")
            if record_key is not None:
                context.records[record_key] = record_value

        elif action_type == "modify_patient":
            self._modify_patient(action, context)

        else:
            raise ValueError(f"未知的动作类型: {action_type}")

    def _modify_patient(self, action: dict, context: GameContext) -> None:
        """修改病人状态。

        Args:
            action: 动作字典，包含要修改的病人属性。
            context: 游戏上下文。
        """
        if context.patient_state is None:
            context.patient_state = {}

        for key in ("heart_rate", "breathing", "consciousness", "blood_pressure"):
            if key in action:
                delta = action[key]
                current = context.patient_state.get(key, 0)
                context.patient_state[key] = current + delta

    def _publish_event(self, event_type: str, data: Any) -> None:
        """通过事件总线发布事件。

        如果事件总线不可用，静默忽略。

        Args:
            event_type: 事件类型名称。
            data: 事件数据。
        """
        if self.event_bus is not None:
            if hasattr(self.event_bus, "emit"):
                self.event_bus.emit(event_type, data)
            elif hasattr(self.event_bus, "publish"):
                self.event_bus.publish(event_type, data)
            elif callable(self.event_bus):
                self.event_bus(event_type, data)

    def _compare(self, a: Any, b: Any, operator: str) -> bool:
        """比较辅助方法。

        Args:
            a: 左操作数。
            b: 右操作数。
            operator: 比较运算符 (eq/neq/gt/lt/gte/lte)。

        Returns:
            比较结果。

        Raises:
            ValueError: 未知的运算符。
        """
        ops = {
            "eq": lambda x, y: x == y,
            "neq": lambda x, y: x != y,
            "gt": lambda x, y: x > y,
            "lt": lambda x, y: x < y,
            "gte": lambda x, y: x >= y,
            "lte": lambda x, y: x <= y,
        }
        op_func = ops.get(operator)
        if op_func is None:
            raise ValueError(f"未知的比较运算符: {operator}")
        try:
            return op_func(a, b)
        except TypeError:
            return False
