/* ============================================================
   interactions.js — 《生命守护者》交互模块
   CPR节奏 / AED流程 / 点名分工 / 换人模块 / 章节复盘
   ============================================================ */

const Interactions = {
  _active: false,
  _cprInterval: null,
  _cprLastBeat: 0,
  _cprBeatTimes: [],
  _cprBeatCount: 0,
  _cprRequiredBeats: 30,  // 需要完成的按压次数
  _takeoverCountdown: null,
  _takeoverSuccess: false,
  _aedStep: 0,
  _aedCleared: false,

  // ==================== CPR 节奏模块 ====================
  startCPR(callback) {
    this._active = true;
    this._cprBeatTimes = [];
    this._cprBeatCount = 0;
    this._cprLastBeat = 0;

    const module = document.getElementById("cprModule");
    const beatBar = document.getElementById("cprBeatBar");
    const rateDisplay = document.getElementById("cprRateDisplay");
    const qualityDisplay = document.getElementById("cprQualityDisplay");
    const feedbackEl = document.getElementById("cprFeedback");
    const progressFill = document.getElementById("cprBarFill");

    if (!module) return;

    document.getElementById("interactionLayer")?.classList.add("active");
    module.classList.add("active");
    if (progressFill) {
      progressFill.style.width = "0%";
      progressFill.className = "cpr-bar-fill";
    }
    GameState.cpr_active = true;
    GameState.cpr_total_beats = 0;
    GameState.cpr_good_beats = 0;

    // 节奏目标区域动画
    const zoneEl = document.getElementById("cprTargetZone");
    let indicatorPos = 0;
    let direction = 1;

    function animateIndicator() {
      if (!this._active) return;
      indicatorPos += direction * 2.2;
      if (indicatorPos >= 100) direction = -1;
      if (indicatorPos <= 0) direction = 1;
      if (beatBar) beatBar.style.left = indicatorPos + "%";
      this._cprAnimFrame = requestAnimationFrame(() => animateIndicator());
    }
    animateIndicator = animateIndicator.bind(this);
    animateIndicator();

    // 监听空格/点击
    this._onBeat = (e) => {
      if (!this._active) return;
      if (e && (e.target.closest("#pauseMenu") || e.target.closest("#choiceLayer"))) return;

      const now = Date.now();
      if (this._cprLastBeat === 0) {
        this._cprLastBeat = now;
        this._cprBeatCount++;
        GameState.cpr_total_beats++;
        if (progressFill) progressFill.style.width = `${(this._cprBeatCount / this._cprRequiredBeats) * 100}%`;
        if (feedbackEl) { feedbackEl.textContent = "第一下，继续"; feedbackEl.className = "cpr-feedback good"; }
        return;
      }

      const interval = (now - this._cprLastBeat) / 1000; // 秒
      this._cprLastBeat = now;
      this._cprBeatTimes.push(interval);
      this._cprBeatCount++;
      GameState.cpr_total_beats++;
      if (progressFill) progressFill.style.width = `${Math.min(100, (this._cprBeatCount / this._cprRequiredBeats) * 100)}%`;

      // 计算当前BPM (最近5次平均)
      const recentBeats = this._cprBeatTimes.slice(-5);
      const avgInterval = recentBeats.reduce((a, b) => a + b, 0) / recentBeats.length;
      const bpm = Math.round(60 / avgInterval);

      if (rateDisplay) rateDisplay.textContent = bpm;

      // 判断是否在合格区间 (100-120 BPM)
      let isGood = bpm >= 100 && bpm <= 120;
      let isWarning = (bpm >= 90 && bpm < 100) || (bpm > 120 && bpm <= 135);

      if (isGood) {
        GameState.cpr_good_beats++;
        GameState.compression_quality = Math.min(100, GameState.compression_quality + 1);
        if (feedbackEl) { feedbackEl.textContent = "按压质量 · 良好"; feedbackEl.className = "cpr-feedback good"; }
      } else if (isWarning) {
        GameState.compression_quality = Math.max(0, GameState.compression_quality - 2);
        if (feedbackEl) { feedbackEl.textContent = "按压质量 · 一般"; feedbackEl.className = "cpr-feedback warn"; }
      } else {
        GameState.compression_quality = Math.max(0, GameState.compression_quality - 4);
        if (feedbackEl) { feedbackEl.textContent = "按压偏离 · 调整节奏"; feedbackEl.className = "cpr-feedback warn"; }
      }

      // 颜色反馈
      if (rateDisplay) {
        rateDisplay.className = "cpr-rate" + (isGood ? "" : " warning") + (!isGood && !isWarning ? " danger" : "");
      }

      // 更新质量条
      if (qualityDisplay) {
        const q = GameState.compression_quality;
        qualityDisplay.textContent = q >= 85 ? "优秀" : q >= 70 ? "良好" : q >= 50 ? "一般" : "下降";
      }

      // 检查是否完成
      if (this._cprBeatCount >= this._cprRequiredBeats) {
        this._completeCPR(callback);
      }
    };

    document.addEventListener("keydown", this._cprKeyHandler = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (this._onBeat) this._onBeat(e);
      }
    });

    module.addEventListener("pointerdown", this._cprPointerHandler = (e) => {
      e.preventDefault();
      if (this._onBeat) this._onBeat(e);
    });

    // 疲劳衰减（持续一段时间后，质量自然下降）
    this._fatigueTimer = setTimeout(() => {
      if (this._active) {
        GameState.compression_quality = Math.max(0, GameState.compression_quality - 5);
      }
    }, 8000);
  },

  _completeCPR(callback) {
    // 清理
    if (this._fatigueTimer) clearTimeout(this._fatigueTimer);
    if (this._cprAnimFrame) cancelAnimationFrame(this._cprAnimFrame);
    document.removeEventListener("keydown", this._cprKeyHandler);
    const module = document.getElementById("cprModule");
    if (module && this._cprPointerHandler) {
      module.removeEventListener("pointerdown", this._cprPointerHandler);
    }
    this._active = false;
    GameState.cpr_active = false;

    // 最终反馈
    const finalQuality = GameState.compression_quality;
    const label = finalQuality >= 85 ? "优秀" : finalQuality >= 70 ? "良好" : finalQuality >= 50 ? "一般" : "下降";

    // 显示小结
    const feedbacks = [
      { text: `按压质量：${finalQuality} (${label})`, type: finalQuality >= 70 ? "positive" : "warning" },
      { text: `中断时间：0秒`, type: "positive" },
      { text: `体力状态：${finalQuality < 60 ? "严重下降" : "下降"}`, type: finalQuality < 60 ? "danger" : "neutral" }
    ];

    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");

    // 隐藏CPR模块，延迟调用callback
    if (callback) {
      // 先显示反馈
      if (typeof window.showStateFeedback === "function") {
        feedbacks.forEach(f => window.showStateFeedback(f.text, f.type));
      }
      setTimeout(() => callback(finalQuality), 1500);
    }
  },

  stopCPR() {
    this._active = false;
    GameState.cpr_active = false;
    if (this._fatigueTimer) clearTimeout(this._fatigueTimer);
    if (this._cprAnimFrame) cancelAnimationFrame(this._cprAnimFrame);
    document.removeEventListener("keydown", this._cprKeyHandler);
    const module = document.getElementById("cprModule");
    if (module && this._cprPointerHandler) {
      module.removeEventListener("pointerdown", this._cprPointerHandler);
    }
    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
  },

  // ==================== AED 流程模块 ====================
  startAED(scene, callback) {
    this._aedStep = scene.onEnter?.step || 1;
    this._aedCleared = false;

    const module = document.getElementById("aedModule");
    const statusEl = document.getElementById("aedStatus");
    const stepEl = document.getElementById("aedStepText");
    const aedBtn = document.getElementById("aedActionBtn");

    if (!module) return;

    document.getElementById("interactionLayer")?.classList.add("active");
    module.classList.add("active");

    const flows = {
      aed_protocol_start: [
        {
          state: 1,
          text: "AED到场。打开盖子，听语音。",
          action: "打开AED",
          status: "开机，听它说"
        }
      ],
      aed_clear_space: [
        {
          state: 2,
          text: "胸部要裸露、干燥、贴得牢。",
          action: "擦干胸前皮肤",
          status: "继续按压，只让出最短空档"
        },
        {
          state: 3,
          text: "第一片贴右上胸，锁骨下方。",
          action: "贴右上胸",
          status: "按贴片图案确认位置"
        },
        {
          state: 3,
          text: "第二片贴左下胸，左乳头外下方。",
          action: "贴左下胸",
          status: "贴牢，不要贴在水和衣物上"
        },
        {
          state: 4,
          text: "AED分析心律。所有人离开。",
          action: "喊清场",
          status: "分析时，手离开"
        }
      ],
      aed_execute: [
        {
          state: 5,
          text: "再次扫一圈：无人接触患者。",
          action: "确认安全",
          status: "确认后才执行"
        },
        {
          state: 5,
          text: "按语音提示执行；电击后立刻继续按压。",
          action: "执行并继续CPR",
          status: "不建议电击也继续CPR"
        }
      ]
    };

    const flow = flows[scene.id] || flows.aed_protocol_start;
    let flowIndex = 0;

    const renderStep = () => {
      const current = flow[flowIndex];
      if (!current) return;
      GameState.aed_step = current.state;
      this._aedStep = current.state;
      if (stepEl) stepEl.textContent = current.text;
      if (statusEl) statusEl.textContent = current.status || "";
      if (aedBtn) aedBtn.textContent = current.action || "操作";
    };

    this._aedClickHandler = (e) => {
      if (!module.classList.contains("active")) return;

      const current = flow[flowIndex];
      if (current?.state === 4) this._aedCleared = true;

      flowIndex++;
      if (flowIndex >= flow.length) {
        if (scene.id === "aed_execute") {
          GameState.applyEffects({ aed_protocol_clean: true });
        }
        module.classList.remove("active");
        document.getElementById("interactionLayer")?.classList.remove("active");
        if (callback) callback(true);
        return;
      }

      renderStep();
    };

    // 绑定AED操作按钮
    if (aedBtn) {
      aedBtn.addEventListener("click", this._aedClickHandler);
    }

    // 空格也能触发
    this._aedKeyHandler = (e) => {
      if (e.code === "Space" && module.classList.contains("active")) {
        e.preventDefault();
        if (this._aedClickHandler) this._aedClickHandler(e);
      }
    };
    document.addEventListener("keydown", this._aedKeyHandler);

    renderStep();
  },

  stopAED() {
    const module = document.getElementById("aedModule");
    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
    const aedBtn = document.getElementById("aedActionBtn");
    if (aedBtn && this._aedClickHandler) {
      aedBtn.removeEventListener("click", this._aedClickHandler);
    }
    if (this._aedKeyHandler) {
      document.removeEventListener("keydown", this._aedKeyHandler);
    }
  },

  // ==================== 点名分工模块 ====================
  startAssign(callback) {
    const module = document.getElementById("assignModule");
    if (!module) return;

    document.getElementById("interactionLayer")?.classList.add("active");
    module.classList.add("active");

    // 绑定卡片点击
    module.querySelectorAll(".assign-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("assigned")) return;
        card.classList.add("assigned");
        const name = card.dataset.witness;
        GameState.activateWitness(name, 2);

        // 反馈
        const feedbacks = {
          sun_jianguo: "孙建国已拨打120，免提开启",
          ma_zhiguo: "马志国正在前往站内AED柜",
          lin_xiaoyu: "林小雨开始计时"
        };
        if (typeof window.showStateFeedback === "function") {
          window.showStateFeedback(feedbacks[name], "positive");
        }

        // 检查是否全部分配
        const allAssigned = module.querySelectorAll(".assign-card:not(.assigned)").length === 0;
        if (allAssigned) {
          setTimeout(() => {
            module.classList.remove("active");
            document.getElementById("interactionLayer")?.classList.remove("active");
            if (callback) callback();
          }, 1200);
        }
      });
    });
  },

  stopAssign() {
    const module = document.getElementById("assignModule");
    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
  },

  // ==================== 换人模块 ====================
  startTakeover(onSuccess, onFail) {
    const module = document.getElementById("takeoverModule");
    const countdownEl = document.getElementById("takeoverCountdown");

    if (!module) return;
    document.getElementById("interactionLayer")?.classList.add("active");
    module.classList.add("active");

    let countdown = 3;
    this._takeoverSuccess = false;
    this._active = true;

    if (countdownEl) countdownEl.textContent = countdown;

    this._takeoverInterval = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = countdown;

      if (countdown <= 0) {
        clearInterval(this._takeoverInterval);
        this._active = false;
        module.classList.remove("active");
        document.getElementById("interactionLayer")?.classList.remove("active");

        if (!this._takeoverSuccess) {
          GameState.takeover_success = false;
          GameState.compression_quality -= 15;
          GameState.compression_interrupt_time += 5;
          if (typeof window.showStateFeedback === "function") {
            window.showStateFeedback("交接失败 · 按压中断+5秒", "negative");
          }
          if (onFail) onFail();
        }
      }
    }, 1000);

    // 绑定交接按钮
    this._takeoverClick = () => {
      if (!this._active) return;
      clearInterval(this._takeoverInterval);
      this._active = false;
      this._takeoverSuccess = true;
      module.classList.remove("active");
      document.getElementById("interactionLayer")?.classList.remove("active");

      GameState.takeover_success = true;
      GameState.compression_quality = Math.min(100, GameState.compression_quality + 5);
      if (typeof window.showStateFeedback === "function") {
        window.showStateFeedback("交接成功 · 按压质量保持", "positive");
      }
      if (onSuccess) onSuccess();
    };

    const takeoverBtn = document.getElementById("takeoverBtn");
    if (takeoverBtn) {
      takeoverBtn.addEventListener("click", this._takeoverClick);
    }

    // 空格也能交接
    this._takeoverKey = (e) => {
      if (e.code === "Space" && this._active) {
        e.preventDefault();
        if (this._takeoverClick) this._takeoverClick();
      }
    };
    document.addEventListener("keydown", this._takeoverKey);
  },

  stopTakeover() {
    this._active = false;
    if (this._takeoverInterval) clearInterval(this._takeoverInterval);
    const module = document.getElementById("takeoverModule");
    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
    document.removeEventListener("keydown", this._takeoverKey);
  },

  // ==================== 章节复盘 ====================
  showReview() {
    const layer = document.getElementById("reviewLayer");
    if (!layer) return;

    const data = GameState.getReviewData();

    // 构建复盘HTML
    const medicalQuality = data.medical.compression_quality;
    const qualityClass = medicalQuality >= 85 ? "good" : medicalQuality >= 70 ? "good" : medicalQuality >= 50 ? "warn" : "bad";
    const qualityLabel = medicalQuality >= 85 ? "优秀" : medicalQuality >= 70 ? "良好" : medicalQuality >= 50 ? "一般" : "严重下降";
    const aedLabel = data.medical.aed_protocol_clean ? "规范" : "存在瑕疵";
    const aedClass = data.medical.aed_protocol_clean ? "good" : "warn";

    const witnessSources = [];
    if (data.collaboration.witnesses.sun_jianguo.activated) witnessSources.push("孙建国：已拨打120并作证");
    if (data.collaboration.witnesses.ma_zhiguo.activated) witnessSources.push("马志国：已取回AED");
    if (data.collaboration.witnesses.lin_xiaoyu.activated) witnessSources.push("林小雨：已站出来说明");
    const witnessText = witnessSources.length > 0 ? witnessSources.join("\n") : "无证人激活";

    const credibilityLabel = data.social.witness_credibility >= 4 ? "高" : data.social.witness_credibility >= 2 ? "中" : "低";
    const credibilityClass = data.social.witness_credibility >= 4 ? "good" : data.social.witness_credibility >= 2 ? "warn" : "bad";
    const spreadLabel = data.social.public_spread >= 3 ? "高" : data.social.public_spread >= 1 ? "中" : "低";
    const trustLabel = data.social.family_trust >= 2 ? "恢复中" : data.social.family_trust >= 0 ? "中性" : "恶化";

    layer.innerHTML = `
      <div class="review-container">
        <div class="review-title">章节复盘</div>
        <div class="review-subtitle">第一章 · 雨夜的圆圈</div>

        <div class="review-section">
          <h3>医学复盘</h3>
          <div class="review-item">开始按压延误：<span>${data.medical.press_start_delay}秒</span></div>
          <div class="review-item">按压中断：<span>${data.medical.compression_interrupt_time}秒</span></div>
          <div class="review-item">按压质量：<span class="${qualityClass}">${medicalQuality} (${qualityLabel})</span></div>
          <div class="review-item">AED流程：<span class="${aedClass}">${aedLabel}</span></div>
        </div>

        <div class="review-section">
          <h3>现场协作</h3>
          ${witnessText.split("\n").map(t => `<div class="review-item">${t}</div>`).join("")}
        </div>

        <div class="review-section">
          <h3>社会后果</h3>
          <div class="review-item">证人可信度：<span class="${credibilityClass}">${credibilityLabel}</span></div>
          <div class="review-item">舆论扩散：<span class="${spreadLabel === '高' ? 'warn' : ''}">${spreadLabel}</span></div>
          <div class="review-item">家属信任：<span>${trustLabel}</span></div>
        </div>

        <div class="review-section">
          <h3>第二章承接</h3>
          <div class="review-item">王远将带着现场证词进入网络舆论事件。</div>
        </div>

        <div class="review-chapter2">
          <div class="ch2-title">第二章 · 涟漪</div>
          <div class="ch2-status">暂未开放</div>
        </div>

        <button class="review-continue" id="reviewRestart">重新开始</button>
      </div>
    `;

    layer.classList.add("active");

    document.getElementById("reviewRestart")?.addEventListener("click", () => {
      layer.classList.remove("active");
      if (typeof window.restartGame === "function") {
        window.restartGame();
      }
    });
  },

  // ==================== 清理 ====================
  cleanup() {
    this.stopCPR();
    this.stopAED();
    this.stopAssign();
    this.stopTakeover();
    this._active = false;
  }
};
