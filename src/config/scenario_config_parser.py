"""AED 急救互动剧情游戏 - 场景配置解析器模块

提供 ScenarioConfigParser 类，负责将 JSON 原始数据解析为
ScenarioData 结构化数据对象。
"""

from typing import Any, Dict

from src.models.scenario_data import ScenarioData


class ScenarioConfigParser:
    """场景配置解析器

    将 JSON 字典数据解析为 ScenarioData 实例。
    """

    def parse_scenario(self, data: Dict[str, Any]) -> ScenarioData:
        """解析场景配置

        Args:
            data: 场景的 JSON 原始数据

        Returns:
            ScenarioData 实例

        Raises:
            ValueError: 数据格式不合法
        """
        if not isinstance(data, dict):
            raise ValueError("场景数据必须是字典类型")

        return ScenarioData(
            scenario_id=data.get("scenario_id", ""),
            name=data.get("name", ""),
            entry_story_id=data.get("entry_story_id", ""),
            background=data.get("background", ""),
            music=data.get("music", ""),
            initial_variables=data.get("initial_variables", {}),
            medical_config_id=data.get("medical_config_id", ""),
            maze_config_id=data.get("maze_config_id", ""),
            description=data.get("description", ""),
            difficulty=data.get("difficulty", "normal"),
        )
