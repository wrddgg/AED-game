"""AED 急救互动剧情游戏 - 配置校验器模块

提供 ConfigValidator 类，用于校验各类游戏配置数据的完整性和合法性。
包括场景、剧情图、节点、选项、条件、动作、医疗、迷宫等配置的校验。
校验方法返回 (是否合法, 错误信息列表) 元组。
"""

from typing import Any, Dict, List, Tuple


class ConfigValidator:
    """配置校验器

    对各类游戏配置数据进行结构性和语义性校验，
    确保配置数据满足最小完整性和类型约束。
    """

    # 合法的节点类型
    VALID_NODE_TYPES = {"video", "text", "choice", "minigame", "branch", "end"}

    # 合法的条件类型
    VALID_CONDITION_TYPES = {
        "var_compare", "flag_set", "flag_not_set",
        "time_exceeded", "step_completed",
    }

    # 合法的比较运算符
    VALID_OPERATORS = {"eq", "neq", "gt", "lt", "gte", "lte"}

    # 合法的动作类型
    VALID_ACTION_TYPES = {
        "set_var", "add_var", "sub_var", "set_flag", "remove_flag",
        "play_audio", "play_video", "navigate", "trigger_minigame",
        "write_record",
    }

    # 合法的难度
    VALID_DIFFICULTIES = {"easy", "normal", "hard"}

    # 合法的结果类型
    VALID_RESULTS = {"success", "failure", "partial"}

    def _check_required(self, data: Dict[str, Any],
                        required_fields: List[str]) -> List[str]:
        """通用必填字段检查

        Args:
            data: 待检查的数据字典
            required_fields: 必填字段名列表

        Returns:
            错误信息列表
        """
        errors: List[str] = []
        for field_name in required_fields:
            if field_name not in data:
                errors.append(f"缺少必填字段: {field_name}")
            elif data[field_name] == "" and field_name.endswith("_id"):
                errors.append(f"字段 {field_name} 不能为空字符串")
        return errors

    def _check_types(self, data: Dict[str, Any],
                     field_types: Dict[str, type]) -> List[str]:
        """通用字段类型检查

        Args:
            data: 待检查的数据字典
            field_types: 字段名到期望类型的映射

        Returns:
            错误信息列表
        """
        errors: List[str] = []
        for field_name, expected_type in field_types.items():
            if field_name in data and data[field_name] is not None:
                if not isinstance(data[field_name], expected_type):
                    errors.append(
                        f"字段 {field_name} 类型错误: "
                        f"期望 {expected_type.__name__}, "
                        f"实际 {type(data[field_name]).__name__}"
                    )
        return errors

    def validate_scenario(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验场景配置

        Args:
            data: 场景配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(
            data, ["scenario_id", "name", "entry_story_id"]
        ))
        errors.extend(self._check_types(
            data,
            {
                "scenario_id": str,
                "name": str,
                "entry_story_id": str,
                "initial_variables": dict,
            }
        ))

        if "difficulty" in data and data["difficulty"] not in self.VALID_DIFFICULTIES:
            errors.append(
                f"无效的难度值: {data['difficulty']}, "
                f"应为 {self.VALID_DIFFICULTIES}"
            )

        return len(errors) == 0, errors

    def validate_story_graph(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验剧情图配置

        Args:
            data: 剧情图配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(
            data, ["graph_id", "start_node", "nodes"]
        ))
        errors.extend(self._check_types(
            data,
            {
                "graph_id": str,
                "start_node": str,
                "nodes": dict,
                "variables": dict,
                "end_nodes": list,
            }
        ))

        if "nodes" in data and isinstance(data["nodes"], dict):
            if len(data["nodes"]) == 0:
                errors.append("剧情图不能没有节点")
            else:
                for node_id, node_data in data["nodes"].items():
                    if not isinstance(node_data, dict):
                        errors.append(f"节点 {node_id} 数据格式错误")
                        continue
                    node_valid, node_errors = self.validate_node(node_data)
                    if not node_valid:
                        errors.extend(
                            f"节点 {node_id}: {err}" for err in node_errors
                        )

        if "start_node" in data and "nodes" in data and isinstance(data["nodes"], dict):
            if data["start_node"] not in data["nodes"]:
                errors.append(
                    f"起始节点 {data['start_node']} 不在节点列表中"
                )

        return len(errors) == 0, errors

    def validate_node(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验节点配置

        Args:
            data: 节点配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(data, ["node_id", "type"]))
        errors.extend(self._check_types(
            data,
            {
                "node_id": str,
                "type": str,
                "title": str,
                "text": str,
                "duration": (int, float),
            }
        ))

        if "type" in data and data["type"] not in self.VALID_NODE_TYPES:
            errors.append(
                f"无效的节点类型: {data['type']}, "
                f"应为 {self.VALID_NODE_TYPES}"
            )

        if "type" in data and data["type"] == "choice":
            if "choices" not in data or not isinstance(data["choices"], list):
                errors.append("choice 类型节点必须有 choices 列表")
            elif len(data["choices"]) == 0:
                errors.append("choice 类型节点的 choices 不能为空")
            else:
                for i, choice_data in enumerate(data["choices"]):
                    if not isinstance(choice_data, dict):
                        errors.append(f"选项 {i} 数据格式错误")
                        continue
                    choice_valid, choice_errors = self.validate_choice(choice_data)
                    if not choice_valid:
                        errors.extend(
                            f"选项 {i}: {err}" for err in choice_errors
                        )

        if "actions" in data and isinstance(data["actions"], list):
            for i, action_data in enumerate(data["actions"]):
                if not isinstance(action_data, dict):
                    errors.append(f"动作 {i} 数据格式错误")
                    continue
                action_valid, action_errors = self.validate_action(action_data)
                if not action_valid:
                    errors.extend(
                        f"动作 {i}: {err}" for err in action_errors
                    )

        if "conditions" in data and isinstance(data["conditions"], list):
            for i, cond_data in enumerate(data["conditions"]):
                if not isinstance(cond_data, dict):
                    errors.append(f"条件 {i} 数据格式错误")
                    continue
                cond_valid, cond_errors = self.validate_condition(cond_data)
                if not cond_valid:
                    errors.extend(
                        f"条件 {i}: {err}" for err in cond_errors
                    )

        return len(errors) == 0, errors

    def validate_choice(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验选项配置

        Args:
            data: 选项配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(data, ["choice_id", "text"]))
        errors.extend(self._check_types(
            data,
            {
                "choice_id": str,
                "text": str,
                "next_node": str,
                "is_correct": bool,
                "feedback_text": str,
            }
        ))

        return len(errors) == 0, errors

    def validate_condition(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验条件配置

        Args:
            data: 条件配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(data, ["type"]))
        errors.extend(self._check_types(
            data,
            {
                "type": str,
                "key": str,
                "operator": str,
            }
        ))

        if "type" in data and data["type"] not in self.VALID_CONDITION_TYPES:
            errors.append(
                f"无效的条件类型: {data['type']}, "
                f"应为 {self.VALID_CONDITION_TYPES}"
            )

        if "operator" in data and data["operator"] not in self.VALID_OPERATORS:
            errors.append(
                f"无效的运算符: {data['operator']}, "
                f"应为 {self.VALID_OPERATORS}"
            )

        if "and_conditions" in data and isinstance(data["and_conditions"], list):
            for i, cond_data in enumerate(data["and_conditions"]):
                if not isinstance(cond_data, dict):
                    errors.append(f"and_conditions[{i}] 数据格式错误")
                    continue
                cond_valid, cond_errors = self.validate_condition(cond_data)
                if not cond_valid:
                    errors.extend(
                        f"and_conditions[{i}]: {err}" for err in cond_errors
                    )

        if "or_conditions" in data and isinstance(data["or_conditions"], list):
            for i, cond_data in enumerate(data["or_conditions"]):
                if not isinstance(cond_data, dict):
                    errors.append(f"or_conditions[{i}] 数据格式错误")
                    continue
                cond_valid, cond_errors = self.validate_condition(cond_data)
                if not cond_valid:
                    errors.extend(
                        f"or_conditions[{i}]: {err}" for err in cond_errors
                    )

        if "not_condition" in data and isinstance(data["not_condition"], dict):
            cond_valid, cond_errors = self.validate_condition(data["not_condition"])
            if not cond_valid:
                errors.extend(
                    f"not_condition: {err}" for err in cond_errors
                )

        return len(errors) == 0, errors

    def validate_action(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验动作配置

        Args:
            data: 动作配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(data, ["type"]))
        errors.extend(self._check_types(
            data,
            {
                "type": str,
                "key": str,
                "params": dict,
            }
        ))

        if "type" in data and data["type"] not in self.VALID_ACTION_TYPES:
            errors.append(
                f"无效的动作类型: {data['type']}, "
                f"应为 {self.VALID_ACTION_TYPES}"
            )

        var_action_types = {"set_var", "add_var", "sub_var"}
        if "type" in data and data["type"] in var_action_types:
            if "key" not in data or not data["key"]:
                errors.append(f"动作类型 {data['type']} 需要指定 key")

        return len(errors) == 0, errors

    def validate_medical(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验医疗流程配置

        Args:
            data: 医疗配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(
            data, ["steps", "success_condition", "failure_condition"]
        ))
        errors.extend(self._check_types(
            data,
            {
                "steps": list,
                "patient_rules": dict,
            }
        ))

        if "steps" in data and isinstance(data["steps"], list):
            for i, step in enumerate(data["steps"]):
                if not isinstance(step, dict):
                    errors.append(f"步骤 {i} 数据格式错误")
                    continue
                step_required = ["step_id", "name"]
                for field_name in step_required:
                    if field_name not in step:
                        errors.append(f"步骤 {i} 缺少必填字段: {field_name}")

        return len(errors) == 0, errors

    def validate_maze(self, data: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """校验迷宫配置

        Args:
            data: 迷宫配置字典

        Returns:
            (是否合法, 错误信息列表)
        """
        errors: List[str] = []

        errors.extend(self._check_required(
            data, ["difficulty", "size", "start", "end"]
        ))
        errors.extend(self._check_types(
            data,
            {
                "difficulty": str,
                "size": (int, list),
                "time_limit": (int, float),
                "obstacles": list,
                "targets": list,
            }
        ))

        if "difficulty" in data and data["difficulty"] not in self.VALID_DIFFICULTIES:
            errors.append(
                f"无效的难度值: {data['difficulty']}, "
                f"应为 {self.VALID_DIFFICULTIES}"
            )

        if "size" in data:
            if isinstance(data["size"], list) and len(data["size"]) != 2:
                errors.append("size 列表长度必须为 2 (行, 列)")

        return len(errors) == 0, errors
