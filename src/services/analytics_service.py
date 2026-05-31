"""数据分析服务模块

提供游戏行为数据收集、统计和分析功能，
帮助了解玩家行为模式和游戏难度适配。
"""

import json
import os
import time
from collections import defaultdict
from typing import Any, Dict, List, Optional

from src.core.logger import get_logger

logger = get_logger("analytics_service")


class AnalyticsService:
    """数据分析服务

    收集游戏中的关键事件数据，提供统计汇总和趋势分析。
    数据以 JSON 格式存储在本地。
    """

    DEFAULT_PATH: str = os.path.join("data", "cache", "analytics.json")

    def __init__(self, file_path: Optional[str] = None) -> None:
        """初始化数据分析服务

        Args:
            file_path: 数据存储文件路径，默认为 data/cache/analytics.json
        """
        self._file_path: str = file_path or self.DEFAULT_PATH
        self._events: List[Dict[str, Any]] = []
        self._session_start: Optional[float] = None
        self._session_id: Optional[str] = None
        self._load()

    def _load(self) -> None:
        """从 JSON 文件加载已收集的数据。"""
        if not os.path.exists(self._file_path):
            self._events = []
            return
        try:
            with open(self._file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._events = data.get("events", [])
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"加载分析数据失败: {e}")
            self._events = []

    def _save(self) -> None:
        """将数据保存到 JSON 文件。"""
        os.makedirs(os.path.dirname(self._file_path), exist_ok=True)
        try:
            with open(self._file_path, "w", encoding="utf-8") as f:
                json.dump({"events": self._events}, f, ensure_ascii=False, indent=2)
        except IOError as e:
            logger.error(f"保存分析数据失败: {e}")

    def start_session(self, session_id: str) -> None:
        """开始一个游戏会话

        Args:
            session_id: 会话标识
        """
        self._session_id = session_id
        self._session_start = time.time()
        self.track_event("session_start", {"session_id": session_id})

    def end_session(self) -> None:
        """结束当前游戏会话。"""
        if self._session_id is None:
            return

        duration = time.time() - (self._session_start or time.time())
        self.track_event("session_end", {
            "session_id": self._session_id,
            "duration_seconds": round(duration, 1),
        })
        self._session_id = None
        self._session_start = None

    def track_event(
        self,
        event_name: str,
        properties: Optional[Dict[str, Any]] = None,
    ) -> None:
        """记录一个事件

        Args:
            event_name: 事件名称
            properties: 事件属性
        """
        event = {
            "event": event_name,
            "timestamp": time.time(),
            "session_id": self._session_id,
            "properties": properties or {},
        }
        self._events.append(event)
        self._save()

        # 保持事件数量在合理范围内（最多1000条）
        if len(self._events) > 1000:
            self._events = self._events[-800:]
            self._save()

    def track_scenario_start(self, scenario_id: str) -> None:
        """记录场景开始事件

        Args:
            scenario_id: 场景标识
        """
        self.track_event("scenario_start", {"scenario_id": scenario_id})

    def track_scenario_complete(
        self,
        scenario_id: str,
        success: bool,
        score: int,
        elapsed_time: float,
    ) -> None:
        """记录场景完成事件

        Args:
            scenario_id: 场景标识
            success: 是否成功
            score: 得分
            elapsed_time: 用时（秒）
        """
        self.track_event("scenario_complete", {
            "scenario_id": scenario_id,
            "success": success,
            "score": score,
            "elapsed_time": round(elapsed_time, 1),
        })

    def track_choice(self, node_id: str, choice_id: str) -> None:
        """记录玩家选择事件

        Args:
            node_id: 节点标识
            choice_id: 选项标识
        """
        self.track_event("choice_made", {
            "node_id": node_id,
            "choice_id": choice_id,
        })

    def track_minigame(self, game_type: str, success: bool, score: int) -> None:
        """记录小游戏事件

        Args:
            game_type: 游戏类型
            success: 是否成功
            score: 得分
        """
        self.track_event("minigame_complete", {
            "game_type": game_type,
            "success": success,
            "score": score,
        })

    def track_rescue_step(self, step_id: str, success: bool) -> None:
        """记录急救步骤事件

        Args:
            step_id: 步骤标识
            success: 是否成功
        """
        self.track_event("rescue_step", {
            "step_id": step_id,
            "success": success,
        })

    def get_event_count(self, event_name: Optional[str] = None) -> int:
        """获取事件计数

        Args:
            event_name: 事件名称过滤，None 表示全部

        Returns:
            事件数量
        """
        if event_name is None:
            return len(self._events)
        return sum(1 for e in self._events if e.get("event") == event_name)

    def get_scenario_stats(self, scenario_id: Optional[str] = None) -> Dict[str, Any]:
        """获取场景统计

        Args:
            scenario_id: 场景标识，None 表示全部场景汇总

        Returns:
            统计信息字典，包含完成次数、成功率、平均分数、平均用时等
        """
        completions = [
            e for e in self._events
            if e.get("event") == "scenario_complete"
            and (scenario_id is None or e.get("properties", {}).get("scenario_id") == scenario_id)
        ]

        if not completions:
            return {
                "total_completions": 0,
                "success_rate": 0.0,
                "avg_score": 0.0,
                "avg_time": 0.0,
            }

        total = len(completions)
        successes = sum(1 for e in completions if e.get("properties", {}).get("success", False))
        scores = [e.get("properties", {}).get("score", 0) for e in completions]
        times = [e.get("properties", {}).get("elapsed_time", 0) for e in completions]

        return {
            "total_completions": total,
            "success_rate": round(successes / total, 3) if total > 0 else 0.0,
            "avg_score": round(sum(scores) / total, 1) if total > 0 else 0.0,
            "avg_time": round(sum(times) / total, 1) if total > 0 else 0.0,
            "best_score": max(scores) if scores else 0,
            "fastest_time": min(times) if times else 0.0,
        }

    def get_choice_distribution(self, node_id: str) -> Dict[str, int]:
        """获取指定节点的选择分布

        Args:
            node_id: 节点标识

        Returns:
            choice_id -> 选中次数 的字典
        """
        distribution: Dict[str, int] = defaultdict(int)
        for e in self._events:
            if e.get("event") == "choice_made":
                props = e.get("properties", {})
                if props.get("node_id") == node_id:
                    choice_id = props.get("choice_id", "unknown")
                    distribution[choice_id] += 1
        return dict(distribution)

    def get_rescue_accuracy(self) -> Dict[str, Any]:
        """获取急救步骤准确率

        Returns:
            总体和各步骤的准确率统计
        """
        steps = [
            e for e in self._events
            if e.get("event") == "rescue_step"
        ]

        if not steps:
            return {"total_steps": 0, "overall_accuracy": 0.0, "by_step": {}}

        total = len(steps)
        correct = sum(1 for e in steps if e.get("properties", {}).get("success", False))

        # 按步骤统计
        by_step: Dict[str, Dict[str, int]] = defaultdict(lambda: {"total": 0, "correct": 0})
        for e in steps:
            step_id = e.get("properties", {}).get("step_id", "unknown")
            by_step[step_id]["total"] += 1
            if e.get("properties", {}).get("success", False):
                by_step[step_id]["correct"] += 1

        step_accuracy = {
            sid: round(data["correct"] / data["total"], 3) if data["total"] > 0 else 0.0
            for sid, data in by_step.items()
        }

        return {
            "total_steps": total,
            "overall_accuracy": round(correct / total, 3) if total > 0 else 0.0,
            "by_step": step_accuracy,
        }

    def get_summary(self) -> Dict[str, Any]:
        """获取全局数据摘要

        Returns:
            包含主要统计指标的字典
        """
        session_count = self.get_event_count("session_start")
        scenario_completions = self.get_event_count("scenario_complete")
        choices_made = self.get_event_count("choice_made")
        minigames = self.get_event_count("minigame_complete")

        return {
            "total_events": len(self._events),
            "session_count": session_count,
            "scenario_completions": scenario_completions,
            "choices_made": choices_made,
            "minigames_played": minigames,
            "scenario_stats": self.get_scenario_stats(),
            "rescue_accuracy": self.get_rescue_accuracy(),
        }

    def reset_all(self) -> None:
        """重置所有分析数据。"""
        self._events = []
        self._session_id = None
        self._session_start = None
        self._save()
        logger.info("分析数据已重置")
