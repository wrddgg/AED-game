"""急救结果分析模块。

分析游戏记录，生成评级、错误摘要、改进建议等，
为玩家提供详细的急救表现反馈。
"""

from __future__ import annotations

from typing import Any, Optional


# 评级阈值配置
RATING_THRESHOLDS: dict[str, float] = {
    "S": 90.0,
    "A": 75.0,
    "B": 60.0,
    "C": 40.0,
    "D": 0.0,
}


class ResultAnalyzer:
    """急救结果分析器，分析游戏记录并生成评估报告。

    根据完成时间、准确率、失误情况等维度，对玩家的急救表现
    进行综合评级，并生成改进建议。

    Implements IResultAnalyzer concept.
    """

    def analyze(self, record: dict) -> dict:
        """分析游戏记录，返回综合评估结果。

        Args:
            record: 游戏记录字典，包含：
                - completed_steps: 完成的步骤列表
                - failed_steps: 失败步骤列表
                - skipped_steps: 跳过步骤列表
                - total_steps: 总步骤数
                - time_elapsed: 用时（秒）
                - patient_condition: 病人最终状态
                - patient_score: 病人最终评分
                - scenario_id: 场景 ID

        Returns:
            分析结果字典，包含：
                - overall_rating: S/A/B/C/D 评级
                - time_score: 时间评分 (0-100)
                - accuracy_score: 准确率评分 (0-100)
                - mistakes_summary: 错误摘要列表
                - correct_steps: 正确步骤列表
                - missed_steps: 遗漏步骤列表
                - patient_outcome: 病人结局
                - tips: 改进建议列表
                - ending_type: 结局类型
        """
        completed_steps = record.get("completed_steps", [])
        failed_steps = record.get("failed_steps", [])
        skipped_steps = record.get("skipped_steps", [])
        total_steps = record.get("total_steps", 0)
        time_elapsed = record.get("time_elapsed", 0.0)
        patient_condition = record.get("patient_condition", "unknown")
        patient_score = record.get("patient_score", 0.0)

        # 计算时间评分（假设最佳时间 60 秒，超时 300 秒为 0 分）
        time_score = self._calculate_time_score(time_elapsed, total_steps)

        # 计算准确率评分
        accuracy_score = self._calculate_accuracy_score(
            completed_steps, failed_steps, skipped_steps, total_steps
        )

        # 综合评分
        combined_score = time_score * 0.4 + accuracy_score * 0.6
        overall_rating = self._calculate_rating({
            "time_score": time_score,
            "accuracy_score": accuracy_score,
            "combined_score": combined_score,
        })

        # 生成错误摘要
        mistakes_summary = self._build_mistakes_summary(failed_steps, skipped_steps)

        # 确定遗漏步骤
        missed_steps = self._find_missed_steps(completed_steps, skipped_steps, total_steps)

        # 判断病人结局
        patient_outcome = self._determine_patient_outcome(patient_condition, patient_score)

        # 生成改进建议
        tips = self._generate_tips(mistakes_summary + [
            {"step_id": s, "reason": "步骤被跳过"} for s in skipped_steps
        ])

        # 确定结局类型
        ending_type = self._determine_ending_type(overall_rating, patient_outcome)

        return {
            "overall_rating": overall_rating,
            "time_score": round(time_score, 1),
            "accuracy_score": round(accuracy_score, 1),
            "mistakes_summary": mistakes_summary,
            "correct_steps": completed_steps,
            "missed_steps": missed_steps,
            "patient_outcome": patient_outcome,
            "tips": tips,
            "ending_type": ending_type,
        }

    # ---------- 内部方法 ----------

    def _calculate_rating(self, scores: dict) -> str:
        """根据综合评分计算评级。

        Args:
            scores: 包含 combined_score 的评分字典

        Returns:
            S/A/B/C/D 评级字符串
        """
        combined = scores.get("combined_score", 0.0)
        for rating, threshold in RATING_THRESHOLDS.items():
            if combined >= threshold:
                return rating
        return "D"

    def _calculate_time_score(self, time_elapsed: float, total_steps: int) -> float:
        """计算时间评分。

        Args:
            time_elapsed: 实际用时（秒）
            total_steps: 总步骤数

        Returns:
            时间评分 (0-100)
        """
        if time_elapsed <= 0:
            return 100.0

        # 最佳时间估算：每步骤约 8 秒
        optimal_time = total_steps * 8.0
        # 可接受的最长时间
        max_time = optimal_time * 5.0

        if time_elapsed <= optimal_time:
            return 100.0
        elif time_elapsed >= max_time:
            return 0.0
        else:
            # 线性衰减
            ratio = (time_elapsed - optimal_time) / (max_time - optimal_time)
            return 100.0 * (1.0 - ratio)

    def _calculate_accuracy_score(
        self,
        completed: list,
        failed: list,
        skipped: list,
        total: int,
    ) -> float:
        """计算准确率评分。

        Args:
            completed: 完成的步骤列表
            failed: 失败步骤列表
            skipped: 跳过步骤列表
            total: 总步骤数

        Returns:
            准确率评分 (0-100)
        """
        if total <= 0:
            return 100.0

        correct_count = len(completed)
        fail_penalty = len(failed) * 0.5
        skip_penalty = len(skipped) * 0.3

        effective_score = max(0, correct_count - fail_penalty - skip_penalty)
        return (effective_score / total) * 100.0

    def _build_mistakes_summary(self, failed_steps: list, skipped_steps: list) -> list[dict]:
        """构建错误摘要列表。

        Args:
            failed_steps: 失败步骤列表
            skipped_steps: 跳过步骤列表

        Returns:
            错误摘要字典列表
        """
        summary: list[dict] = []

        for step in failed_steps:
            if isinstance(step, dict):
                summary.append({
                    "step_id": step.get("step_id", "unknown"),
                    "reason": step.get("reason", "步骤执行失败"),
                    "type": "failure",
                })
            else:
                summary.append({
                    "step_id": str(step),
                    "reason": "步骤执行失败",
                    "type": "failure",
                })

        return summary

    def _find_missed_steps(
        self,
        completed: list,
        skipped: list,
        total: int,
    ) -> list[str]:
        """找出遗漏的步骤。

        Args:
            completed: 已完成步骤
            skipped: 已跳过步骤
            total: 总步骤数

        Returns:
            遗漏步骤 ID 列表
        """
        missed: list[str] = []
        # 跳过的步骤视为遗漏
        for step in skipped:
            if isinstance(step, str):
                missed.append(step)
            elif isinstance(step, dict):
                missed.append(step.get("step_id", "unknown"))
        return missed

    def _determine_patient_outcome(self, condition: str, score: float) -> str:
        """判断病人结局。

        Args:
            condition: 病人最终状态
            score: 病人最终评分

        Returns:
            结局描述字符串
        """
        if condition == "dead" or score <= 0:
            return "病人不幸身亡"
        elif condition == "recovering":
            return "病人恢复良好"
        elif condition == "stable":
            return "病人情况稳定"
        elif condition == "unstable":
            return "病人情况不稳定，需继续观察"
        else:
            return "病人情况未知"

    def _generate_tips(self, mistakes: list) -> list[str]:
        """根据错误生成改进建议。

        Args:
            mistakes: 错误摘要列表

        Returns:
            改进建议字符串列表
        """
        tips: list[str] = []

        if not mistakes:
            tips.append("完美操作！继续保持！")
            return tips

        # 统计错误类型
        failure_count = sum(1 for m in mistakes if m.get("type") == "failure")
        skip_count = sum(1 for m in mistakes if m.get("reason") == "步骤被跳过")

        if failure_count > 2:
            tips.append("建议复习急救操作步骤，确保每个步骤的正确顺序")

        if skip_count > 0:
            tips.append("不要跳过任何急救步骤，每个步骤都至关重要")

        # 针对具体步骤的建议
        step_specific_tips: dict[str, str] = {
            "check_safety": "施救前务必确认现场安全，保护自己也保护病人",
            "check_consciousness": "正确检查意识：轻拍双肩，大声呼唤",
            "call_emergency": "第一时间拨打急救电话，争取专业救援",
            "check_breathing": "检查呼吸时观察胸部起伏5-10秒，不要仓促判断",
            "start_cpr": "CPR按压深度5-6cm，频率100-120次/分钟",
            "use_aed": "AED开机后听从语音指示，贴好电极片后再分析",
            "follow_aed_prompt": "AED分析时所有人离开病人，电击时确保无人接触",
            "continue_cpr": "电击后立即继续CPR，2分钟一个循环",
        }

        for mistake in mistakes:
            step_id = mistake.get("step_id", "")
            if step_id in step_specific_tips:
                tip = step_specific_tips[step_id]
                if tip not in tips:
                    tips.append(tip)

        if not tips:
            tips.append("建议多练习急救流程，提高操作熟练度")

        return tips

    def _determine_ending_type(self, rating: str, outcome: str) -> str:
        """确定结局类型。

        Args:
            rating: 评级
            outcome: 病人结局

        Returns:
            结局类型字符串
        """
        if "身亡" in outcome:
            return "bad_ending"
        elif rating == "S":
            return "perfect_ending"
        elif rating in ("A", "B"):
            return "good_ending"
        elif rating == "C":
            return "normal_ending"
        else:
            return "bad_ending"
