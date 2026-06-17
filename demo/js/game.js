/* ============================================================
   game.js — 《生命守护者》核心引擎
   电影式互动急救叙事游戏驱动
   ============================================================ */

const Game = {
  currentSceneId: null,
  isTyping: false,
  typingTimer: null,
  hudVisible: true,
  paused: false,
  skipNext: false,
  rainActive: false,
  rainInterval: null,
  sceneTimerIds: [],
  sceneMediaState: null,

  // ==================== 初始化 ====================
  init() {
    GameState.init();
    AudioManager.init();
    Interactions.cleanup();

    this.currentSceneId = null;
    this.isTyping = false;
    this.hudVisible = false;
    this.paused = false;
    this._sharedVoiceActive = false;
    this._sharedNextHolds = null;

    this._bindGlobalInputs();
    this._showStartScreen();
    this._startStartRain();
    this._updateHUD();
  },

  // ==================== 开始画面 ====================
  _showStartScreen() {
    const start = document.getElementById("startScreen");
    if (start) {
      start.classList.remove("fade-out");
      start.style.display = "flex";
    }
    this._clearBar();
    this._clearIntertitle();
    document.getElementById("navHint").style.display = "none";
    document.getElementById("stage").className = "subway_canopy";
    this._hideAllModules();
  },

  _startStartRain() {
    const container = document.getElementById("startRain");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 60; i++) {
      const drop = document.createElement("div");
      drop.className = "rain-drop" + (Math.random() > 0.3 ? " wind" : "");
      drop.style.left = Math.random() * 100 + "%";
      drop.style.animationDuration = (0.5 + Math.random() * 1.0) + "s";
      drop.style.animationDelay = Math.random() * 2 + "s";
      container.appendChild(drop);
    }
  },

  _startGame() {
    const start = document.getElementById("startScreen");
    if (start) {
      start.classList.add("fade-out");
      setTimeout(() => { start.style.display = "none"; }, 1000);
    }
    setTimeout(() => this.goToScene("prologue_title"), 600);
  },

  // ==================== 场景导航 ====================
  goToScene(sceneId) {
    const scene = SCENES[sceneId];
    if (!scene) {
      console.warn("[Game] 场景不存在:", sceneId);
      return;
    }

    if (this.typingTimer) clearTimeout(this.typingTimer);
    this._clearSceneTimers();
    AudioManager.stopNarration(); // 切换场景时停止上一场景旁白
    this._sharedVoiceActive = false;  // 清理共享音频状态
    this._sharedNextHolds = null;
    this.currentSceneId = sceneId;
    this.isTyping = false;

    Interactions.cleanup();
    this._hideAllModules();
    this._clearStackedNarrator();

    // 场景切换过渡：先黑入 → 加载新素材 → 黑出
    this._sceneTransition(() => {
      this._updateStage(scene);
      this._updateRain(scene);
      this._updateSceneLabel(scene);
      this._hideChoices();
      this._hideNavHint();
      this._clearBar();
      this._clearIntertitle();

      // 场景特效
      if (scene.shake) this._screenShake();
      if (scene.vignette) this._showVignette();
      else this._hideVignette();
      if (scene.cprFlash) this._showCprFlash();
      else this._hideCprFlash();
      if (scene.aedMap) this._showAedDot();
      else this._hideAedDot();

      // 触发音频（如果素材到位）
      this._playSceneAudio(scene);

      // 触发 onEnter
      if (scene.onEnter) {
        if (scene.onEnter.effects) {
          GameState.applyEffects(scene.onEnter.effects);
        }
      }

      // 渲染场景内容
      this._renderScene(scene);
    });
  },

  // ==================== 场景切换过渡动画 ====================
  _sceneTransition(onReady) {
    const overlay = document.getElementById("sceneTransition");
    if (!overlay) { onReady(); return; }

    // 先黑入（最快淡入）
    overlay.classList.add("active");

    // 等待黑屏生效后切换内容，再淡出
    setTimeout(() => {
      onReady();
      // 给新内容一帧的渲染时间，然后淡出
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.remove("active");
        });
      });
    }, 300);
  },

  // ==================== 条件路由解析 ====================
  _resolveNext(scene) {
    // 如果当前场景有 condition，可能返回重定向的场景ID
    if (typeof scene.condition === "function") {
      const redirect = scene.condition(GameState);
      if (redirect) return redirect;
    }
    return scene.next;
  },

  // ==================== 堆叠旁白清理 ====================
  _clearStackedNarrator() {
    this._clearBar();
  },

  // ==================== 标题卡：全屏黑底+白字渐现渐隐 ====================
  async _showTitleCard(titleText) {
    const layer = document.getElementById("intertitleLayer");
    if (!layer) return;

    // 黑底大标题
    layer.style.background = "#000";
    layer.className = "active";
    layer.innerHTML = "";

    const el = document.createElement("div");
    el.style.cssText = `
      font-family: var(--font-narrator);
      font-size: 52px;
      letter-spacing: 0.3em;
      color: rgba(255,255,255,0.9);
      text-align: center;
    `;
    el.textContent = titleText;
    layer.appendChild(el);

    // 渐现停留
    await this._delay(1800);

    // 渐隐
    layer.classList.add("fading");

    await this._delay(800);

    // 清理
    layer.className = "";
    layer.innerHTML = "";
    layer.style.background = "";
  },

  // ==================== 工具：底部字幕带引用 ====================
  _bar() { return document.getElementById("subtitleBar"); },

  _clearSceneTimers() {
    this.sceneTimerIds.forEach(timerId => clearTimeout(timerId));
    this.sceneTimerIds = [];
    this.sceneMediaState = null;
  },

  _scheduleSceneTimer(sceneId, delayMs, callback) {
    const safeDelay = Math.max(0, Number(delayMs) || 0);
    const timerId = setTimeout(() => {
      this.sceneTimerIds = this.sceneTimerIds.filter(id => id !== timerId);
      if (this.currentSceneId !== sceneId) return;
      callback();
    }, safeDelay);

    this.sceneTimerIds.push(timerId);
    return timerId;
  },

  _now() {
    return (window.performance && typeof window.performance.now === "function")
      ? window.performance.now()
      : Date.now();
  },

  _cueMs(value) {
    const seconds = Number(value);
    return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
  },

  _buildImageTimeline(entries) {
    const items = entries
      .map((entry, index) => ({
        entry,
        index,
        startMs: this._cueMs(entry.slot?.startTime),
        endMs: this._cueMs(entry.slot?.endTime)
      }))
      .sort((a, b) => (a.startMs - b.startMs) || (a.index - b.index));

    if (!items.length) {
      return { items: [], timelineEndMs: 0 };
    }

    const uniqueStarts = [...new Set(items.map(item => item.startMs))].sort((a, b) => a - b);
    const latestStartMs = uniqueStarts[uniqueStarts.length - 1] || 0;
    const latestExplicitEndMs = items.reduce((max, item) => {
      return item.endMs > item.startMs ? Math.max(max, item.endMs) : max;
    }, 0);

    const latestGroupHasExplicitEnd = items.some(item => {
      return item.startMs === latestStartMs && item.endMs > item.startMs;
    });

    let timelineEndMs = latestExplicitEndMs;
    if (latestStartMs > 0 && !latestGroupHasExplicitEnd) {
      const previousStartMs = uniqueStarts.length > 1 ? uniqueStarts[uniqueStarts.length - 2] : 0;
      const inferredHoldMs = Math.max(1200, latestStartMs - previousStartMs || 0);
      timelineEndMs = Math.max(timelineEndMs, latestStartMs + inferredHoldMs);
    }

    return { items, timelineEndMs };
  },

  _setImageEntryVisible(entry, visible) {
    if (!entry || !entry.element) return;

    entry.shouldShow = visible;

    if (visible) {
      entry.element.classList.remove("fading");
      if (entry.loaded && !entry.failed) {
        entry.element.classList.add("active");
        entry.hasShown = true;
      }
      return;
    }

    entry.element.classList.remove("active");
    if (entry.loaded && !entry.failed && entry.hasShown) {
      entry.element.classList.add("fading");
    } else {
      entry.element.classList.remove("fading");
    }
  },

  _scheduleImageTimeline(scene, imageEntries) {
    const { items, timelineEndMs } = this._buildImageTimeline(imageEntries);
    this.sceneMediaState = {
      sceneId: scene.id,
      startedAt: this._now(),
      timelineEndMs
    };

    if (!items.length) return;

    items.forEach(item => {
      this._scheduleSceneTimer(scene.id, item.startMs, () => {
        this._setImageEntryVisible(item.entry, true);
      });

      if (item.endMs > item.startMs) {
        this._scheduleSceneTimer(scene.id, item.endMs, () => {
          this._setImageEntryVisible(item.entry, false);
        });
      }
    });
  },

  _getRemainingSceneMediaMs(sceneId) {
    if (!this.sceneMediaState || this.sceneMediaState.sceneId !== sceneId) {
      return 0;
    }

    const remaining = this.sceneMediaState.timelineEndMs - (this._now() - this.sceneMediaState.startedAt);
    return Math.max(0, remaining);
  },

  async _renderScene(scene) {
    this.isTyping = true;

    // ===== 标题卡模式：全屏黑底+白色大字渐现渐隐 =====
    if (scene.mode === "titlecard") {
      await this._showTitleCard(scene.titleText || "");
      this.isTyping = false;
      // 标题卡结束后自动推进
      const nextId = this._resolveNext(scene);
      if (nextId) { await this._delay(400); this.goToScene(nextId); }
      return;
    }

    this._clearBar();

    // ===== 渲染主行 =====
    if (scene.lines && scene.lines.length > 0) {
      if (scene.mode === "narration") {
        // 播放旁白音频，基于字数自适应计算每行字幕显示时间
        let lineHolds = [];
        // ★ 共享音频检测：同一文件用于 lines + nextLines，避免重复播放
        const _sharedVoice = scene.narrationVoice && scene.nextVoice
          && scene.narrationVoice === scene.nextVoice;
        this._sharedVoiceActive = false;

        if (scene.narrationVoice) {
          const narrationAudio = await AudioManager.playNarration(scene.narrationVoice);
          if (narrationAudio && narrationAudio.duration > 0 && scene.lines.length > 0) {
            if (_sharedVoice && scene.nextLines) {
              // 共享音频：计算全部 narration 行（lines + nextLines中narration）的联合时长
              const narrationNls = scene.nextLines.filter(nl => nl.mode === "narration");
              // 扣除 nextLines 行间延迟，确保字幕在音频结束前完成
              const nlsDelay = narrationNls.reduce((s, nl) => s + (nl.delay || 400), 0);
              const availableMs = Math.max(0, narrationAudio.duration * 1000 - nlsDelay);
              const combined = this._calcCharBasedHolds(
                [...scene.lines, ...narrationNls], availableMs
              );
              lineHolds = combined.slice(0, scene.lines.length);
              this._sharedNextHolds = combined.slice(scene.lines.length);
              this._sharedVoiceActive = true;
            } else {
              lineHolds = this._calcCharBasedHolds(scene.lines, narrationAudio.duration * 1000);
            }
          }
        }
        for (let i = 0; i < scene.lines.length; i++) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          const hold = (lineHolds.length > 0 && lineHolds[i]) ? lineHolds[i] : undefined;
          await this._barLine(scene.lines[i], "narration", null, null, hold);
        }
      } else if (scene.mode === "dialogue") {
        // 对话模式：支持 dialogueVoice 音频
        let dialHolds = [];
        if (scene.dialogueVoice) {
          const dialAudio = await AudioManager.playNarration(scene.dialogueVoice);
          if (dialAudio && dialAudio.duration > 0 && scene.lines.length > 0) {
            dialHolds = this._calcCharBasedHolds(scene.lines, dialAudio.duration * 1000);
          }
        }
        for (let i = 0; i < scene.lines.length; i++) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          const line = scene.lines[i];
          const speaker = (i === 0 && scene.speaker) ? scene.speaker : line.speaker;
          const style = line.style || null;
          const hold = (dialHolds.length > 0 && dialHolds[i]) ? dialHolds[i] : undefined;
          await this._barLine(line, "dialogue", speaker, style, hold);
        }
      } else if (scene.mode === "choice") {
        // 选择模式：支持 narrationVoice 音频
        let choiceHolds = [];
        if (scene.narrationVoice) {
          const choiceAudio = await AudioManager.playNarration(scene.narrationVoice);
          if (choiceAudio && choiceAudio.duration > 0 && scene.lines.length > 0) {
            choiceHolds = this._calcCharBasedHolds(scene.lines, choiceAudio.duration * 1000);
          }
        }
        for (let i = 0; i < scene.lines.length; i++) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          const hold = (choiceHolds.length > 0 && choiceHolds[i]) ? choiceHolds[i] : undefined;
          await this._barLine(scene.lines[i], "narration", null, null, hold);
        }
      }
      // review模式不需要字幕
    }

    // ===== 渲染后续行 =====
    if (scene.nextLines) {
      // 如果有nextVoice音频，基于字数自适应计算narration型nextLines的显示时长
      let nextLineHolds = [];
      // ★ 共享音频：复用 narration 阶段已播放的同一音频，避免重复播
      if (this._sharedVoiceActive && this._sharedNextHolds) {
        nextLineHolds = this._sharedNextHolds;
        this._sharedVoiceActive = false;
        this._sharedNextHolds = null;
      } else if (scene.nextVoice) {
        const nextAudio = await AudioManager.playNarration(scene.nextVoice);
        if (nextAudio && nextAudio.duration > 0) {
          const narrationLines = scene.nextLines.filter(nl => nl.mode === "narration");
          // 计算所有行间延迟总和
          const totalDelay = scene.nextLines.reduce(
            (sum, nl) => sum + (nl.delay || (nl.mode === "narration" ? 400 : 500)), 0
          );
          nextLineHolds = this._calcCharBasedHolds(narrationLines, nextAudio.duration * 1000, totalDelay);
        }
      }

      let narrationIdx = 0; // 追踪当前是第几个narration行
      let _prevHadVoice = false; // 上一行有 nl.voice → 需清理音频避免重叠
      let _voiceSpanRemaining = 0;    // voiceSpan 剩余行数（音频仍需播放）
      let _voiceSpanHoldN = 0;        // narration voiceSpan 每行hold
      let _voiceSpanHoldD = 0;        // dialogue voiceSpan 每行hold

      // ★ 重置 voiceSpan 状态的辅助函数（先清理旧音频，再重置计数器）
      const _resetVoiceSpan = () => {
        if (_voiceSpanRemaining > 0 && _prevHadVoice) {
          // voiceSpan结束，确认停止音频
          AudioManager.stopNarration();
        }
        _voiceSpanRemaining = 0;
        _voiceSpanHoldN = 0;
        _voiceSpanHoldD = 0;
      };

      for (let i = 0; i < scene.nextLines.length; i++) {
        if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }

        const nl = scene.nextLines[i];

        // 检查是否与下一行标记为重叠对话（多人同时说话）
        const nextNl = scene.nextLines[i + 1];
        if (nl.overlap && nextNl && nextNl.mode === "dialogue") {
          // ★ 多人物重叠：播放第一行音频（若存在），同时渲染两行字幕
          _resetVoiceSpan();
          if (nl.voice) {
            await AudioManager.playNarration(nl.voice);
            _prevHadVoice = true;
          }
          await this._barMultiSpeaker(nl, nextNl);
          i++; // 跳过后一行
          continue;
        }

        // ★ 防止毗邻 voice 行音频重叠：voiceSpan内不清理，让音频继续播
        if (_prevHadVoice) {
          if (_voiceSpanRemaining <= 0) {
            // 不在voiceSpan内 → 清理旧音频
            AudioManager.stopNarration();
            await this._delay(60);  // 短暂等待音频引擎完全释放
          }
          _prevHadVoice = false;
        }

        if (nl.mode === "narration") {
          await this._delay(nl.delay || 400);
          let hold;
          // ★ voiceSpan 继续：使用预计算的hold，不播放新音频
          if (_voiceSpanRemaining > 0) {
            hold = _voiceSpanHoldN;
            _voiceSpanRemaining--;
          } else if (nl.voice) {
            const nlAudio = await AudioManager.playNarration(nl.voice);
            if (nlAudio && nlAudio.duration > 0) {
              const span = nl.voiceSpan || 1;
              // ★ voiceSpan 延迟补偿：扣除后续行间延迟，确保音频长度覆盖全部字幕
              const interLineDelay = (nl.delay || 400); // narration 默认 400ms
              const compensatedMs = Math.max(0, nlAudio.duration * 1000 - (span - 1) * interLineDelay);
              hold = Math.round(compensatedMs / span);
              if (span > 1) {
                _voiceSpanRemaining = span - 1;
                _voiceSpanHoldN = hold;
              }
            }
            _prevHadVoice = true;
          } else if (nextLineHolds.length > 0 && nextLineHolds[narrationIdx] !== undefined) {
            hold = nextLineHolds[narrationIdx];
            _voiceSpanRemaining = 0; // nextVoice 均分模式：不在独立voiceSpan内
          } else {
            _voiceSpanRemaining = 0; // 无voice无nextVoice → 结束任何残留voiceSpan
          }
          narrationIdx++;
          await this._barLine(nl, "narration", null, null, hold);
        } else if (nl.mode === "dialogue") {
          await this._delay(nl.delay || 500);
          // 对话行也支持按行独立音频 + 多行共享(voiceSpan)
          if (nl.voice) {
            let hold;
            // ★ voiceSpan 继续：使用预计算的hold，不播放新音频
            if (_voiceSpanRemaining > 0) {
              hold = _voiceSpanHoldD;
              _voiceSpanRemaining--;
            } else {
              const nlAudio = await AudioManager.playNarration(nl.voice);
              if (nlAudio && nlAudio.duration > 0) {
                const span = nl.voiceSpan || 1;
                // ★ voiceSpan 延迟补偿
                const interLineDelay = (nl.delay || 500);
                const compensatedMs = Math.max(0, nlAudio.duration * 1000 - (span - 1) * interLineDelay);
                hold = Math.round(compensatedMs / span);
                if (span > 1) {
                  _voiceSpanRemaining = span - 1;
                  _voiceSpanHoldD = hold;
                }
              }
            }
            await this._barLine(nl, "dialogue", nl.speaker, nl.style, hold);
            _prevHadVoice = true;
          } else {
            // 无voice的dialogue行：如果在voiceSpan内，继续使用span timing
            let hold;
            if (_voiceSpanRemaining > 0) {
              hold = _voiceSpanHoldD;
              _voiceSpanRemaining--;
            }
            await this._barLine(nl, "dialogue", nl.speaker, nl.style, hold);
          }
          if (nl.note) {
            await this._delay(200);
            await this._barNote(nl.note);
          }
        }
      }
    }

    // ===== 交互模块 =====
    if (scene.interaction === "cpr" && scene.onEnter?.cprMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      await this._runCPRModule(scene);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
    } else if (scene.interaction === "aed" && scene.onEnter?.aedMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      await this._runAEDModule(scene);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
    } else if (scene.interaction === "assign" && scene.onEnter?.assignMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      await this._runAssignModule(scene);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
    } else if (scene.interaction === "takeover" && scene.onEnter?.takeoverMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      await this._runTakeoverModule(scene);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
    }

    // ===== 选择 =====
    if (scene.choices) {
      await this._delay(600);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      this._showChoices(scene);
    }

    // ===== 复盘 =====
    if (scene.mode === "review") {
      await this._delay(400);

      // 计算分数并添加到排行榜
      const finalScore = this._calculateFinalScore();
      const rank = Leaderboard.addScore('玩家', finalScore, {
        quality: GameState.compression_quality,
        combo: Interactions._cprMaxCombo || 0,
        time: GameState.delay || 0,
      });

      Interactions.showReview();
    }

    this.isTyping = false;
    this._updateHUD();

    // ===== 自动推进到下一场景（非选择/非复盘时） =====
    if (!scene.choices && scene.mode !== "review") {
      const nextId = this._resolveNext(scene);
      if (nextId) {
        // 序幕视频：prologue_phone 台词结束后播放开头视频
        if (scene.playOpeningVideo) {
          this._clearBar();
          await this._delay(600);
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          await this._playOpeningVideo();
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
        }

        const remainingMediaMs = this._getRemainingSceneMediaMs(scene.id);
        if (remainingMediaMs > 0) {
          await this._delay(remainingMediaMs);
        }
        await this._delay(800);
        if (this.currentSceneId !== scene.id) return;
        this.goToScene(nextId);
      }
    }
  },

  // ==================== CPR模块 ====================
  _runCPRModule(scene) {
    return new Promise(resolve => {
      Interactions.startCPR((quality) => {
        // CPR完成后继续到下一场景
        const nextQuality = Math.max(0, GameState.compression_quality - 5);
        GameState.compression_quality = nextQuality;
        this.goToScene(scene.next);
        resolve();
      });
    });
  },

  // ==================== AED模块 ====================
  _runAEDModule(scene) {
    return new Promise(resolve => {
      Interactions.startAED(scene, (success) => {
        this.goToScene(scene.next);
        resolve();
      });
    });
  },

  // ==================== 点名分工模块 ====================
  _runAssignModule(scene) {
    return new Promise(resolve => {
      Interactions.startAssign(() => {
        this.goToScene(scene.next || "cpr_rhythm");
        resolve();
      });
    });
  },

  // ==================== 换人模块 ====================
  _runTakeoverModule(scene) {
    return new Promise(resolve => {
      Interactions.startTakeover(
        () => { this.goToScene(scene.next); resolve(); },
        () => {
          // 失败也继续
          setTimeout(() => {
            this.goToScene(scene.next);
            resolve();
          }, 1500);
        }
      );
    });
  },

  // ==================== 选择系统 ====================
  _showChoices(scene) {
    const layer = document.getElementById("choiceLayer");
    if (!layer) return;

    // 显示选择时：清除底部字幕，避免重叠
    this._clearBar();

    // 背景变暗
    document.getElementById("stage").classList.add("dimmed");

    layer.innerHTML = "";

    const prompt = document.createElement("div");
    prompt.className = "choice-prompt";
    prompt.textContent = scene.choicePrompt || scene.title;
    layer.appendChild(prompt);

    scene.choices.forEach(opt => {
      const btn = document.createElement("div");
      btn.className = "choice-option";
      btn.innerHTML = `
        <span class="choice-key">${opt.key}</span>
        <span class="choice-label">${opt.label}</span>
      `;
      btn.addEventListener("click", () => this._makeChoice(scene, opt));
      layer.appendChild(btn);
    });

    layer.classList.add("active");

    // 键盘绑定
    this._choiceKeyHandler = (e) => {
      const key = e.key.toUpperCase();
      const opt = scene.choices.find(o => o.key === key);
      if (opt) {
        document.removeEventListener("keydown", this._choiceKeyHandler);
        this._makeChoice(scene, opt);
      }
    };
    document.addEventListener("keydown", this._choiceKeyHandler);
  },

  _makeChoice(scene, opt) {
    document.getElementById("stage").classList.remove("dimmed");
    this._hideChoices();

    // 应用效果
    if (opt.effects) {
      GameState.applyEffects(opt.effects);
    }

    this._updateHUD();
    this.goToScene(opt.next);
  },

  _hideChoices() {
    const layer = document.getElementById("choiceLayer");
    if (layer) {
      layer.classList.remove("active");
      layer.innerHTML = "";
    }
    if (this._choiceKeyHandler) {
      document.removeEventListener("keydown", this._choiceKeyHandler);
      this._choiceKeyHandler = null;
    }
  },

  // ==================== 底部字幕带：narration/dialogue ====================
  // 当前行结束回调（点击跳过时触发）
  _barLine(line, type, speaker, style, customHold) {
    return new Promise(resolve => {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this._lineResolve = null;
      this._lineResolve = resolve;

      const bar = this._bar();
      if (!bar) {
        this._lineResolve = null;
        resolve();
        return;
      }

      const isNarration = type === "narration";
      const text = line.text;
      if (!text) {
        this._lineResolve = null;
        resolve();
        return;
      }

      // 清空旧内容再显示新行
      bar.innerHTML = "";

      const el = document.createElement("div");
      el.className = isNarration ? "sb-narration" : "sb-dialogue";

      if (!isNarration && speaker) {
        const tag = document.createElement("span");
        tag.className = "sb-speaker" + (style ? ` ${style}` : " character");
        tag.textContent = speaker;
        el.appendChild(tag);
      }

      el.appendChild(document.createTextNode(text));
      bar.appendChild(el);

      // 优先使用自定义hold（音频时长控制），其次使用line.hold，最后使用默认值
      const hold = customHold || line.hold || (isNarration ? 2800 : 2200);
      this.typingTimer = setTimeout(() => {
        this._lineResolve = null;
        resolve();
      }, hold);
    });
  },

  // 结束当前行的等待（点击跳过或自然超时）
  _finishLine() {
    if (this._lineResolve) {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      const cb = this._lineResolve;
      this._lineResolve = null;
      this.skipNext = false;
      cb();
    }
  },

  // ==================== 底部字幕带：对话注释小字 ====================
  _barNote(text) {
    return new Promise(resolve => {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this._lineResolve = null;
      this._lineResolve = resolve;
      const bar = this._bar();
      if (!bar || !text) {
        this._lineResolve = null;
        resolve();
        return;
      }
      const el = document.createElement("div");
      el.className = "sb-note";
      el.textContent = text;
      bar.appendChild(el);
      this.typingTimer = setTimeout(() => {
        this._lineResolve = null;
        resolve();
      }, 2800);
    });
  },

  // ==================== 底部字幕带：多人物重叠对话 ====================
  async _barMultiSpeaker(line1, line2) {
    const bar = this._bar();
    if (!bar) return;

    // 清空旧内容
    bar.querySelectorAll(".sb-dialogue, .sb-note").forEach(el => el.classList.add("old"));

    // 同时创建两行
    const el1 = document.createElement("div");
    el1.className = "sb-dialogue";
    el1.style.marginBottom = "2px";
    const tag1 = document.createElement("span");
    tag1.className = `sb-speaker ${line1.style || "character"}`;
    tag1.textContent = line1.speaker || "";
    el1.appendChild(tag1);
    const text1 = document.createTextNode(line1.text);
    el1.appendChild(text1);
    // 立即显示（不逐字，保持电影感）
    bar.appendChild(el1);

    const el2 = document.createElement("div");
    el2.className = "sb-dialogue";
    const tag2 = document.createElement("span");
    tag2.className = `sb-speaker ${line2.style || "character"}`;
    tag2.textContent = line2.speaker || "";
    el2.appendChild(tag2);
    const text2 = document.createTextNode(line2.text);
    el2.appendChild(text2);
    bar.appendChild(el2);

    await this._delay(2000);
  },

  // ==================== 清空底部字幕带 ====================
  _clearBar() {
    const bar = this._bar();
    if (bar) bar.innerHTML = "";
  },

  _clearIntertitle() {
    const layer = document.getElementById("intertitleLayer");
    if (!layer) return;
    layer.className = "";
    layer.innerHTML = "";
    this.skipNext = false;
  },

  _buildAssetCandidates(basePath, exts) {
    if (!basePath || !basePath.trim()) return [];
    const trimmed = basePath.trim();
    if (/\.[a-z0-9]+$/i.test(trimmed)) return [trimmed];
    return exts.map(ext => `${trimmed}${ext}`);
  },

  _applyStageFallback(stage, fallback) {
    if (!stage) return;
    stage.style.backgroundImage = "";
    stage.className = fallback;
  },

  _loadImageSlot(entry, mediaLayer, stage, onResolve) {
    const slot = entry.slot;
    const candidates = this._buildAssetCandidates(slot.url, [".webp", ".png", ".jpg", ".jpeg"]);
    if (!candidates.length) {
      entry.failed = true;
      onResolve(false);
      return;
    }

    const img = document.createElement("img");
    img.className = `scene-img ${slot.cssClass || ""}`;
    img.alt = "";
    entry.element = img;
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        entry.failed = true;
        img.remove();
        onResolve(false);
        return;
      }
      img.src = candidates[index++];
    };

    img.onload = () => {
      entry.loaded = true;
      img.classList.remove("fading");
      if (entry.shouldShow) {
        img.classList.add("active");
        entry.hasShown = true;
      }
      stage.style.backgroundImage = "";
      stage.className = "";
      onResolve(true);
    };
    img.onerror = tryNext;

    if (mediaLayer) mediaLayer.appendChild(img);
    tryNext();
  },

  _loadVideoSlot(slot, mediaLayer, stage, onResolve) {
    const candidates = this._buildAssetCandidates(slot.url, [".mp4", ".webm"]);
    if (!candidates.length) {
      onResolve(false);
      return;
    }

    const vid = document.createElement("video");
    vid.className = `scene-video ${slot.cssClass || ""}`;
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        vid.remove();
        onResolve(false);
        return;
      }
      vid.src = candidates[index++];
      vid.load();
    };

    vid.onloadeddata = () => {
      vid.classList.add("active");
      stage.style.backgroundImage = "";
      stage.className = "";
      vid.play().catch(() => {});
      onResolve(true);
    };
    vid.onerror = tryNext;

    if (mediaLayer) mediaLayer.appendChild(vid);
    tryNext();
  },

  _playSceneAudio(scene) {
    const sounds = scene.assets?.sounds || [];
    sounds.forEach((sound, index) => {
      if (!sound.url || !sound.url.trim()) return;
      if (sound.type === "bgm") {
        AudioManager.playBgm(sound.url, { volume: sound.volume || 0.6 });
      } else if (sound.type === "ambient") {
        AudioManager.setAmbience(sound.url, { volume: sound.volume || 0.5 });
      } else if (sound.type === "voice") {
        AudioManager.playVoice(scene.id, `scene_${index + 1}`, { basePath: sound.url, volume: sound.volume || 1.0 });
      } else if (sound.type === "sfx") {
        AudioManager.playSfx(sound.url, { volume: sound.volume || 0.8 });
      }
    });
  },

  // ==================== 舞台管理 ====================
  _updateStage(scene) {
    const stage = document.getElementById("stage");
    const mediaLayer = document.getElementById("mediaLayer");
    const fallback = scene.stage || "rain_road";
    const sceneId = scene.id;

    if (mediaLayer) mediaLayer.innerHTML = "";

    const assets = scene.assets || {};
    const images = (assets.images || []).filter(img => img.url && img.url.trim() !== "");
    const videos = (assets.videos || []).filter(vid => vid.url && vid.url.trim() !== "");
    const totalSlots = images.length + videos.length;

    if (!totalSlots) {
      this.sceneMediaState = { sceneId, startedAt: this._now(), timelineEndMs: 0 };
      this._applyStageFallback(stage, fallback);
    } else {
      let resolvedSlots = 0;
      let loadedAny = false;
      let fallbackApplied = false;
      const imageEntries = images.map(slot => ({
        slot,
        element: null,
        loaded: false,
        failed: false,
        hasShown: false,
        shouldShow: false
      }));

      const handleResolved = (success) => {
        resolvedSlots += 1;
        loadedAny = loadedAny || success;
        if (resolvedSlots >= totalSlots && !loadedAny && !fallbackApplied) {
          fallbackApplied = true;
          this._applyStageFallback(stage, fallback);
        }
      };

      videos.forEach(slot => this._loadVideoSlot(slot, mediaLayer, stage, handleResolved));
      imageEntries.forEach(entry => this._loadImageSlot(entry, mediaLayer, stage, handleResolved));
      this._scheduleImageTimeline(scene, imageEntries);

      this._scheduleSceneTimer(sceneId, 5000, () => {
        if (!loadedAny && !fallbackApplied) {
          fallbackApplied = true;
          this._applyStageFallback(stage, fallback);
        }
      });
    }

    if (scene.speed) {
      stage.style.setProperty("--media-speed", scene.speed.media || 1.0);
      stage.style.setProperty("--text-speed", scene.speed.text || 1.0);
      stage.style.setProperty("--hold-speed", scene.speed.hold || 1.0);
    }
  },

  // ==================== 雨效 ====================
  _updateRain(scene) {
    const layer = document.getElementById("rainLayer");
    if (!layer) return;

    if (scene.rain) {
      layer.classList.add("active");
      layer.innerHTML = "";
      const count = scene.id.includes("prologue") ? 70 : 90;
      for (let i = 0; i < count; i++) {
        const drop = document.createElement("div");
        drop.className = "rain-drop" + (Math.random() > 0.3 ? " wind" : "") + (Math.random() > 0.6 ? " heavy" : "");
        drop.style.left = Math.random() * 100 + "%";
        drop.style.animationDuration = (0.4 + Math.random() * 0.9) + "s";
        drop.style.animationDelay = Math.random() * 1.5 + "s";
        layer.appendChild(drop);
      }
      this.rainActive = true;
    } else {
      layer.classList.remove("active");
      layer.innerHTML = "";
      this.rainActive = false;
    }
  },

  // ==================== HUD ====================
  _updateHUD() {
    const hud = document.getElementById("hud");
    if (!hud) return;

    const elapsed = GameState.press_start_delay + GameState.false_wait_penalty;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const interruptMins = Math.floor(GameState.compression_interrupt_time / 60);
    const interruptSecs = GameState.compression_interrupt_time % 60;
    const interruptStr = `${String(interruptMins).padStart(2, '0')}:${String(interruptSecs).padStart(2, '0')}`;

    const quality = GameState.compression_quality;
    const qualityCls = quality >= 70 ? "good" : quality >= 50 ? "warning" : "danger";

    const aedStatus = GameState.getAedStatusText();
    const witnessCount = GameState.getActiveWitnessCount();

    hud.innerHTML = `
      <div class="hud-row"><span class="hud-label">倒地后</span><span class="hud-value">${timeStr}</span></div>
      <div class="hud-row"><span class="hud-label">按压中断</span><span class="hud-value ${interruptSecs > 10 ? 'danger' : ''}">${interruptStr}</span></div>
      <div class="hud-row"><span class="hud-label">按压质量</span><span class="hud-value ${qualityCls}">${quality}</span></div>
      <div class="hud-row"><span class="hud-label">AED</span><span class="hud-value">${aedStatus}</span></div>
      <div class="hud-row"><span class="hud-label">证人</span><span class="hud-value">${witnessCount}/3</span></div>
    `;

    hud.className = this.hudVisible ? "" : "hidden";
  },

  toggleHUD() {
    this.hudVisible = !this.hudVisible;
    const hud = document.getElementById("hud");
    if (hud) hud.className = this.hudVisible ? "" : "hidden";
  },

  // ==================== 特效 ====================
  _screenShake() {
    const stage = document.getElementById("stage");
    if (stage) {
      stage.classList.add("screen-shake");
      setTimeout(() => stage.classList.remove("screen-shake"), 400);
    }
  },

  _showVignette() {
    const overlay = document.getElementById("cinematicOverlay");
    if (overlay) overlay.style.boxShadow = "inset 0 8vh 16vh rgba(0,0,0,0.75), inset 0 -8vh 16vh rgba(0,0,0,0.75)";
  },

  _hideVignette() {
    const overlay = document.getElementById("cinematicOverlay");
    if (overlay) overlay.style.boxShadow = "inset 0 6vh 12vh rgba(0,0,0,0.6), inset 0 -6vh 12vh rgba(0,0,0,0.6)";
  },

  _showCprFlash() {
    const stage = document.getElementById("stage");
    if (stage && !document.getElementById("cprFlashFx")) {
      const fx = document.createElement("div");
      fx.id = "cprFlashFx";
      fx.style.cssText = `
        position:absolute;top:0;left:0;width:100%;height:100%;
        background:rgba(255,255,255,0.03);
        pointer-events:none;z-index:4;
        animation:cprFlashAnim 0.55s ease-in-out infinite;
      `;
      stage.appendChild(fx);
    }
  },

  _hideCprFlash() {
    const fx = document.getElementById("cprFlashFx");
    if (fx) fx.remove();
  },

  _showAedDot() {
    const stage = document.getElementById("stage");
    if (stage && !document.getElementById("aedMapDot")) {
      const dot = document.createElement("div");
      dot.id = "aedMapDot";
      dot.style.cssText = `
        position:absolute;width:24px;height:24px;border-radius:50%;
        background:var(--amber);
        top:45%;left:42%;
        box-shadow:0 0 30px var(--amber),0 0 60px rgba(245,200,66,0.4);
        animation:aedDotBreathe 2s ease-in-out infinite;
        z-index:5;pointer-events:none;
      `;
      stage.appendChild(dot);
    }
  },

  _hideAedDot() {
    const dot = document.getElementById("aedMapDot");
    if (dot) dot.remove();
  },

  _hideAllModules() {
    ["cprModule", "aedModule", "assignModule", "takeoverModule", "reviewLayer"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });
    document.getElementById("choiceLayer")?.classList.remove("active");
    document.getElementById("interactionLayer")?.classList.remove("active");
    document.getElementById("stage")?.classList.remove("dimmed");
    this._clearBar();
    this._hideCprFlash();
    this._hideAedDot();
    this._hideVignette();
  },

  // ==================== 导航提示 ====================
  _showNavHint() {
    // 自动流程：不再显示"继续"提示
  },
  _hideNavHint() {
    // 自动流程
  },

  // ==================== 场景标签 ====================
  _updateSceneLabel(scene) {
    const el = document.getElementById("sceneLabel");
    if (el) {
      el.textContent = `${scene.chapter} · ${scene.title}`;
    }
  },

  // ==================== 暂停菜单 ====================
  _showPauseMenu() {
    this.paused = true;
    document.getElementById("pauseMenu").classList.add("active");
  },

  _hidePauseMenu() {
    this.paused = false;
    document.getElementById("pauseMenu").classList.remove("active");
  },

  _togglePause() {
    if (this.paused) this._hidePauseMenu();
    else this._showPauseMenu();
  },

  // ==================== 全局输入绑定 ====================
  _bindGlobalInputs() {
    document.addEventListener("keydown", (e) => {
      // 暂停菜单中
      if (this.paused) {
        if (e.code === "Escape" || e.code === "Space") {
          e.preventDefault();
          this._hidePauseMenu();
        }
        return;
      }

      // 全局快捷键
      if (e.code === "Escape") {
        e.preventDefault();
        this._togglePause();
        return;
      }
      if (e.code === "KeyH" && !e.ctrlKey && !e.metaKey) {
        this.toggleHUD();
        return;
      }
      if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey && !this.isTyping) {
        this.restartGame();
        return;
      }

      // 开始画面：按空格或点击开始游戏
      if (e.code === "Space" && !this.isTyping) {
        const startScreen = document.getElementById("startScreen");
        if (startScreen && startScreen.style.display !== "none") {
          e.preventDefault();
          this._startGame();
          return;
        }
      }
    });

    // 鼠标点击：仅用于交互模块，不跳过字幕
    document.getElementById("game").addEventListener("click", (e) => {
      // 如果点击的是startScreen中的按钮，不处理
      if (e.target.closest("#startScreen")) {
        e.stopPropagation();
        return;
      }
      if (e.target.closest("#choiceLayer")) return;
      if (e.target.closest("#pauseMenu")) return;
      if (e.target.closest("#debugPanel")) return;
    });

    // 开始画面点击（在index.html中处理）

    // 暂停菜单按钮
    document.getElementById("pauseResume")?.addEventListener("click", () => this._hidePauseMenu());
    document.getElementById("pauseRestart")?.addEventListener("click", () => {
      this._hidePauseMenu();
      this._returnToMainMenu();
    });
    document.getElementById("pauseToggleHUD")?.addEventListener("click", () => {
      this.toggleHUD();
      this._hidePauseMenu();
    });
    document.getElementById("pauseSave")?.addEventListener("click", () => {
      this._saveProgress();
      this._showPauseMessage("进度已保存");
    });
  },

  // ==================== 重新开始 ====================
  restartGame() {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this._clearSceneTimers();
    this._hideAllModules();
    this._hideChoices();
    this._clearBar();
    this._clearIntertitle();
    document.getElementById("reviewLayer").classList.remove("active");
    document.getElementById("reviewLayer").innerHTML = "";
    document.getElementById("pauseMenu").classList.remove("active");
    this.paused = false;
    this.currentSceneId = null;
    this._sharedVoiceActive = false;
    this._sharedNextHolds = null;
    Interactions.cleanup();
    GameState.init();
    this._updateHUD();
    this._showStartScreen();
  },

  // ==================== 开头视频播放 ====================
  async _playOpeningVideo() {
    return new Promise(resolve => {
      const overlay = document.createElement("div");
      overlay.id = "openingVideoOverlay";
      overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100vw;height:100vh;
        background:#000;z-index:9999;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;
      `;

      const video = document.createElement("video");
      video.src = "assets/videos/opening.mp4";
      video.style.cssText = "max-width:100%;max-height:100%;object-fit:contain;";
      video.muted = false;
      video.playsInline = false;

      let resolved = false;
      const cleanup = () => {
        if (resolved) return;
        resolved = true;
        video.removeEventListener("ended", cleanup);
        video.removeEventListener("error", cleanup);
        document.removeEventListener("keydown", skipHandler);
        overlay.removeEventListener("click", skipClick);
        overlay.remove();
        resolve();
      };

      const skipHandler = (e) => {
        if (e.code === "Space" || e.code === "Escape" || e.code === "Enter") {
          e.preventDefault();
          cleanup();
        }
      };
      const skipClick = () => cleanup();

      video.addEventListener("ended", cleanup);
      video.addEventListener("error", () => {
        // 视频加载失败，直接跳过
        cleanup();
      });
      document.addEventListener("keydown", skipHandler);
      overlay.addEventListener("click", skipClick);

      overlay.appendChild(video);
      document.body.appendChild(overlay);

      // 提示文字
      const hint = document.createElement("div");
      hint.style.cssText = `
        position:absolute;bottom:8vh;left:50%;transform:translateX(-50%);
        color:rgba(255,255,255,0.4);font-size:14px;letter-spacing:0.1em;
        pointer-events:none;
      `;
      hint.textContent = "按任意键跳过";
      overlay.appendChild(hint);

      video.play().catch(() => cleanup());
    });
  },

  // ==================== 字数自适应字幕时长算法 ====================
  /**
   * 根据每条字幕的字数，按比例分配音频时长
   * @param {Array}  lines         - 字幕行数组（每行需有 text 字段）
   * @param {number} totalAudioMs  - 音频总时长（毫秒）
   * @param {number} interDelayMs  - 行间延迟总和（毫秒）
   * @returns {Array<number>}      - 每行对应的hold时长（毫秒）
   */
  _calcCharBasedHolds(lines, totalAudioMs, interDelayMs = 0) {
    if (!lines || lines.length === 0) return [];

    const totalChars = lines.reduce((sum, line) => sum + (line.text ? line.text.length : 0), 0);
    if (totalChars === 0) {
      // 无文本则均分
      return lines.map(() => Math.round(totalAudioMs / lines.length));
    }

    const availableMs = Math.max(0, totalAudioMs - interDelayMs);
    const MIN_HOLD = 600;   // 最短显示时间（毫秒），防止短句一闪而过
    const MAX_HOLD = 8000;  // 最长显示时间（毫秒），防止长句滞留过久

    // 按字数比例初步分配
    const rawHolds = lines.map(line => {
      const chars = line.text ? line.text.length : 0;
      return Math.round((chars / totalChars) * availableMs);
    });

    // Clamp到合理范围
    const clamped = rawHolds.map(h => Math.max(MIN_HOLD, Math.min(MAX_HOLD, h)));
    const clampedTotal = clamped.reduce((a, b) => a + b, 0);

    // 二次归一化，确保总时长精确匹配可用时长
    if (clampedTotal > 0) {
      return clamped.map(h => Math.round((h / clampedTotal) * availableMs));
    }
    return rawHolds;
  },

  // ==================== 工具 ====================
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// ========== DEBUG PANEL — 调试模式 ==========
const DebugPanel = {
  _initialized: false,
  _refreshInterval: null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this._populateSceneSelect();
    this._bindEvents();
    this._startAutoRefresh();

    console.log("%c[DebugPanel] 调试面板已就绪 %c| %c按 ` 键切换显示",
      "color:#6ee7b7;", "", "color:#8f98a3;");
  },

  // 遍历 SCENES 填充下拉框
  _populateSceneSelect() {
    const select = document.getElementById("dbgSceneSelect");
    if (!select) return;

    // 清空并重建
    select.innerHTML = '<option value="">-- 选择场景 --</option>';

    // 按章节分组
    const groups = {};
    Object.entries(SCENES).forEach(([id, scene]) => {
      const ch = scene.chapter || "其他";
      if (!groups[ch]) groups[ch] = [];
      groups[ch].push({ id, title: scene.title, stage: scene.stage });
    });

    Object.entries(groups).forEach(([chapter, scenes]) => {
      const optgroup = document.createElement("optgroup");
      optgroup.label = chapter;
      scenes.forEach(s => {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = `${s.title}`;
        optgroup.appendChild(opt);
      });
      select.appendChild(optgroup);
    });
  },

  // 绑定事件
  _bindEvents() {
    // 下拉框切换
    const select = document.getElementById("dbgSceneSelect");
    if (select) {
      select.addEventListener("change", (e) => {
        const sceneId = e.target.value;
        if (!sceneId) return;

        // 关闭开始画面
        const start = document.getElementById("startScreen");
        if (start) {
          start.classList.add("fade-out");
          setTimeout(() => { start.style.display = "none"; }, 1000);
        }

        // 跳转到选中场景
        Game.goToScene(sceneId);
      });
    }

    // 折叠/展开按钮
    const toggle = document.getElementById("dbgToggle");
    const panel = document.getElementById("debugPanel");
    if (toggle && panel) {
      toggle.addEventListener("click", () => {
        const collapsed = panel.classList.toggle("collapsed");
        toggle.textContent = collapsed ? "+" : "−";
      });
    }

    // 重新开始按钮
    document.getElementById("dbgRestart")?.addEventListener("click", () => {
      Game.restartGame();
    });

    // HUD切换按钮
    document.getElementById("dbgToggleHud")?.addEventListener("click", () => {
      Game.toggleHUD();
    });

    // 全局快捷键：` 键切换调试面板显示
    document.addEventListener("keydown", (e) => {
      if (e.code === "Backquote" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const panel = document.getElementById("debugPanel");
        if (panel) {
          const wasCollapsed = panel.classList.contains("collapsed");
          if (wasCollapsed) {
            panel.classList.remove("collapsed");
            document.getElementById("dbgToggle").textContent = "−";
          } else {
            panel.classList.add("collapsed");
            document.getElementById("dbgToggle").textContent = "+";
          }
        }
      }
    });

    // 阻止调试面板内的点击冒泡到游戏层
    const dbgPanel = document.getElementById("debugPanel");
    if (dbgPanel) {
      dbgPanel.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }
  },

  // 自动刷新状态显示
  _startAutoRefresh() {
    this._refresh();

    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._refreshInterval = setInterval(() => this._refresh(), 500);
  },

  _refresh() {
    // 更新当前场景
    const currentEl = document.getElementById("dbgCurrentScene");
    if (currentEl) {
      const scene = SCENES[Game.currentSceneId];
      if (scene) {
        currentEl.textContent = `[${scene.chapter}] ${scene.title} (${Game.currentSceneId})`;
      } else {
        currentEl.textContent = Game.currentSceneId || "未开始";
      }
    }

    // 更新下拉框选中项
    const select = document.getElementById("dbgSceneSelect");
    if (select && Game.currentSceneId) {
      select.value = Game.currentSceneId;
    }

    // 更新状态变量
    const stateEl = document.getElementById("dbgStateVars");
    if (!stateEl) return;

    const s = GameState;
    const vars = [
      { name: "延误(s)",    key: "press_start_delay",    fmt: v => `${v}` },
      { name: "错误等待(s)", key: "false_wait_penalty",   fmt: v => `${v}` },
      { name: "按压质量",    key: "compression_quality",  fmt: v => {
        const cls = v >= 70 ? "good" : v >= 50 ? "warn" : "bad";
        return { text: `${v}`, cls };
      }},
      { name: "中断时间(s)", key: "compression_interrupt_time", fmt: v => `${v}` },
      { name: "资源激活",    key: "resource_activation",  fmt: v => v || "—" },
      { name: "证人可信度",  key: "witness_credibility",  fmt: v => `${v}/6` },
      { name: "舆论扩散",    key: "public_spread",        fmt: v => `${v}/5` },
      { name: "家属信任",    key: "family_trust",         fmt: v => {
        const cls = v >= 2 ? "good" : v >= 0 ? "warn" : "bad";
        return { text: `${v}`, cls };
      }},
      { name: "心理负担",    key: "wangyuan_burden",      fmt: v => `${v}/10` },
      { name: "换人",        key: "takeover_success",     fmt: v => v === true ? "✓" : v === false ? "✗" : "—" },
      { name: "AED流程",     key: "aed_protocol_clean",   fmt: v => v === true ? "✓" : v === false ? "✗" : "—" },
      { name: "AED到场",     key: "aed_arrival_timing",   fmt: v => v || "mid" },
      { name: "活跃证人",    key: null,                    fmt: () => `${s.getActiveWitnessCount()}/3` },
      { name: "CPR总次",     key: "cpr_total_beats",      fmt: v => `${v}` },
    ];

    let html = "";
    vars.forEach(v => {
      let value, cls = "";
      if (v.key) {
        const raw = s[v.key];
        const formatted = v.fmt(raw);
        if (typeof formatted === "object") {
          value = formatted.text;
          cls = formatted.cls;
        } else {
          value = formatted;
        }
      } else {
        value = v.fmt();
      }

      html += `<div class="dbg-var">
        <span class="dbg-var-name">${v.name}</span>
        <span class="dbg-var-val ${cls}">${value}</span>
      </div>`;
    });

    stateEl.innerHTML = html;
  }
};

