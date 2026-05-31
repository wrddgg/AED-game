"""急救流程管理模块。

管理整个急救场景的步骤推进、状态追踪和事件发布。
与 MedicalRuleEngine 协作验证步骤正确性，通过 EventBus 发布流程事件。
"""

from __future__ import annotations

import time
from typing import Any, Optional

from src.rescue.patient_state import PatientState


class RescueFlow:
    """急救流程控制器，管理急救场景的步骤推进和状态变化。

    通过事件总线发布流程事件，与医疗规则引擎协作验证步骤正确性。

    Attributes:
        event_bus: 事件总线实例
        patient_state: 病人状态实例
        timer_manager: 计时管理器
    """

    def __init__(
        self,
        event_bus: Any,
        patient_state: PatientState,
        timer_manager: Optional[Any] = None,
    ) -> None:
        """初始化急救流程控制器。

        Args:
            event_bus: 事件总线，用于发布流程事件
            patient_state: 病人状态实例
            timer_manager: 可选的计时管理器
        """
        self.event_bus = event_bus
        self.patient_state = patient_state
        self.timer_manager = timer_manager

        self._scenario_id: str = ""
        self._steps: list[dict] = []
        self._current_step_index: int = 0
        self._completed_steps: list[str] = []
        self._failed_steps: list[dict] = []
        self._skipped_steps: list[str] = []
        self._is_active: bool = False
        self._start_time: float = 0.0
        self._medical_config: dict = {}

    # ---------- 公开接口 ----------

    def start_scenario(self, scenario_id: str) -> None:
        """启动急救场景。

        加载医疗配置，初始化病人状态，开始步骤追踪。

        Args:
            scenario_id: 场景 ID
        """
        self._scenario_id = scenario_id
        self._medical_config = self._load_medical_config(scenario_id)
        self._steps = self._medical_config.get("steps", [])
        self._current_step_index = 0
        self._completed_steps = []
        self._failed_steps = []
        self._skipped_steps = []
        self._is_active = True
        self._start_time = time.time()

        # 根据配置初始化病人状态
        initial_state = self._medical_config.get("initial_patient_state", {})
        if initial_state:
            self.patient_state.set_state(initial_state)

        self._emit("RescueScenarioStarted", {
            "scenario_id": scenario_id,
            "total_steps": len(self._steps),
        })

    def advance_step(self, step_id: str) -> None:
        """推进到下一步。

        检查 step_id 是否为当前期望的步骤，如果正确则标记完成并推进。

        Args:
            step_id: 要推进的步骤 ID
        """
        if not self._is_active:
            raise RuntimeError("急救流程未启动，无法推进步骤")

        current_step = self.get_current_step()
        if current_step is None:
            raise RuntimeError("没有当前可推进的步骤")

        if current_step.get("id") != step_id:
            self.fail_step(step_id, f"步骤顺序错误：期望 '{current_step.get('id')}'，实际 '{step_id}'")
            return

        self._completed_steps.append(step_id)
        self._current_step_index += 1

        # 步骤完成时恢复病人状态
        recovery = current_step.get("recovery", 0)
        if recovery > 0:
            self.patient_state.apply_recovery(recovery)

        self._emit("RescueStepAdvanced", {
            "step_id": step_id,
            "step_index": self._current_step_index - 1,
            "remaining_steps": len(self._steps) - self._current_step_index,
        })

        # 检查是否所有步骤都已完成
        if self._current_step_index >= len(self._steps):
            self.finish()

    def fail_step(self, step_id: str, reason: str) -> None:
        """记录步骤失败。

        执行错误后果（扣病人状态等），发布失败事件，记录失误。

        Args:
            step_id: 失败的步骤 ID
            reason: 失败原因
        """
        if not self._is_active:
            return

        # 查找步骤配置以获取错误后果
        step_config = self._find_step_config(step_id)
        consequence = step_config.get("error_consequence", {}) if step_config else {}

        # 执行后果：扣除病人状态
        damage = consequence.get("damage", 10)
        self.patient_state.apply_damage(damage)

        self._failed_steps.append({
            "step_id": step_id,
            "reason": reason,
            "consequence": consequence,
            "timestamp": time.time() - self._start_time,
        })

        self._emit("RescueStepFailed", {
            "step_id": step_id,
            "reason": reason,
            "consequence": consequence,
        })

        # 如果病人死亡，结束流程
        if self.patient_state.is_dead():
            self._is_active = False
            self._emit("RescueFlowFailed", {
                "reason": "病人已死亡",
                "scenario_id": self._scenario_id,
            })

    def skip_step(self, step_id: str) -> None:
        """跳过指定步骤。

        Args:
            step_id: 要跳过的步骤 ID
        """
        if not self._is_active:
            return

        self._skipped_steps.append(step_id)
        self._current_step_index += 1

        self._emit("RescueStepSkipped", {
            "step_id": step_id,
        })

        if self._current_step_index >= len(self._steps):
            self.finish()

    def finish(self) -> None:
        """完成急救流程。"""
        self._is_active = False
        elapsed = time.time() - self._start_time

        self._emit("RescueFlowFinished", {
            "scenario_id": self._scenario_id,
            "completed_steps": len(self._completed_steps),
            "failed_steps": len(self._failed_steps),
            "skipped_steps": len(self._skipped_steps),
            "total_steps": len(self._steps),
            "time_elapsed": elapsed,
            "patient_condition": self.patient_state.get_state().get("condition"),
        })

    def get_current_step(self) -> Optional[dict]:
        """获取当前步骤配置。

        Returns:
            当前步骤字典，若流程未激活或已完成则返回 None
        """
        if not self._is_active or self._current_step_index >= len(self._steps):
            return None
        return self._steps[self._current_step_index]

    def get_progress(self) -> dict:
        """获取当前进度信息。

        Returns:
            包含 total_steps, completed_steps, current_step, success_rate 的字典
        """
        total = len(self._steps)
        completed = len(self._completed_steps)
        success_rate = (completed / total * 100) if total > 0 else 0.0

        return {
            "total_steps": total,
            "completed_steps": completed,
            "current_step": self.get_current_step(),
            "success_rate": success_rate,
            "failed_steps": len(self._failed_steps),
            "skipped_steps": len(self._skipped_steps),
        }

    # ---------- 内部方法 ----------

    def _load_medical_config(self, config_id: str) -> dict:
        """加载医疗配置。

        Args:
            config_id: 配置 ID

        Returns:
            医疗配置字典
        """
        # 默认 AED 急救配置
        default_config: dict[str, Any] = {
            "id": "aed_rescue_default",
            "name": "AED急救标准流程",
            "initial_patient_state": {
                "heart_rate": 0,
                "breathing": False,
                "consciousness": "unconscious",
                "condition": "critical",
            },
            "steps": [
                {
                    "id": "check_safety",
                    "name": "确认现场安全",
                    "description": "确认现场环境对施救者和病人是安全的",
                    "recovery": 5,
                    "error_consequence": {"damage": 15},
                },
                {
                    "id": "check_consciousness",
                    "name": "检查意识",
                    "description": "轻拍病人肩膀，大声呼唤",
                    "recovery": 5,
                    "error_consequence": {"damage": 10},
                },
                {
                    "id": "call_emergency",
                    "name": "拨打急救电话",
                    "description": "拨打120或当地急救电话",
                    "recovery": 5,
                    "error_consequence": {"damage": 20},
                },
                {
                    "id": "check_breathing",
                    "name": "检查呼吸",
                    "description": "观察病人胸部起伏，5-10秒内判断呼吸",
                    "recovery": 5,
                    "error_consequence": {"damage": 10},
                },
                {
                    "id": "start_cpr",
                    "name": "开始心肺复苏",
                    "description": "30次胸外按压+2次人工呼吸",
                    "recovery": 15,
                    "error_consequence": {"damage": 15},
                },
                {
                    "id": "use_aed",
                    "name": "使用AED",
                    "description": "打开AED，按指示贴电极片，听从语音提示",
                    "recovery": 25,
                    "error_consequence": {"damage": 25},
                },
                {
                    "id": "follow_aed_prompt",
                    "name": "按AED指示操作",
                    "description": "AED分析心律后，按指示电击或继续CPR",
                    "recovery": 20,
                    "error_consequence": {"damage": 20},
                },
                {
                    "id": "continue_cpr",
                    "name": "继续CPR",
                    "description": "电击后立即继续CPR，直到急救人员到达",
                    "recovery": 15,
                    "error_consequence": {"damage": 10},
                },
            ],
        }

        return default_config

    def _find_step_config(self, step_id: str) -> Optional[dict]:
        """根据 step_id 查找步骤配置。

        Args:
            step_id: 步骤 ID

        Returns:
            步骤配置字典，未找到返回 None
        """
        for step in self._steps:
            if step.get("id") == step_id:
                return step
        return None

    def _emit(self, event_type: str, data: dict) -> None:
        """通过事件总线发布事件。

        Args:
            event_type: 事件类型
            data: 事件数据
        """
        if self.event_bus is not None and hasattr(self.event_bus, "emit"):
            self.event_bus.emit(event_type, data)
