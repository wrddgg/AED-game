"""AED 急救互动剧情游戏 - 剧情数据模块

定义剧情图相关的数据结构，包括：
- StoryGraph: 剧情图，包含所有节点和全局条件
- StoryNode: 剧情节点，支持多种类型（视频/文本/选择/小游戏/分支/结束）
- ChoiceData: 选项数据，包含条件和效果
- ConditionData: 条件数据，支持嵌套逻辑（and/or/not）
- ActionData: 动作数据，支持变量操作、标记管理、音视频播放等

所有数据类支持序列化(to_dict)和反序列化(from_dict)。
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ConditionData:
    """条件数据

    支持多种条件类型和嵌套逻辑组合。

    Attributes:
        type: 条件类型 (var_compare/flag_set/flag_not_set/time_exceeded/step_completed)
        key: 条件相关的键名
        operator: 比较运算符 (eq/neq/gt/lt/gte/lte)
        value: 比较目标值
        and_conditions: AND 逻辑组合的子条件列表
        or_conditions: OR 逻辑组合的子条件列表
        not_condition: NOT 逻辑取反的子条件
    """
    type: str = ""
    key: str = ""
    operator: str = "eq"
    value: Any = None
    and_conditions: List["ConditionData"] = field(default_factory=list)
    or_conditions: List["ConditionData"] = field(default_factory=list)
    not_condition: Optional["ConditionData"] = None

    def to_dict(self) -> Dict[str, Any]:
        """将条件数据序列化为字典

        Returns:
            包含所有字段的字典，嵌套条件递归序列化
        """
        result: Dict[str, Any] = {
            "type": self.type,
            "key": self.key,
            "operator": self.operator,
            "value": self.value,
        }
        if self.and_conditions:
            result["and_conditions"] = [c.to_dict() for c in self.and_conditions]
        if self.or_conditions:
            result["or_conditions"] = [c.to_dict() for c in self.or_conditions]
        if self.not_condition is not None:
            result["not_condition"] = self.not_condition.to_dict()
        return result

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ConditionData":
        """从字典反序列化创建 ConditionData 实例

        Args:
            d: 包含条件数据的字典

        Returns:
            ConditionData 实例，嵌套条件递归反序列化
        """
        and_conditions = [
            cls.from_dict(c) for c in d.get("and_conditions", [])
        ]
        or_conditions = [
            cls.from_dict(c) for c in d.get("or_conditions", [])
        ]
        not_data = d.get("not_condition")
        not_condition = cls.from_dict(not_data) if not_data else None

        return cls(
            type=d.get("type", ""),
            key=d.get("key", ""),
            operator=d.get("operator", "eq"),
            value=d.get("value"),
            and_conditions=and_conditions,
            or_conditions=or_conditions,
            not_condition=not_condition,
        )


@dataclass
class ActionData:
    """动作数据

    支持多种动作类型，用于节点进入/退出时执行操作。

    Attributes:
        type: 动作类型 (set_var/add_var/sub_var/set_flag/remove_flag/
              play_audio/play_video/navigate/trigger_minigame/write_record)
        key: 动作目标键名
        value: 动作值
        params: 额外参数字典
    """
    type: str = ""
    key: str = ""
    value: Any = None
    params: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """将动作数据序列化为字典

        Returns:
            包含所有字段的字典
        """
        return {
            "type": self.type,
            "key": self.key,
            "value": self.value,
            "params": dict(self.params),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ActionData":
        """从字典反序列化创建 ActionData 实例

        Args:
            d: 包含动作数据的字典

        Returns:
            ActionData 实例
        """
        return cls(
            type=d.get("type", ""),
            key=d.get("key", ""),
            value=d.get("value"),
            params=d.get("params", {}),
        )


@dataclass
class ChoiceData:
    """选项数据

    Attributes:
        choice_id: 选项唯一标识
        text: 选项显示文本
        next_node: 选择后跳转的节点 ID
        conditions: 显示该选项需满足的条件列表
        effects: 选择该选项后触发的效果列表
        is_correct: 是否为正确选项
        feedback_text: 选择后的反馈文本
    """
    choice_id: str = ""
    text: str = ""
    next_node: str = ""
    conditions: List[ConditionData] = field(default_factory=list)
    effects: List[ActionData] = field(default_factory=list)
    is_correct: bool = False
    feedback_text: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """将选项数据序列化为字典

        Returns:
            包含所有字段的字典，条件和效果递归序列化
        """
        return {
            "choice_id": self.choice_id,
            "text": self.text,
            "next_node": self.next_node,
            "conditions": [c.to_dict() for c in self.conditions],
            "effects": [e.to_dict() for e in self.effects],
            "is_correct": self.is_correct,
            "feedback_text": self.feedback_text,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ChoiceData":
        """从字典反序列化创建 ChoiceData 实例

        Args:
            d: 包含选项数据的字典

        Returns:
            ChoiceData 实例
        """
        conditions = [
            ConditionData.from_dict(c) for c in d.get("conditions", [])
        ]
        effects = [
            ActionData.from_dict(e) for e in d.get("effects", [])
        ]
        return cls(
            choice_id=d.get("choice_id", ""),
            text=d.get("text", ""),
            next_node=d.get("next_node", ""),
            conditions=conditions,
            effects=effects,
            is_correct=d.get("is_correct", False),
            feedback_text=d.get("feedback_text", ""),
        )


@dataclass
class StoryNode:
    """剧情节点

    支持多种节点类型，每种类型有不同的行为和展示方式。

    Attributes:
        node_id: 节点唯一标识
        type: 节点类型 (video/text/choice/minigame/branch/end)
        title: 节点标题
        text: 节点文本内容
        video: 视频资源路径
        animation: 动画资源路径
        audio: 音频资源路径
        background: 背景资源路径
        duration: 持续时间（秒），0 表示无限
        choices: 选项列表（choice 类型节点使用）
        actions: 进入节点时执行的动作列表
        exit_actions: 退出节点时执行的动作列表
        conditions: 显示该节点需满足的条件列表
        next_node: 自动跳转的下一个节点 ID
        failure_node: 失败时跳转的节点 ID
        help_topic: 帮助主题 ID
        tags: 标签列表
    """
    node_id: str = ""
    type: str = ""
    title: str = ""
    text: str = ""
    video: str = ""
    animation: str = ""
    audio: str = ""
    background: str = ""
    duration: float = 0.0
    choices: List[ChoiceData] = field(default_factory=list)
    actions: List[ActionData] = field(default_factory=list)
    exit_actions: List[ActionData] = field(default_factory=list)
    conditions: List[ConditionData] = field(default_factory=list)
    next_node: str = ""
    failure_node: str = ""
    help_topic: str = ""
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """将剧情节点序列化为字典

        Returns:
            包含所有字段的字典，嵌套数据递归序列化
        """
        return {
            "node_id": self.node_id,
            "type": self.type,
            "title": self.title,
            "text": self.text,
            "video": self.video,
            "animation": self.animation,
            "audio": self.audio,
            "background": self.background,
            "duration": self.duration,
            "choices": [c.to_dict() for c in self.choices],
            "actions": [a.to_dict() for a in self.actions],
            "exit_actions": [a.to_dict() for a in self.exit_actions],
            "conditions": [c.to_dict() for c in self.conditions],
            "next_node": self.next_node,
            "failure_node": self.failure_node,
            "help_topic": self.help_topic,
            "tags": list(self.tags),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "StoryNode":
        """从字典反序列化创建 StoryNode 实例

        Args:
            d: 包含节点数据的字典

        Returns:
            StoryNode 实例
        """
        choices = [
            ChoiceData.from_dict(c) for c in d.get("choices", [])
        ]
        actions = [
            ActionData.from_dict(a) for a in d.get("actions", [])
        ]
        exit_actions = [
            ActionData.from_dict(a) for a in d.get("exit_actions", [])
        ]
        conditions = [
            ConditionData.from_dict(c) for c in d.get("conditions", [])
        ]
        return cls(
            node_id=d.get("node_id", ""),
            type=d.get("type", ""),
            title=d.get("title", ""),
            text=d.get("text", ""),
            video=d.get("video", ""),
            animation=d.get("animation", ""),
            audio=d.get("audio", ""),
            background=d.get("background", ""),
            duration=d.get("duration", 0.0),
            choices=choices,
            actions=actions,
            exit_actions=exit_actions,
            conditions=conditions,
            next_node=d.get("next_node", ""),
            failure_node=d.get("failure_node", ""),
            help_topic=d.get("help_topic", ""),
            tags=d.get("tags", []),
        )


@dataclass
class StoryGraph:
    """剧情图

    由多个 StoryNode 组成的有向图，描述完整的剧情分支结构。

    Attributes:
        graph_id: 剧情图唯一标识
        start_node: 起始节点 ID
        nodes: 节点字典，node_id -> StoryNode
        variables: 初始变量字典
        global_conditions: 全局条件列表
        end_nodes: 终止节点 ID 列表
    """
    graph_id: str = ""
    start_node: str = ""
    nodes: Dict[str, StoryNode] = field(default_factory=dict)
    variables: Dict[str, Any] = field(default_factory=dict)
    global_conditions: List[ConditionData] = field(default_factory=list)
    end_nodes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """将剧情图序列化为字典

        Returns:
            包含所有字段的字典，节点递归序列化
        """
        return {
            "graph_id": self.graph_id,
            "start_node": self.start_node,
            "nodes": {nid: node.to_dict() for nid, node in self.nodes.items()},
            "variables": dict(self.variables),
            "global_conditions": [c.to_dict() for c in self.global_conditions],
            "end_nodes": list(self.end_nodes),
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "StoryGraph":
        """从字典反序列化创建 StoryGraph 实例

        Args:
            d: 包含剧情图数据的字典

        Returns:
            StoryGraph 实例
        """
        nodes = {
            nid: StoryNode.from_dict(node_data)
            for nid, node_data in d.get("nodes", {}).items()
        }
        global_conditions = [
            ConditionData.from_dict(c) for c in d.get("global_conditions", [])
        ]
        return cls(
            graph_id=d.get("graph_id", ""),
            start_node=d.get("start_node", ""),
            nodes=nodes,
            variables=d.get("variables", {}),
            global_conditions=global_conditions,
            end_nodes=d.get("end_nodes", []),
        )

    def get_node(self, node_id: str) -> Optional[StoryNode]:
        """根据节点 ID 获取节点

        Args:
            node_id: 节点 ID

        Returns:
            StoryNode 实例，不存在则返回 None
        """
        return self.nodes.get(node_id)

    def add_node(self, node: StoryNode) -> None:
        """添加节点到剧情图

        Args:
            node: 要添加的 StoryNode 实例
        """
        self.nodes[node.node_id] = node