// ========== 全局状态反馈函数（interactions.js调用） ==========
window.showStateFeedback = function(text, type) {
  const container = document.getElementById("stateFeedback");
  if (!container) return;
  const item = document.createElement("div");
  item.className = `state-feedback-item ${type || "neutral"}`;
  item.textContent = text;
  container.appendChild(item);
  setTimeout(() => item.remove(), 3100);
};

window.restartGame = function() {
  Game.restartGame();
};

// ========== 分数计算 ==========
Game._calculateFinalScore = function() {
  let score = 1000; // 基础分

  // 按压质量扣分/加分
  const quality = GameState.compression_quality;
  if (quality >= 85) score += 500;      // 优秀
  else if (quality >= 70) score += 200; // 良好
  else if (quality >= 50) score -= 100; // 一般
  else score -= 300;                    // 下降

  // 连击加分
  const maxCombo = Interactions._cprMaxCombo || 0;
  score += maxCombo * 50;

  // 中断时间扣分
  const interruptTime = GameState.compression_interrupt_time || 0;
  score -= interruptTime * 20;

  // 延误扣分
  const delay = GameState.delay || 0;
  score -= delay * 10;

  // 家属信任加分
  const familyTrust = GameState.family_trust || 0;
  score += familyTrust * 100;

  // 证人激活加分
  const witnesses = GameState.active_witnesses || 0;
  score += witnesses * 150;

  // 确保分数不为负
  return Math.max(0, Math.round(score));
};

