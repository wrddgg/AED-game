"""AED 急救互动剧情游戏 - 剧情配置解析器模块

提供 StoryConfigParser 类，负责将 JSON 原始数据解析为
StoryGraph、StoryNode、ChoiceData、ConditionData、ActionData
等结构化数据对象，并校验剧情图的连通性。
"""

from typing import Any, Dict, List, Tuple

from src.models.story_data import (
    ActionData,
    ChoiceData,
    ConditionData,
    StoryGraph,
    StoryNode,
)


class StoryConfigParser:
    """剧情配置解析器

    将 JSON 字典数据解析为剧情图相关的数据类实例。
    """

    def parse_story_graph(self, data: Dict[str, Any]) -> StoryGraph:
        """解析完整剧情图

        Args:
            data: 剧情图的 JSON 原始数据

        Returns:
            StoryGraph 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(data, dict):
            raise ValueError("剧情图数据必须是字典类型")

        graph_id = data.get("graph_id", "")
        start_node = data.get("start_node", "")
        variables = data.get("variables", {})
        end_nodes = data.get("end_nodes", [])

        nodes: Dict[str, StoryNode] = {}
        raw_nodes = data.get("nodes", {})
        if isinstance(raw_nodes, dict):
            for node_id, node_data in raw_nodes.items():
                if isinstance(node_data, dict):
                    node_data.setdefault("node_id", node_id)
                    nodes[node_id] = self.parse_node(node_data)

        global_conditions: List[ConditionData] = []
        for cond_data in data.get("global_conditions", []):
            if isinstance(cond_data, dict):
                global_conditions.append(self.parse_condition(cond_data))

        return StoryGraph(
            graph_id=graph_id,
            start_node=start_node,
            nodes=nodes,
            variables=variables,
            global_conditions=global_conditions,
            end_nodes=end_nodes,
        )

    def parse_node(self, node_data: Dict[str, Any]) -> StoryNode:
        """解析单节点

        Args:
            node_data: 节点的 JSON 原始数据

        Returns:
            StoryNode 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(node_data, dict):
            raise ValueError("节点数据必须是字典类型")

        choices: List[ChoiceData] = []
        for choice_data in node_data.get("choices", []):
            if isinstance(choice_data, dict):
                choices.append(self.parse_choice(choice_data))

        actions: List[ActionData] = []
        for action_data in node_data.get("actions", []):
            if isinstance(action_data, dict):
                actions.append(self.parse_action(action_data))

        exit_actions: List[ActionData] = []
        for action_data in node_data.get("exit_actions", []):
            if isinstance(action_data, dict):
                exit_actions.append(self.parse_action(action_data))

        conditions: List[ConditionData] = []
        for cond_data in node_data.get("conditions", []):
            if isinstance(cond_data, dict):
                conditions.append(self.parse_condition(cond_data))

        return StoryNode(
            node_id=node_data.get("node_id", ""),
            type=node_data.get("type", ""),
            title=node_data.get("title", ""),
            text=node_data.get("text", ""),
            video=node_data.get("video", ""),
            animation=node_data.get("animation", ""),
            audio=node_data.get("audio", ""),
            background=node_data.get("background", ""),
            duration=node_data.get("duration", 0.0),
            choices=choices,
            actions=actions,
            exit_actions=exit_actions,
            conditions=conditions,
            next_node=node_data.get("next_node", ""),
            failure_node=node_data.get("failure_node", ""),
            help_topic=node_data.get("help_topic", ""),
            tags=node_data.get("tags", []),
        )

    def parse_choice(self, choice_data: Dict[str, Any]) -> ChoiceData:
        """解析选项

        Args:
            choice_data: 选项的 JSON 原始数据

        Returns:
            ChoiceData 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(choice_data, dict):
            raise ValueError("选项数据必须是字典类型")

        conditions: List[ConditionData] = []
        for cond_data in choice_data.get("conditions", []):
            if isinstance(cond_data, dict):
                conditions.append(self.parse_condition(cond_data))

        effects: List[ActionData] = []
        for effect_data in choice_data.get("effects", []):
            if isinstance(effect_data, dict):
                effects.append(self.parse_action(effect_data))

        return ChoiceData(
            choice_id=choice_data.get("choice_id", ""),
            text=choice_data.get("text", ""),
            next_node=choice_data.get("next_node", ""),
            conditions=conditions,
            effects=effects,
            is_correct=choice_data.get("is_correct", False),
            feedback_text=choice_data.get("feedback_text", ""),
        )

    def parse_condition(self, cond_data: Dict[str, Any]) -> ConditionData:
        """解析条件（支持嵌套递归）

        Args:
            cond_data: 条件的 JSON 原始数据

        Returns:
            ConditionData 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(cond_data, dict):
            raise ValueError("条件数据必须是字典类型")

        and_conditions: List[ConditionData] = []
        for sub_cond in cond_data.get("and_conditions", []):
            if isinstance(sub_cond, dict):
                and_conditions.append(self.parse_condition(sub_cond))

        or_conditions: List[ConditionData] = []
        for sub_cond in cond_data.get("or_conditions", []):
            if isinstance(sub_cond, dict):
                or_conditions.append(self.parse_condition(sub_cond))

        not_data = cond_data.get("not_condition")
        not_condition = None
        if not_data and isinstance(not_data, dict):
            not_condition = self.parse_condition(not_data)

        return ConditionData(
            type=cond_data.get("type", ""),
            key=cond_data.get("key", ""),
            operator=cond_data.get("operator", "eq"),
            value=cond_data.get("value"),
            and_conditions=and_conditions,
            or_conditions=or_conditions,
            not_condition=not_condition,
        )

    def parse_action(self, action_data: Dict[str, Any]) -> ActionData:
        """解析动作

        Args:
            action_data: 动作的 JSON 原始数据

        Returns:
            ActionData 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(action_data, dict):
            raise ValueError("动作数据必须是字典类型")

        return ActionData(
            type=action_data.get("type", ""),
            key=action_data.get("key", ""),
            value=action_data.get("value"),
            params=action_data.get("params", {}),
        )

    def validate_graph(self, graph: StoryGraph) -> Tuple[bool, List[str]]:
        """校验剧情图的连通性

        检查所有节点引用的目标节点是否存在，确保从起始节点
        出发可以到达所有可达节点，以及终止节点是否可达。

        Args:
            graph: StoryGraph 实例

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        if not graph.graph_id:
            errors.append("剧情图缺少 graph_id")

        if not graph.start_node:
            errors.append("剧情图缺少 start_node")
        elif graph.start_node not in graph.nodes:
            errors.append(f"起始节点 {graph.start_node} 不存在")

        if len(graph.nodes) == 0:
            errors.append("剧情图不能没有节点")
            return False, errors

        # 检查所有节点引用的目标是否存在
        all_node_ids = set(graph.nodes.keys())
        for node_id, node in graph.nodes.items():
            # 检查 next_node 引用
            if node.next_node and node.next_node not in all_node_ids:
                errors.append(
                    f"节点 {node_id} 的 next_node '{node.next_node}' 不存在"
                )

            # 检查 failure_node 引用
            if node.failure_node and node.failure_node not in all_node_ids:
                errors.append(
                    f"节点 {node_id} 的 failure_node '{node.failure_node}' 不存在"
                )

            # 检查选项中的 next_node 引用
            for choice in node.choices:
                if choice.next_node and choice.next_node not in all_node_ids:
                    errors.append(
                        f"节点 {node_id} 的选项 {choice.choice_id} "
                        f"引用的 next_node '{choice.next_node}' 不存在"
                    )

        # 检查终止节点是否可达（从起始节点 BFS）
        if graph.start_node in graph.nodes:
            reachable = set()
            queue = [graph.start_node]
            while queue:
                current_id = queue.pop(0)
                if current_id in reachable:
                    continue
                reachable.add(current_id)
                current_node = graph.nodes.get(current_id)
                if current_node is None:
                    continue
                # 收集所有可达的下一节点
                next_ids = set()
                if current_node.next_node:
                    next_ids.add(current_node.next_node)
                if current_node.failure_node:
                    next_ids.add(current_node.failure_node)
                for choice in current_node.choices:
                    if choice.next_node:
                        next_ids.add(choice.next_node)
                for nid in next_ids:
                    if nid not in reachable:
                        queue.append(nid)

            # 检查终止节点是否在可达范围内
            for end_node_id in graph.end_nodes:
                if end_node_id not in reachable:
                    errors.append(
                        f"终止节点 {end_node_id} 从起始节点不可达"
                    )

            # 检查是否有孤立节点
            for node_id in all_node_ids:
                if node_id not in reachable:
                    errors.append(f"节点 {node_id} 从起始节点不可达（孤立节点）")

        return len(errors) == 0, errors
