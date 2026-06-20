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
  _cprCombo: 0,
  _cprMaxCombo: 0,
  _cprDifficultyPhase: 0,
  _cprShakeEffect: null,

  // ==================== CPR 节奏模块（双层：节奏维持+现场干扰） ====================
  startCPR(callback) {
    this._active = true;
    this._cprBeatTimes = [];
    this._cprBeatCount = 0;
    this._cprLastBeat = 0;
    this._cprPhases = [
      { at: 0,  zoneLeft: 32, zoneWidth: 36, text: "按压不断，胸廓回弹" },
      { at: 10, zoneLeft: 35, zoneWidth: 30, text: "手臂开始发酸……保持深度" },
      { at: 18, zoneLeft: 37, zoneWidth: 26, text: "汗水模糊了视线，有人在问：他到底会不会按" },
      { at: 24, zoneLeft: 38, zoneWidth: 24, text: "最后几下了，别松劲" },
    ];
    this._cprPauseStart = 0;
    this._cprTotalPause = 0;
    this._cprCurrentPhase = 0;
    this._cprEventFired = {};

    const module = document.getElementById("cprModule");
    const beatBar = document.getElementById("cprBeatBar");
    const rateDisplay = document.getElementById("cprRateDisplay");
    const qualityDisplay = document.getElementById("cprQualityDisplay");
    const feedbackEl = document.getElementById("cprFeedback");
    const progressFill = document.getElementById("cprBarFill");
    const zoneEl = document.getElementById("cprTargetZone");
    const hintEl = module?.querySelector(".cpr-hint");

    if (!module) return;

    // 启动CPR音效系统
    AudioManager.startCprMetronome(120, 0.5);
    AudioManager.startCrowdNoise(120, 0.25); // 周围人声
    AudioManager.startTensionMusic(0.5, 0.35); // 紧张音乐

    // 重置连击系统
    this._cprCombo = 0;
    this._cprMaxCombo = 0;
    this._cprDifficultyPhase = 0;

    // 创建连击显示
    this._createComboDisplay(module);

    document.getElementById("interactionLayer")?.classList.add("active");
    module.classList.add("active");
    if (progressFill) { progressFill.style.width = "0%"; progressFill.className = "cpr-bar-fill"; }
    GameState.cpr_active = true;
    GameState.cpr_total_beats = 0;
    GameState.cpr_good_beats = 0;

    // 设置初始目标区域
    this._updateCPRZone(zoneEl, 0);

    // 指示器动画
    let indicatorPos = 50; let direction = 1;
    const animateIndicator = () => {
      if (!this._active) return;
      const speed = 1.8 + this._cprCurrentPhase * 0.4;
      indicatorPos += direction * speed;
      if (indicatorPos >= 100) direction = -1;
      if (indicatorPos <= 0) direction = 1;
      if (beatBar) beatBar.style.left = indicatorPos + "%";
      this._cprAnimFrame = requestAnimationFrame(animateIndicator);
    };
    animateIndicator();

    // 暂停检测定时器
    this._cprPauseCheck = setInterval(() => {
      if (!this._active || this._cprBeatCount === 0) return;
      const elapsed = (Date.now() - this._cprLastBeat) / 1000;
      if (elapsed > 2.5 && !this._cprPauseStart) {
        this._cprPauseStart = Date.now();
        this._showCPREvent("按压中断！胸廓需要持续按压");
        // 播放警告音效
        AudioManager.playInterruptionWarning();
        // 屏幕警告效果
        this._showScreenWarning();
      }
    }, 800);

    // 按压事件
    this._onBeat = (e) => {
      if (!this._active) return;
      if (e && (e.target.closest("#pauseMenu") || e.target.closest("#choiceLayer"))) return;

      // 计算中断时间
      if (this._cprPauseStart) {
        const pauseDuration = (Date.now() - this._cprPauseStart) / 1000;
        this._cprTotalPause += pauseDuration;
        this._cprPauseStart = 0;
        if (pauseDuration > 2) {
          GameState.compression_quality = Math.max(0, GameState.compression_quality - 8);
        }
      }

      const now = Date.now();
      if (this._cprLastBeat === 0) {
        this._cprLastBeat = now;
        this._cprBeatCount++;
        GameState.cpr_total_beats++;
        if (progressFill) progressFill.style.width = `${(this._cprBeatCount / this._cprRequiredBeats) * 100}%`;
        if (feedbackEl) { feedbackEl.textContent = "第一下，继续！"; feedbackEl.className = "cpr-feedback good"; }
        this._checkCPRPhase(hintEl, feedbackEl, zoneEl);
        // 第一下成就
        Achievements.unlock('first_beat');
        return;
      }

      const interval = (now - this._cprLastBeat) / 1000;
      this._cprLastBeat = now;
      this._cprBeatTimes.push(interval);
      this._cprBeatCount++;
      GameState.cpr_total_beats++;
      if (progressFill) progressFill.style.width = `${Math.min(100, (this._cprBeatCount / this._cprRequiredBeats) * 100)}%`;

      // BPM 计算
      const recentBeats = this._cprBeatTimes.slice(-5);
      const avgInterval = recentBeats.reduce((a, b) => a + b, 0) / recentBeats.length;
      const bpm = Math.round(60 / avgInterval);
      if (rateDisplay) rateDisplay.textContent = bpm;

      // 质量判定
      const isGood = bpm >= 100 && bpm <= 120;
      const isWarning = (bpm >= 90 && bpm < 100) || (bpm > 120 && bpm <= 135);

      if (isGood) {
        GameState.cpr_good_beats++;
        GameState.compression_quality = Math.min(100, GameState.compression_quality + 1.5);
        if (feedbackEl) { feedbackEl.textContent = ["稳定", "按得好", "保持节奏", "就这样"][Math.floor(Math.random() * 4)]; feedbackEl.className = "cpr-feedback good"; }
        if (progressFill) progressFill.className = "cpr-bar-fill";
        this._updateComboDisplay(true);
        this._triggerScreenShake(3);
      } else if (isWarning) {
        GameState.compression_quality = Math.max(0, GameState.compression_quality - 2);
        if (feedbackEl) { feedbackEl.textContent = "调整节奏"; feedbackEl.className = "cpr-feedback warn"; }
        if (progressFill) progressFill.className = "cpr-bar-fill warning";
        this._updateComboDisplay(false);
      } else {
        GameState.compression_quality = Math.max(0, GameState.compression_quality - 4);
        if (feedbackEl) { feedbackEl.textContent = bpm < 90 ? "太慢了！" : "太快了！"; feedbackEl.className = "cpr-feedback warn"; }
        if (progressFill) progressFill.className = "cpr-bar-fill danger";
        this._updateComboDisplay(false);
        this._triggerScreenShake(8);
      }

      if (rateDisplay) {
        rateDisplay.className = "cpr-rate" + (isGood ? "" : isWarning ? " warning" : " danger");
      }
      if (qualityDisplay) {
        const q = GameState.compression_quality;
        qualityDisplay.textContent = q >= 85 ? "优秀" : q >= 70 ? "良好" : q >= 50 ? "一般" : "下降";
      }

      // 阶段检查
      this._checkCPRPhase(hintEl, feedbackEl, zoneEl);

      if (this._cprBeatCount >= this._cprRequiredBeats) {
        this._completeCPR(callback);
      }
    };

    document.addEventListener("keydown", this._cprKeyHandler = (e) => {
      if (e.code === "Space") { e.preventDefault(); if (this._onBeat) this._onBeat(e); }
    });
    module.addEventListener("pointerdown", this._cprPointerHandler = (e) => {
      e.preventDefault(); if (this._onBeat) this._onBeat(e);
    });
  },

  _updateCPRZone(zoneEl, phaseIdx) {
    const p = this._cprPhases[Math.min(phaseIdx, this._cprPhases.length - 1)];
    if (zoneEl) {
      zoneEl.style.left = p.zoneLeft + "%";
      zoneEl.style.width = p.zoneWidth + "%";
      zoneEl.style.transition = "all 0.6s ease";
    }
  },

  _checkCPRPhase(hintEl, feedbackEl, zoneEl) {
    for (let i = this._cprPhases.length - 1; i >= 0; i--) {
      if (this._cprBeatCount >= this._cprPhases[i].at && i > this._cprCurrentPhase) {
        this._cprCurrentPhase = i;
        this._updateCPRZone(zoneEl, i);
        // 阶段切换提示
        const p = this._cprPhases[i];
        if (!this._cprEventFired[i]) {
          this._cprEventFired[i] = true;
          if (hintEl) hintEl.textContent = p.text;
          if (feedbackEl) { feedbackEl.textContent = i > 0 ? "注意节奏" : ""; feedbackEl.className = "cpr-feedback good"; }
        }
        break;
      }
    }
  },

  _showCPREvent(text) {
    if (typeof window.showStateFeedback === "function") {
      window.showStateFeedback(text, "negative");
    }
  },

  _completeCPR(callback) {
    if (this._cprPauseCheck) clearInterval(this._cprPauseCheck);
    if (this._cprAnimFrame) cancelAnimationFrame(this._cprAnimFrame);
    document.removeEventListener("keydown", this._cprKeyHandler);
    const module = document.getElementById("cprModule");
    if (module && this._cprPointerHandler) {
      module.removeEventListener("pointerdown", this._cprPointerHandler);
    }
    this._active = false;
    GameState.cpr_active = false;
    GameState.compression_interrupt_time += Math.round(this._cprTotalPause);

    // 停止CPR节拍音效
    AudioManager.stopCprMetronome();

    const finalQuality = GameState.compression_quality;
    const label = finalQuality >= 85 ? "优秀" : finalQuality >= 70 ? "良好" : finalQuality >= 50 ? "一般" : "下降";
    const feedbacks = [
      { text: `按压质量：${finalQuality} (${label})`, type: finalQuality >= 70 ? "positive" : "warning" },
      { text: `中断时间：${Math.round(this._cprTotalPause)}秒`, type: this._cprTotalPause < 3 ? "positive" : "negative" },
    ];

    // 成就触发
    if (finalQuality >= 85) Achievements.unlock('perfect_cpr');

    if (module) module.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
    if (callback) {
      if (typeof window.showStateFeedback === "function") {
        feedbacks.forEach(f => window.showStateFeedback(f.text, f.type));
      }
      setTimeout(() => callback(finalQuality), 1500);
    }
  },

  stopCPR() {
    this._active = false;
    GameState.cpr_active = false;

    // 停止CPR节拍音效和环境音效
    AudioManager.stopCprMetronome();
    AudioManager.stopCrowdNoise();
    AudioManager.stopTensionMusic();

    if (this._cprPauseCheck) clearInterval(this._cprPauseCheck);
    if (this._cprAnimFrame) cancelAnimationFrame(this._cprAnimFrame);
    document.removeEventListener("keydown", this._cprKeyHandler);
    const module = document.getElementById("cprModule");
    if (module && this._cprPointerHandler) {
      module.removeEventListener("pointerdown", this._cprPointerHandler);
    }

    // 清理视觉效果
    const comboEl = document.getElementById('cprComboDisplay');
    if (comboEl) comboEl.remove();

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
          text: "拉开胸前衣物，擦干贴片要接触的皮肤。水会影响导电。",
          action: "擦干皮肤",
          img: 1
        },
        {
          state: 3,
          text: "按AED贴片图示：第一片右上胸锁骨下方，第二片左下胸乳头外侧。",
          action: "贴左上胸 + 右下胸",
          img: 2
        },
        {
          state: 4,
          text: "AED正在分析心律——所有人后退，不要接触患者！",
          action: "全部后退",
          img: 3
        }
      ],
      aed_execute: [
        {
          state: 5,
          text: "再次确认：所有人后退，无人接触患者。",
          action: "确认安全",
          img: 1
        },
        {
          state: 5,
          text: "建议电击。按语音提示执行；电击后立刻继续按压。",
          action: "执行电击",
          img: 2
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
      // ★ 切换对应图片
      if (current.img && Game._showSceneImage) {
        Game._showSceneImage(current.img);
      }
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

    // 卡片对应的叙事反馈（点击后展示的对话/叙述）
    const witnessNarratives = {
      sun_jianguo: [
        { text: "孙建国已拨打120，免提开启", type: "positive" },
        { text: "孙建国：啊？我……好、好！", type: "neutral" }
      ],
      ma_zhiguo: [
        { text: "马志国正在前往站内AED柜", type: "positive" },
        { text: "马志国咬牙：好！我这就去！", type: "neutral" }
      ],
      lin_xiaoyu: [
        { text: "林小雨开始计时并作证", type: "positive" },
        { text: "林小雨：我在看时间，也替你作证！", type: "neutral" }
      ]
    };

    // 绑定卡片点击
    module.querySelectorAll(".assign-card").forEach(card => {
      card.addEventListener("click", () => {
        if (card.classList.contains("assigned")) return;
        card.classList.add("assigned");
        const name = card.dataset.witness;
        GameState.activateWitness(name, 2);

        // 逐个显示叙事反馈
        const narratives = witnessNarratives[name] || [];
        if (typeof window.showStateFeedback === "function") {
          narratives.forEach((n, idx) => {
            setTimeout(() => {
              window.showStateFeedback(n.text, n.type);
            }, idx * 400);
          });
        }

        // 检查是否全部分配
        const allAssigned = module.querySelectorAll(".assign-card:not(.assigned)").length === 0;
        if (allAssigned) {
          setTimeout(() => {
            // 全部分配完毕后显示总结反馈
            if (typeof window.showStateFeedback === "function") {
              window.showStateFeedback("王远用一根无形的线，把围观的看客拉成了同盟", "positive");
            }
            module.classList.remove("active");
            document.getElementById("interactionLayer")?.classList.remove("active");
            if (callback) callback();
          }, 1500);
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

    // 第二章承接文案（基于实际变量）
    const ch2_items = [];
    // 反应速度
    if (data.medical.press_start_delay <= 10) ch2_items.push("反应迅速——王远将成为社区急救培训的正面案例");
    else if (data.medical.press_start_delay >= 30) ch2_items.push("进场延误严重——网络质疑他是否\"先拍再救\"");
    else ch2_items.push("反应速度一般——现场时间线将成为舆论焦点之一");
    // 证据质量
    if (data.collaboration.witnesses.sun_jianguo.activated && data.collaboration.witnesses.lin_xiaoyu.activated) ch2_items.push("多人证词齐备——警方与医护认可时间线");
    else if (data.social.public_spread >= 3) ch2_items.push("缺乏证人、高传播——王远可能面临网络暴力");
    else ch2_items.push("证据链不完整——第二章将有澄清压力的剧情");
    // 现场协作
    if (data.collaboration.resource_activation === "witness") ch2_items.push("现场协作良好——王远在第二章将被社区视为组织者");
    else ch2_items.push("单打独斗——王远需在第二章重建信任网络");
    // 按压质量
    if (data.medical.compression_quality >= 70) ch2_items.push("按压质量达标——医学复盘结论偏向正面");
    else ch2_items.push("按压质量严重下降——第二章王远可能面临自我怀疑");
    // 家属信任或心理负担
    if (data.social.family_trust >= 2) ch2_items.push("家属信任修复——赵雪梅将在第二章主动联系王远");
    else if (data.social.family_trust < 0) ch2_items.push("家属关系恶化——赵雪梅仍对王远存疑，纠纷未息");
    if (data.wangyuan.burden >= 5) ch2_items.push("心理负担沉重——王远在第二章开场处于低潮期");
    else ch2_items.push("心理状态可控——王远能较快进入第二章节奏");

    const ch2Text = ch2_items.map(t => `<div class="review-item ch2-consequence">${t}</div>`).join("");

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
          ${ch2Text}
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

  // ==================== 视觉效果模块 ====================

  _createComboDisplay(module) {
    // 简化连击显示 - 放在右下角
    const comboEl = document.createElement('div');
    comboEl.id = 'cprComboDisplay';
    comboEl.className = 'cpr-combo-display';
    comboEl.innerHTML = '<span class="combo-count">0</span><span class="combo-label">连击</span>';
    module.appendChild(comboEl);
  },

  _createDepthGauge(module) {
    // 移除深度表 - 保留核心信息
  },

  _createECGDisplay(module) {
    // 移除ECG - 保留核心信息
  },

  _updateComboDisplay(isGoodBeat) {
    const comboEl = document.getElementById('cprComboDisplay');
    if (!comboEl) return;

    if (isGoodBeat) {
      this._cprCombo++;
      this._cprMaxCombo = Math.max(this._cprMaxCombo, this._cprCombo);

      // 成就触发
      if (this._cprCombo === 5) Achievements.unlock('combo_5');
      if (this._cprCombo === 10) Achievements.unlock('combo_10');
    } else {
      this._cprCombo = 0;
    }

    const countEl = comboEl.querySelector('.combo-count');
    const labelEl = comboEl.querySelector('.combo-label');
    if (countEl) countEl.textContent = this._cprCombo;
    if (labelEl) {
      labelEl.textContent = this._cprCombo >= 10 ? '大成功' : this._cprCombo >= 5 ? '连击' : '连击';
      labelEl.className = 'combo-label' + (this._cprCombo >= 10 ? ' mega' : this._cprCombo >= 5 ? ' great' : '');
    }

    // 连击动画
    if (this._cprCombo > 0 && this._cprCombo % 5 === 0) {
      this._showCPREvent(`🎯 ${this._cprCombo}连击！`);
    }
  },

  _updateDepthGauge(quality) {
    // 保留函数但清空实现 - 简化界面
  },

  _updateECGDisplay(bpm, isGood) {
    // 保留函数但清空实现 - 简化界面
  },

  _triggerScreenShake(intensity = 5) {
    const gameEl = document.getElementById('game');
    if (!gameEl) return;

    gameEl.style.transform = `translateX(${(Math.random() - 0.5) * intensity}px) translateY(${(Math.random() - 0.5) * intensity}px)`;
    setTimeout(() => {
      gameEl.style.transform = '';
    }, 100);
  },

  _showScreenWarning() {
    const warning = document.createElement('div');
    warning.className = 'screen-warning';
    document.body.appendChild(warning);
    setTimeout(() => warning.remove(), 500);
  },

  // ==================== 清理 ====================
  cleanup() {
    this.stopCPR();
    this.stopAED();
    this.stopAssign();
    this.stopTakeover();
    this._active = false;

    // 清理视觉效果
    const comboEl = document.getElementById('cprComboDisplay');
    if (comboEl) comboEl.remove();

    // 清理音效
    AudioManager.stopCprMetronome();
    AudioManager.stopCrowdNoise();
    AudioManager.stopTensionMusic();
  }
};