// ========== 进度保存系统 ==========
Game._saveProgress = function() {
  const progress = {
    currentScene: this.currentSceneId,
    gameState: { ...GameState },
    timestamp: Date.now(),
  };
  localStorage.setItem('aed_progress', JSON.stringify(progress));
  console.log('进度已保存:', this.currentSceneId);
};

Game._loadProgress = function() {
  const saved = localStorage.getItem('aed_progress');
  if (saved) {
    const progress = JSON.parse(saved);
    return progress;
  }
  return null;
};

Game._cleanup = function() {
  // 停止所有交互
  Interactions.cleanup();

  // 清理场景
  this._clearBar();
  this._hideAllModules();

  // 重置状态
  this.isTyping = false;
  this.currentSceneId = null;
};

Game._returnToMainMenu = function() {
  // 保存进度
  this._saveProgress();

  // 清理游戏状态
  this._cleanup();

  // 显示首页
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.style.display = "flex";
  }

  // 停止所有音效
  AudioManager.stopAll();
  AudioManager.stopBackgroundAmbience();
};

Game._showPauseMessage = function(message) {
  const msgEl = document.createElement('div');
  msgEl.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(110, 231, 183, 0.9);
    color: #000;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 14px;
    z-index: 1000;
    animation: fadeInOut 2s ease forwards;
  `;
  msgEl.textContent = message;
  document.body.appendChild(msgEl);
  setTimeout(() => msgEl.remove(), 2000);
};

// ========== 启动游戏 ==========
document.addEventListener("DOMContentLoaded", () => {
  Game.init();
  DebugPanel.init();
  console.log("%c《生命守护者》Demo框架已就绪 %c| %c点击或按空格开始 %c| %c按 ` 打开调试面板",
    "color:#f5c842;font-size:16px;",
    "",
    "color:#8f98a3;",
    "",
    "color:#6ee7b7;");
});
