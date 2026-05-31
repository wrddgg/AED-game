"""故事播放控制器，协调 StoryEngine 与 UI 层的交互。"""

from typing import Any, Optional

from src.models.events import (
    StoryNodeEnteredEvent,
    StoryChoiceSelectedEvent,
    MiniGameCompletedEvent,
)
from src.story.story_engine import StoryEngine


class StoryPlayer:
    """故事播放控制器，桥接 StoryEngine 与 UI 层。

    监听引擎事件，将其转化为 UI 更新指令；
    同时接收 UI 操作（选择、跳过等），转发给引擎处理。
    """

    def __init__(
        self,
        story_engine: StoryEngine,
        scene_router: Any,
        event_bus: Any,
    ) -> None:
        """初始化故事播放控制器。

        Args:
            story_engine: 剧情引擎实例。
            scene_router: 场景路由器，用于切换 UI 场景。
            event_bus: 事件总线，用于订阅和发布事件。
        """
        self.story_engine = story_engine
        self.scene_router = scene_router
        self.event_bus = event_bus

        self._scenario_data: Any = None
        self._playing: bool = False

        # 注册事件监听
        self._register_listeners()

    def _register_listeners(self) -> None:
        """注册事件总线监听器。"""
        if self.event_bus is None:
            return

        if hasattr(self.event_bus, "on"):
            self.event_bus.on("story_node_entered", self.on_node_entered)
            self.event_bus.on("story_choice_selected", self.on_choice_made)
            self.event_bus.on("minigame_completed", self.on_minigame_completed)
            self.event_bus.on("schedule_auto_next", self._on_schedule_auto_next)
        elif hasattr(self.event_bus, "subscribe"):
            self.event_bus.subscribe("story_node_entered", self.on_node_entered)
            self.event_bus.subscribe("story_choice_selected", self.on_choice_made)
            self.event_bus.subscribe(
                "minigame_completed", self.on_minigame_completed
            )
            self.event_bus.subscribe(
                "schedule_auto_next", self._on_schedule_auto_next
            )

    def play(self, scenario_data: Any) -> None:
        """开始播放场景。

        加载故事数据并启动引擎。

        Args:
            scenario_data: 场景数据，包含故事图等信息。
        """
        self._scenario_data = scenario_data
        self._playing = True

        # 加载故事
        if hasattr(scenario_data, "story_graph"):
            self.story_engine.load_story(scenario_data.story_graph)
        elif hasattr(scenario_data, "graph"):
            self.story_engine.load_story(scenario_data.graph)

        # 启动故事
        story_id = getattr(scenario_data, "story_id", None)
        self.story_engine.start(story_id)

    def on_node_entered(self, event: StoryNodeEnteredEvent) -> None:
        """响应节点进入事件，通知 UI 更新。

        将渲染数据传递给场景路由器，驱动 UI 显示新的节点内容。

        Args:
            event: 节点进入事件。
        """
        render_data = getattr(event, "render_data", {})

        if self.scene_router is not None:
            if hasattr(self.scene_router, "show_node"):
                self.scene_router.show_node(render_data)
            elif hasattr(self.scene_router, "navigate"):
                self.scene_router.navigate(
                    scene_type=render_data.get("type", "choice"),
                    data=render_data,
                )
            elif callable(self.scene_router):
                self.scene_router(render_data)

    def on_choice_made(self, event: StoryChoiceSelectedEvent) -> None:
        """响应玩家选择事件。

        可用于更新 UI 状态（如选择高亮、动画效果等）。

        Args:
            event: 选择事件。
        """
        choice_id = getattr(event, "choice_id", "")
        # 通知 UI 选择已处理
        if self.scene_router is not None and hasattr(self.scene_router, "on_choice"):
            self.scene_router.on_choice(choice_id)

    def on_minigame_completed(self, event: MiniGameCompletedEvent) -> None:
        """响应小游戏完成事件。

        小游戏完成后，根据结果更新游戏上下文并继续故事流程。

        Args:
            event: 小游戏完成事件。
        """
        minigame_id = getattr(event, "minigame_id", "")
        success = getattr(event, "success", False)
        score = getattr(event, "score", 0)

        # 根据小游戏结果更新变量
        if success:
            self.story_engine.variable_store.set(
                f"minigame_{minigame_id}_passed", True
            )
            self.story_engine.variable_store.set(
                f"minigame_{minigame_id}_score", score
            )
        else:
            self.story_engine.variable_store.set(
                f"minigame_{minigame_id}_passed", False
            )

        # 继续故事流程
        next_node_id = getattr(event, "next_node_id", None)
        if next_node_id:
            self.story_engine.goto_node(next_node_id)

    def replay(self) -> None:
        """从头重玩当前场景。"""
        if self._scenario_data is not None:
            self._playing = True
            story_id = getattr(self._scenario_data, "story_id", None)
            self.story_engine.start(story_id)

    def skip(self) -> None:
        """跳过当前节点。

        如果当前节点有 next_node，则跳转到下一个节点。
        否则不做任何操作。
        """
        current_node = self.story_engine.get_current_node()
        if current_node is None:
            return

        next_node = getattr(current_node, "next_node", None)
        if next_node:
            self.story_engine.goto_node(next_node)

    def _on_schedule_auto_next(self, data: dict) -> None:
        """处理自动跳转调度。

        通知 UI 层设置定时器，在指定时间后自动跳转。

        Args:
            data: 包含 next_node_id 和 duration 的字典。
        """
        next_node_id = data.get("next_node_id")
        duration = data.get("duration", 0)

        if self.scene_router is not None and hasattr(
            self.scene_router, "schedule_next"
        ):
            self.scene_router.schedule_next(next_node_id, duration)
