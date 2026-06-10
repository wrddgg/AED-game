/* ============================================================
   state.js — 《生命守护者》状态变量系统
   按 第一章互动系统表.md 建立
   ============================================================ */

const GameState = {
  // ---- 初始状态 ----
  init() {
    this.press_start_delay = 0;
    this.false_wait_penalty = 0;
    this.resource_activation = null;       // "witness" | "record"
    this.compression_interrupt_time = 0;
    this.compression_quality = 70;          // 0-100, 起始良好
    this.takeover_success = null;           // null | true | false
    this.aed_arrival_timing = "mid";        // "early" | "mid" | "late"
    this.aed_protocol_clean = null;         // null | true | false
    this.witness_credibility = 0;           // 0-6 (三人各0-2)
    this.public_spread = 0;                 // 0-5
    this.family_trust = 0;                 // -2 to 3
    this.wangyuan_burden = 0;              // 0-10
    this.path = [];                        // 选择路径记录
    this.chapter = "prologue";             // prologue | chapter1 | review

    // 证人激活状态
    this.witnesses = {
      sun_jianguo: { activated: false, credibility: 0 },   // 灰西装
      lin_xiaoyu:   { activated: false, credibility: 0 },   // 白衬衫
      ma_zhiguo:    { activated: false, credibility: 0 }    // 保安
    };

    // AED步骤跟踪
    this.aed_step = 0;  // 0=未开始, 1=开箱, 2=擦干, 3=贴片, 4=清场, 5=分析, 6=执行

    // CPR模块
    this.cpr_active = false;
    this.cpr_total_beats = 0;
    this.cpr_good_beats = 0;

    this._listeners = [];
  },

  // ---- 应用效果 ----
  applyEffects(effects) {
    if (!effects) return;

    const feedbacks = [];

    if (effects.press_start_delay !== undefined) {
      const diff = effects.press_start_delay;
      this.press_start_delay += diff;
      feedbacks.push({
        text: `延误时间 ${diff > 0 ? '+' : ''}${diff}秒`,
        type: diff > 0 ? 'negative' : 'positive'
      });
    }
    if (effects.public_spread !== undefined) {
      const diff = effects.public_spread;
      this.public_spread = Math.max(0, Math.min(5, this.public_spread + diff));
      feedbacks.push({
        text: `舆论扩散 ${diff > 0 ? '+' : ''}${diff}`,
        type: diff > 0 ? 'neutral' : 'positive'
      });
    }
    if (effects.false_wait_penalty !== undefined) {
      this.false_wait_penalty += effects.false_wait_penalty;
      feedbacks.push({
        text: `延误时间 +${effects.false_wait_penalty}秒`,
        type: 'negative'
      });
    }
    if (effects.resource_activation !== undefined) {
      this.resource_activation = effects.resource_activation;
    }
    if (effects.witness_credibility !== undefined) {
      this.witness_credibility = Math.max(0, Math.min(6, this.witness_credibility + effects.witness_credibility));
      feedbacks.push({
        text: `证人可信度 +${effects.witness_credibility}`,
        type: 'positive'
      });
    }
    if (effects.compression_quality !== undefined) {
      this.compression_quality = Math.max(0, Math.min(100, this.compression_quality + effects.compression_quality));
      feedbacks.push({
        text: `按压质量 ${effects.compression_quality > 0 ? '+' : ''}${effects.compression_quality}`,
        type: effects.compression_quality >= 0 ? 'positive' : 'negative'
      });
    }
    if (effects.compression_interrupt_time !== undefined) {
      this.compression_interrupt_time += effects.compression_interrupt_time;
      if (effects.compression_interrupt_time > 0) {
        feedbacks.push({
          text: `按压中断 +${effects.compression_interrupt_time}秒`,
          type: 'negative'
        });
      }
    }
    if (effects.takeover_success !== undefined) {
      this.takeover_success = effects.takeover_success;
    }
    if (effects.aed_arrival_timing !== undefined) {
      this.aed_arrival_timing = effects.aed_arrival_timing;
      const label = effects.aed_arrival_timing === "early" ? "提前" :
                     effects.aed_arrival_timing === "late" ? "延迟" : "正常";
      feedbacks.push({
        text: `AED到场：${label}`,
        type: effects.aed_arrival_timing === "early" ? 'positive' : 'neutral'
      });
    }
    if (effects.aed_protocol_clean !== undefined) {
      this.aed_protocol_clean = effects.aed_protocol_clean;
      feedbacks.push({
        text: effects.aed_protocol_clean ? 'AED流程：规范' : 'AED流程：存在瑕疵',
        type: effects.aed_protocol_clean ? 'positive' : 'negative'
      });
    }
    if (effects.family_trust !== undefined) {
      this.family_trust = Math.max(-2, Math.min(3, this.family_trust + effects.family_trust));
      feedbacks.push({
        text: `家属信任 ${effects.family_trust > 0 ? '+' : ''}${effects.family_trust}`,
        type: effects.family_trust >= 0 ? 'positive' : 'negative'
      });
    }
    if (effects.wangyuan_burden !== undefined) {
      this.wangyuan_burden = Math.max(0, Math.min(10, this.wangyuan_burden + effects.wangyuan_burden));
      feedbacks.push({
        text: `心理负担 ${effects.wangyuan_burden > 0 ? '+' : ''}${effects.wangyuan_burden}`,
        type: effects.wangyuan_burden > 0 ? 'negative' : 'positive'
      });
    }

    // 记录路径
    if (effects._pathLabel) {
      this.path.push(effects._pathLabel);
    }

    // 触发监听器
    this._notify(feedbacks);

    return feedbacks;
  },

  // ---- 激活证人 ----
  activateWitness(name, credibilityGain) {
    if (this.witnesses[name]) {
      this.witnesses[name].activated = true;
      this.witnesses[name].credibility = credibilityGain || 1;
      this.witness_credibility = Math.min(6,
        this.witnesses.sun_jianguo.credibility +
        this.witnesses.lin_xiaoyu.credibility +
        this.witnesses.ma_zhiguo.credibility
      );
    }
  },

  // ---- 获取激活证人数量 ----
  getActiveWitnessCount() {
    return Object.values(this.witnesses).filter(w => w.activated).length;
  },

  // ---- 获取AED状态文本 ----
  getAedStatusText() {
    const map = {
      0: "未调度",
      1: "取回中",
      2: "到场边",
      3: "贴片中",
      4: "分析中",
      5: "按提示执行"
    };
    return map[this.aed_step] || "未调度";
  },

  // ---- 按压质量评级 ----
  getCompressionQualityLabel() {
    const q = this.compression_quality;
    if (q >= 85) return { text: "优秀", cls: "good" };
    if (q >= 70) return { text: "良好", cls: "good" };
    if (q >= 50) return { text: "一般", cls: "warning" };
    return { text: "严重下降", cls: "danger" };
  },

  // ---- 监听器 ----
  onChange(fn) {
    this._listeners.push(fn);
  },

  _notify(feedbacks) {
    this._listeners.forEach(fn => fn(this, feedbacks));
  },

  // ---- 导出复盘数据 ----
  getReviewData() {
    return {
      medical: {
        press_start_delay: this.press_start_delay + this.false_wait_penalty,
        compression_interrupt_time: this.compression_interrupt_time,
        compression_quality: this.compression_quality,
        aed_protocol_clean: this.aed_protocol_clean
      },
      collaboration: {
        resource_activation: this.resource_activation,
        takeover_success: this.takeover_success,
        witnesses: { ...this.witnesses }
      },
      social: {
        witness_credibility: this.witness_credibility,
        public_spread: this.public_spread,
        family_trust: this.family_trust
      },
      wangyuan: {
        burden: this.wangyuan_burden,
        path: [...this.path]
      }
    };
  }
};
