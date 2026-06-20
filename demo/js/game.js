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
  _sceneImageEntries: null,
  _sceneImageCurrent: 0,
  textSpeed: 1.0,           // 全局字幕/音频速度倍率 (0.5 - 2.0)
  _floatPanelFromStart: false,

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
    this._stopSceneAudioTracks(); // ★ 清理场景级BGM/环境音轨
    this._sharedVoiceActive = false;  // 清理共享音频状态
    this._sharedNextHolds = null;
    this._boundAudio = null;         // 清理绑定模式音频引用
    this._sceneImageEntries = null;
    this._sceneImageCurrent = 0;
    const prevSceneId = this.currentSceneId;
    this.currentSceneId = sceneId;
    this.isTyping = false;
    this._cinematicReady = false;

    Interactions.cleanup();
    this._hideAllModules();
    this._clearStackedNarrator();

    // 场景切换过渡：先黑入 → 加载新素材 → 黑出
    this._sceneTransition(async () => {
      // ★ 电影转场：进雨夜的圆圈时，从下往上滑入第一张图
      if (sceneId === 'prologue_rain') {
        console.log('[TRANSITION] starting cinematic for prologue_rain');
        await this._cinematicTransition('prologue_phone', 'prologue_rain');
      }
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
  async _sceneTransition(onReady) {
    const overlay = document.getElementById("sceneTransition");
    if (!overlay) { await onReady(); return; }

    overlay.classList.add("active");
    await this._delay(300);
    await onReady();
    // 给新内容一帧渲染时间再淡出
    await this._delay(100);
    overlay.classList.remove("active");
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

  _showSceneImage(imgNum) {
    if (!imgNum || imgNum < 1) return;
    const entries = this._sceneImageEntries;
    if (!entries || !entries.length) {
      console.warn('[IMG] No image entries for scene');
      return;
    }
    const idx = imgNum - 1;
    if (idx >= entries.length) {
      console.warn(`[IMG] img_${String(imgNum).padStart(2,'0')} out of range (max ${entries.length})`);
      return;
    }
    const entry = entries[idx];
    console.log(`[IMG] show img_${String(imgNum).padStart(2,'0')} | loaded=${entry.loaded} failed=${entry.failed} shouldShow=${entry.shouldShow}`);
    // 隐藏当前图
    if (this._sceneImageCurrent >= 1 && this._sceneImageCurrent <= entries.length) {
      this._setImageEntryVisible(entries[this._sceneImageCurrent - 1], false);
    }
    // 显示目标图：移到DOM末尾确保z-index最高
    if (entry.element && entry.element.parentNode) {
      entry.element.parentNode.appendChild(entry.element);
    }
    this._setImageEntryVisible(entry, true);
    this._sceneImageCurrent = imgNum;
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

    // ===== NEW: 绑定清单模式 — 统一驱动 音频+字幕+图片，倍速全局持久 =====
    const bound = await this._tryRenderBoundScene(scene);
    console.log('[BOUND-RESULT] scene=%s bound=%s type=%s', scene.id, bound, typeof bound);
    if (!bound) SyncLog.modeEnter('BOUND-SKIPPED→fallback', scene.id);  // ★
    if (bound) {
      this.isTyping = false;
      this._updateHUD();
      this._proceedToNext(scene);
      return;
    }

    // ===== 时间戳模式：lines 有 start 字段时，走精确时间轴同步 =====
    if (scene.lines && scene.lines.length > 0 && this._hasTimestamps(scene.lines)) {
      SyncLog.modeEnter('TIMED-SEQUENCE(fallback)', scene.id);
      await this._renderTimedScene(scene);
      // 时间戳模式已处理 lines + nextLines，跳过旧逻辑
      this.isTyping = false;
      this._updateHUD();
      this._proceedToNext(scene);
      return;
    }

    // ===== 渲染主行（旧逻辑：字数均分，无时间戳时使用） =====
    SyncLog.modeEnter('OLD-LEGACY', scene.id);
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
              // ★ 行间延迟需按速度倍率缩放，确保字幕在加速音频结束前完成
              const nlsDelay = narrationNls.reduce((s, nl) => s + (nl.delay || 400) / this.textSpeed, 0);
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
          if (scene.lines[i].img) this._showSceneImage(scene.lines[i].img);
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
          if (line.img) this._showSceneImage(line.img);
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
          if (scene.lines[i].img) this._showSceneImage(scene.lines[i].img);
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
          if (nl.img) this._showSceneImage(nl.img);
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
          await this._sceneDelay(nl.delay || 400);
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
              const interLineDelay = (nl.delay || 400) / this.textSpeed; // 速度感知
              const compensatedMs = Math.max(0, nlAudio.duration * 1000 / this.textSpeed - (span - 1) * interLineDelay);
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
          if (nl.img) this._showSceneImage(nl.img);
          await this._barLine(nl, "narration", null, null, hold);
        } else if (nl.mode === "dialogue") {
          await this._sceneDelay(nl.delay || 500);
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
                // ★ voiceSpan 延迟补偿（速度感知）
                const interLineDelay = (nl.delay || 500) / this.textSpeed;
                const compensatedMs = Math.max(0, nlAudio.duration * 1000 / this.textSpeed - (span - 1) * interLineDelay);
                hold = Math.round(compensatedMs / span);
                if (span > 1) {
                  _voiceSpanRemaining = span - 1;
                  _voiceSpanHoldD = hold;
                }
              }
            }
            if (nl.img) this._showSceneImage(nl.img);
            await this._barLine(nl, "dialogue", nl.speaker, nl.style, hold);
            _prevHadVoice = true;
          } else {
            // 无voice的dialogue行：如果在voiceSpan内，继续使用span timing
            let hold;
            if (_voiceSpanRemaining > 0) {
              hold = _voiceSpanHoldD;
              _voiceSpanRemaining--;
            }
            if (nl.img) this._showSceneImage(nl.img);
            await this._barLine(nl, "dialogue", nl.speaker, nl.style, hold);
          }
          if (nl.note) {
            await this._sceneDelay(200);
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
      console.log('[AED] waiting 1500ms before interaction...');
      await this._delay(1500);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      console.log('[AED] starting interaction');
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

  // ==================== 绑定清单模式：音频-字幕锁步系统（彻底绑定） ====================
  /**
   * ★ 核心原则：所有计时统一由 audio.currentTime 驱动，不再依赖 setTimeout/onended。
   * 
   * 音轨架构（3层并发）：
   *   L1 旁白音轨 — raf 轮询 currentTime，在音频结束瞬间切下一条字幕
   *   L2 背景音乐 — 场景级循环，playbackRate 同步变速
   *   L3 环境音效 — Web Audio 合成 / 文件播放
   * 
   * 字幕时序（统一虚拟时钟）：
   *   有音频 → raf 等待 audio.ended，字幕与音频自然绑定
   *   无音频 → setTimeout 按 hold/textSpeed 计算，变速时重新调度
   * 
   * 变速处理：
   *   playbackRate 变更 → 音频实际播放速度改变 → 提前/延后 ended 事件
   *   → 字幕自然跟随，无需额外同步
   */
  async _tryRenderBoundScene(scene) {
    SyncLog.modeEnter('BOUND-MANIFEST', scene.id);  // ★ 诊断日志
    const manifestUrl = `assets/voices/${scene.id}.json?t=${Date.now()}`;
    let manifest;
    try {
      const resp = await fetch(manifestUrl);
      if (!resp.ok) return false;
      manifest = await resp.json();
    } catch { return false; }
    if (!manifest.entries || manifest.entries.length === 0) return false;

    const entries = manifest.entries;
    const sceneId = scene.id;

    this._sceneAudioTracks = [];
    this._startSceneAudioLayer(scene);

    // 预加载所有语音文件
    const preloaded = new Map();
    await Promise.all(entries.map((entry, i) => new Promise(resolve => {
      if (!entry.file || entry.noVoice) { preloaded.set(i, null); resolve(); return; }
      const a = new Audio(entry.file);
      a.preload = "auto";
      const done = () => { a.playbackRate = this.textSpeed; preloaded.set(i, a); resolve(); };
      a.addEventListener("canplaythrough", done, { once: true });
      a.addEventListener("loadedmetadata", done, { once: true });
      a.addEventListener("error", () => { preloaded.set(i, null); resolve(); }, { once: true });
      setTimeout(() => { if (!preloaded.has(i)) { a.playbackRate = this.textSpeed; preloaded.set(i, a); resolve(); } }, 4000);
      a.load();
    })));

    let idx = 0, cur = null, aborted = false, done = null;
    let noVoiceTimer = null;
    let lastImg = 0;
    let _parallelAudios = [];  // ★ 并发音轨池

    // ★ 给任意音频元素应用 AudioManager 音量
    const _applyVol = (a, type) => {
      if (!a) return;
      const am = AudioManager;
      const master = am._muted ? 0 : (am._volume.master || 0.8);
      const group = am._volume[type] || 1;
      a.volume = Math.max(0, Math.min(1, master * group));
    };

    const clearNoVoiceTimer = () => {
      if (noVoiceTimer) { clearTimeout(noVoiceTimer); noVoiceTimer = null; }
    };

    const stopParallelAudios = () => {
      _parallelAudios.forEach(a => { try { a.pause(); a.currentTime = 0; } catch(_){} });
      _parallelAudios = [];
    };

    const show = (entry, accumulate = false) => {
      // ★ 图片继承规则
      let imgNum = entry.img;
      if (imgNum == null) imgNum = lastImg > 0 ? lastImg : 1;
      if (imgNum > 0) { this._showSceneImage(imgNum); lastImg = imgNum; }
      SyncLog.subtitleShow({ scene: sceneId, idx, text: entry.text, note: `bound-show${accumulate?' parallel':''}` });
      const bar = this._bar();
      if (!bar) return;
      // 并行模式：不清理旧字幕，追加显示
      if (!accumulate) bar.innerHTML = "";
      const el = document.createElement("div");
      el.className = entry.mode === "narration" ? "sb-narration" : "sb-dialogue";
      if (entry.mode !== "narration" && entry.speaker) {
        const tag = document.createElement("span");
        tag.className = "sb-speaker character";
        tag.textContent = entry.speaker;
        el.appendChild(tag);
      }
      el.appendChild(document.createTextNode(entry.text));
      if (entry.hl && entry.hl.length) {
        let h = el.innerHTML;
        for (const kw of entry.hl) {
          const re = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'g');
          h = h.replace(re, '<em class="hl">$1</em>');
        }
        el.innerHTML = h;
      }
      bar.appendChild(el);
    };

    const next = () => {
      if (aborted) { console.log('[BOUND-NEXT] aborted=true, skipping. idx=%d/%d', idx, entries.length); return; }
      clearNoVoiceTimer();
      if (idx >= entries.length) { console.log('[BOUND-DONE] idx=%d len=%d aborted=%s', idx, entries.length, aborted); if (done) done(true); return; }
      const entry = entries[idx];
      const audio = preloaded.get(idx);
      console.log('[NEXT] idx=%d speaker=%s parallel=%s audio=%s novoice=%s', idx, entry.speaker||'?', entry.parallel, !!audio, entry.noVoice);
      idx++;
      show(entry);

      // 无音频条目
      if (!audio || entry.noVoice) {
        cur = null; this._boundAudio = null;
        if (entry.img === null && entry.hold === null) { next(); return; }
        const rawHold = entry.hold || 2000;
        const holdMs = Math.max(200, Math.round(rawHold / this.textSpeed));
        const scheduleNoVoice = () => {
          clearNoVoiceTimer();
          if (aborted) return;
          noVoiceTimer = setTimeout(next, holdMs);
        };
        scheduleNoVoice();
        return;
      }

      // ★ 并行音轨
      if (entry.parallel) {
        _parallelAudios.push(audio);
        audio.currentTime = 0;
        audio.playbackRate = this.textSpeed;
        _applyVol(audio, 'voice');
        console.log('[PARALLEL] START idx=%d speaker=%s', idx-1, entry.speaker||'narration');
        audio.play().catch(() => {});
        const nextEntry = entries[idx];
        if (nextEntry) {
          const delayMs = Math.round((entry.parallelDelay || 1500) / this.textSpeed);
          show(nextEntry, true);
          const nextAudio = preloaded.get(idx);
          if (nextAudio && !nextEntry.noVoice) {
            setTimeout(() => {
              if (aborted) return;
              _parallelAudios.push(nextAudio);
              nextAudio.currentTime = 0;
              nextAudio.playbackRate = this.textSpeed;
              _applyVol(nextAudio, 'voice');
              console.log('[PARALLEL] ALSO idx=%d speaker=%s delay=%dms', idx, nextEntry.speaker||'narration', delayMs);
              nextAudio.play().catch(() => {});
            }, delayMs);
          }
          idx++;
        }
        next();
        return;
      }

      // 正常模式：等音频结束 + hold 兜底（防 AI 截断语音）
      cur = audio; this._boundAudio = audio;
      audio.currentTime = 0;
      audio.playbackRate = this.textSpeed;
      _applyVol(audio, 'voice');
      SyncLog.audioStart({ scene: sceneId, idx, text: entry.text, rate: this.textSpeed });
      const startedAt = Date.now();
      const minHoldMs = entry.hold ? Math.round(entry.hold / this.textSpeed) : 0;
      audio.play().catch(() => { cur = null; this._boundAudio = null; next(); });

      let endedRaf = null;
      let audibleEnded = false;
      const tryAdvance = () => {
        if (aborted) return;
        const elapsed = Date.now() - startedAt;
        if (elapsed < minHoldMs) {
          setTimeout(tryAdvance, minHoldMs - elapsed + 50);
          return;
        }
        if (endedRaf) cancelAnimationFrame(endedRaf);
        endedRaf = null;
        cur = null; this._boundAudio = null;
        next();
      };
      const pollEnded = () => {
        if (aborted) { endedRaf = null; return; }
        if (cur !== audio || audio.ended) {
          if (audio.ended && !audibleEnded) {
            audibleEnded = true;
            SyncLog.audioEnded({ scene: sceneId, idx, atime: audio.currentTime, rate: this.textSpeed });
            tryAdvance();
            return;
          }
          endedRaf = null;
          return;
        }
        endedRaf = requestAnimationFrame(pollEnded);
      };
      pollEnded();

      audio.onerror = () => {
        if (endedRaf) cancelAnimationFrame(endedRaf);
        endedRaf = null;
        cur = null; this._boundAudio = null;
        next();
      };
    };

    return new Promise(resolve => {
      done = resolve;
      // ★ 速度轮询：变速时同步所有音轨 + 重新调度无音频计时器
      const sp = setInterval(() => {
        if (aborted || this.currentSceneId !== sceneId) { clearInterval(sp); return; }
        const rate = this.textSpeed;
        // L1 旁白 + 并行音轨：同步变速 + 音量
        if (cur && !cur.paused) { cur.playbackRate = rate; _applyVol(cur, 'voice'); }
        _parallelAudios.forEach(a => { if (a && !a.paused) { a.playbackRate = rate; _applyVol(a, 'voice'); } });
        // L2/L3：同步 BGM/环境音
        if (this._sceneAudioTracks) {
          this._sceneAudioTracks.forEach(a => {
            if (a && !a.paused) { a.playbackRate = rate; _applyVol(a, a.dataset?.group || 'sfx'); }
          });
        }
      }, 150);
      // 场景切换检测
      const chk = setInterval(() => {
        if (this.currentSceneId !== sceneId) {
          console.log('[BOUND-CHK] scene changed: %s -> %s, aborted=%s, idx=%d/%d', sceneId, this.currentSceneId, aborted, idx, entries.length);
          aborted = true;
          clearNoVoiceTimer();
          stopParallelAudios();
          if (cur) { cur.pause(); cur.currentTime = 0; cur = null; this._boundAudio = null; }
          this._stopSceneAudioTracks();
          clearInterval(chk); clearInterval(sp);
          if (done) done(true);  // ★ 即使中断也返回 true，防止 OLD-LEGACY 重播
        }
      }, 100);
      next();
    });
  },

  // ★ 场景音频层：BGM + 环境音（独立于旁白音轨）
  _sceneAudioTracks: [],
  
  _startSceneAudioLayer(scene) {
    this._stopSceneAudioTracks();
    const sounds = scene.assets?.sounds || [];
    const sceneId = scene.id;

    // ★ 自动映射场景 → 实际音效文件
    const isRain = scene.rain;
    const isPrologue = sceneId.startsWith('prologue_');
    const hasCpr = scene.reviewTags?.some(t => ['CPR', '第四阶段', '第五阶段', '第三阶段'].includes(t));
    const hasCrowd = scene.reviewTags?.some(t => ['第三阶段', '围观'].includes(t)) || sceneId.includes('crowd') || sceneId.includes('scam');
    const hasAed = scene.reviewTags?.some(t => ['AED', '第六阶段'].includes(t)) || sceneId.includes('aed_');

    // L2 BGM（优先用文件，否则用 Web Audio）
    const bgmSound = sounds.find(s => s.type === "bgm");
    if (bgmSound?.url) {
      this._loadAndPlayAudio(bgmSound.url, { loop: true, type: "bgm", volume: bgmSound.volume || 0.6 });
    } else if (hasCpr || sceneId.includes('tension') || sceneId.includes('family')) {
      AudioManager.startTensionMusic(0.3, 0.2);
    }

    // L3 环境音（用实际音频文件）
    const ambientSound = sounds.find(s => s.type === "ambient");
    if (ambientSound?.url) {
      this._loadAndPlayAudio(ambientSound.url, { loop: true, type: "ambient", volume: ambientSound.volume || 0.5 });
    }
    // 雨景 → 雨声
    if (isRain) {
      this._loadAndPlayAudio('assets/audio/ambient/rain_loop_01', { loop: true, type: "ambient", volume: 0.2 });
    }
    // 人群嘈杂
    if (hasCrowd) {
      this._loadAndPlayAudio('assets/audio/ambient/crowd_murmur_01', { loop: true, type: "ambient", volume: 0.05 });
    }

    // L3 SFX（用实际音频文件）
    sounds.filter(s => s.type === "sfx").forEach(sfx => {
      if (sfx.url) {
        this._loadAndPlayAudio(sfx.url, { loop: false, type: "sfx", volume: sfx.volume || 0.8 });
      }
    });
    // 开场电动车急刹
    if (sceneId.includes('choice_1') || sceneId.includes('prologue_phone')) {
      this._loadAndPlayAudio('assets/audio/sfx/scooter_brake_01', { loop: false, type: "sfx", volume: 0.6 });
    }
    // AED场景 → AED音效
    if (hasAed) {
      this._loadAndPlayAudio('assets/audio/sfx/aed_power_on_01', { loop: false, type: "sfx", volume: 0.7 });
    }
    // 救护车到达 → 警笛
    if (sceneId.includes('heartbeat') || sceneId.includes('bad_ending')) {
      this._loadAndPlayAudio('assets/audio/sfx/ambulance_siren_01', { loop: false, type: "sfx", volume: 0.5 });
    }
  },

  async _loadAndPlayAudio(basePath, { loop = false, type = "sfx", volume = 1.0 } = {}) {
    // 复用AudioManager的文件解析
    const src = await AudioManager._resolveSource(basePath);
    if (!src) return null;
    const a = new Audio(src);
    a.loop = loop;
    a.preload = "auto";
    a.volume = Math.max(0, Math.min(1, (AudioManager._volume.master || 0.8) * (AudioManager._volume[type] || 1) * volume));
    a.playbackRate = this.textSpeed;
    a.play().catch(() => {});
    // 播放完毕后从列表移除
    if (!loop) {
      a.addEventListener("ended", () => {
        this._sceneAudioTracks = this._sceneAudioTracks.filter(t => t !== a);
      }, { once: true });
    }
    this._sceneAudioTracks.push(a);
    return a;
  },

  _stopSceneAudioTracks() {
    if (!this._sceneAudioTracks) { this._sceneAudioTracks = []; return; }
    this._sceneAudioTracks.forEach(a => {
      try { a.pause(); a.currentTime = 0; a.removeAttribute("src"); a.load(); } catch (_) {}
    });
    this._sceneAudioTracks = [];
    // ★ 同时停止 Web Audio 合成的场景音（雨声/紧张音乐等）
    AudioManager.stopBackgroundAmbience();
    AudioManager.stopTensionMusic();
    AudioManager.stopCrowdNoise();
  },

  // ==================== 时间戳模式：整场景渲染 ====================
  /**
   * 时间戳模式渲染流程：
   * 1. 确定主音频（narrationVoice / dialogueVoice）
   * 2. 构建 entries 数组（lines + nextLines 中有时间戳的行）
   * 3. 播放音频，按 audio.currentTime 同步显示字幕+图片
   * 4. 处理无时间戳的剩余 nextLines（逐行 voice 等）
   */
  async _renderTimedScene(scene) {
    SyncLog.modeEnter('TIMED-SEQUENCE', scene.id);  // ★ 诊断日志
    // 确定主音频
    const mainVoice = scene.narrationVoice || scene.dialogueVoice;
    if (!mainVoice) {
      // 无音频但有时间戳 → 按时间戳纯计时播放
      await this._playTimedNoAudio(scene);
      return;
    }

    // 播放主音频
    const audio = await AudioManager.playNarration(mainVoice);
    if (!audio) {
      // 音频加载失败 → 回退到无音频时间戳模式
      await this._playTimedNoAudio(scene);
      return;
    }

    // 构建 lines 的 entries
    const entries = [];
    scene.lines.forEach(line => {
      if (line.start !== undefined) {
        entries.push({
          line,
          start: line.start,
          end: line.end,
          type: scene.mode === "dialogue" ? "dialogue" : "narration",
          speaker: scene.speaker || line.speaker,
          style: line.style
        });
      }
    });

    // 处理 nextLines
    const remainingNextLines = [];
    if (scene.nextLines) {
      // 判断 nextLines 是否共享同一音频
      const sharedVoice = scene.nextVoice && scene.nextVoice === mainVoice;

      if (sharedVoice) {
        // 共享音频：nextLines 中有时间戳的行加入同一序列
        scene.nextLines.forEach(nl => {
          if (nl.start !== undefined) {
            entries.push({
              line: nl,
              start: nl.start,
              end: nl.end,
              type: nl.mode || "narration",
              speaker: nl.speaker,
              style: nl.style
            });
          } else {
            remainingNextLines.push(nl);
          }
        });
      } else if (scene.nextVoice && this._hasTimestamps(scene.nextLines)) {
        // nextLines 有独立音频和时间戳 → 先播 mainVoice 的 lines，再播 nextVoice 的 nextLines
        await this._playTimedSequence(audio, entries);
        if (this.currentSceneId !== scene.id) return;

        const nextAudio = await AudioManager.playNarration(scene.nextVoice);
        if (nextAudio) {
          const nextEntries = [];
          scene.nextLines.forEach(nl => {
            if (nl.start !== undefined) {
              nextEntries.push({
                line: nl,
                start: nl.start,
                end: nl.end,
                type: nl.mode || "narration",
                speaker: nl.speaker,
                style: nl.style
              });
            } else {
              remainingNextLines.push(nl);
            }
          });
          await this._playTimedSequence(nextAudio, nextEntries);
        }
      } else {
        // nextLines 无时间戳 → 全部走旧逻辑
        remainingNextLines.push(...scene.nextLines);
      }
    }

    // 如果还没播放过（非shared非nextVoice分支），现在播放主音频序列
    if (!scene.nextVoice || scene.nextVoice === mainVoice) {
      await this._playTimedSequence(audio, entries);
    }

    if (this.currentSceneId !== scene.id) return;

    // 处理剩余的无时间戳 nextLines（逐行 voice 模式）
    if (remainingNextLines.length > 0) {
      await this._renderRemainingNextLines(scene, remainingNextLines);
    }
  },

  /**
   * 无音频时间戳模式：用 setTimeout 模拟时间轴
   */
  async _playTimedNoAudio(scene) {
    const allLines = [...(scene.lines || []), ...(scene.nextLines || []).filter(nl => nl.start !== undefined)];
    const sorted = allLines.filter(l => l.start !== undefined).sort((a, b) => a.start - b.start);

    for (const line of sorted) {
      if (this.currentSceneId !== scene.id) return;
      if (line.img) this._showSceneImage(line.img);
      const type = line.mode || scene.mode || "narration";
      this._displaySubtitle(line, type, line.speaker || scene.speaker, line.style);
      // 等到下一条的start，或end
      const nextLine = sorted[sorted.indexOf(line) + 1];
      const waitUntil = line.end || (nextLine ? nextLine.start : line.start + 3);
      await this._delay(Math.max(200, (waitUntil - line.start) * 1000 / this.textSpeed));
    }
  },

  /**
   * 渲染剩余的无时间戳 nextLines（保留旧逻辑的逐行voice/voiceSpan处理）
   */
  async _renderRemainingNextLines(scene, nextLines) {
    for (let i = 0; i < nextLines.length; i++) {
      if (this.currentSceneId !== scene.id) return;
      const nl = nextLines[i];

      if (nl.mode === "narration") {
        await this._sceneDelay(nl.delay || 400);
        let hold;
        if (nl.voice) {
          const nlAudio = await AudioManager.playNarration(nl.voice);
          if (nlAudio && nlAudio.duration > 0) {
            const span = nl.voiceSpan || 1;
            const interLineDelay = (nl.delay || 400) / this.textSpeed;
            const compensatedMs = Math.max(0, nlAudio.duration * 1000 / this.textSpeed - (span - 1) * interLineDelay);
            hold = Math.round(compensatedMs / span);
          }
        }
        if (nl.img) this._showSceneImage(nl.img);
        await this._barLine(nl, "narration", null, null, hold);
      } else if (nl.mode === "dialogue") {
        await this._sceneDelay(nl.delay || 500);
        let hold;
        if (nl.voice) {
          const nlAudio = await AudioManager.playNarration(nl.voice);
          if (nlAudio && nlAudio.duration > 0) {
            const span = nl.voiceSpan || 1;
            const interLineDelay = (nl.delay || 500) / this.textSpeed;
            const compensatedMs = Math.max(0, nlAudio.duration * 1000 / this.textSpeed - (span - 1) * interLineDelay);
            hold = Math.round(compensatedMs / span);
          }
        }
        if (nl.img) this._showSceneImage(nl.img);
        await this._barLine(nl, "dialogue", nl.speaker, nl.style, hold);
      }
    }
  },

  /**
   * 场景结束后的推进逻辑（时间戳模式专用，复用旧逻辑的尾部）
   */
  async _proceedToNext(scene) {
    // 交互模块
    if (scene.interaction === "cpr" && scene.onEnter?.cprMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) return;
      await this._runCPRModule(scene);
      if (this.currentSceneId !== scene.id) return;
    } else if (scene.interaction === "aed" && scene.onEnter?.aedMode) {
      console.log('[AED-PROCEED] waiting 1500ms...');
      await this._delay(1500);
      if (this.currentSceneId !== scene.id) return;
      console.log('[AED-PROCEED] starting');
      await this._runAEDModule(scene);
      if (this.currentSceneId !== scene.id) return;
    } else if (scene.interaction === "assign" && scene.onEnter?.assignMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) return;
      await this._runAssignModule(scene);
      if (this.currentSceneId !== scene.id) return;
    } else if (scene.interaction === "takeover" && scene.onEnter?.takeoverMode) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) return;
      await this._runTakeoverModule(scene);
      if (this.currentSceneId !== scene.id) return;
    }

    // 选择
    if (scene.choices) {
      await this._delay(600);
      if (this.currentSceneId !== scene.id) return;
      this._showChoices(scene);
      return;
    }

    // 自动推进
    if (!scene.choices && scene.mode !== "review") {
      const nextId = this._resolveNext(scene);
      if (nextId) {
        if (scene.playOpeningVideo) {
          this._clearBar();
          await this._delay(600);
          if (this.currentSceneId !== scene.id) return;
          await this._playOpeningVideo();
          if (this.currentSceneId !== scene.id) return;
        }
        const remainingMediaMs = this._getRemainingSceneMediaMs(scene.id);
        if (remainingMediaMs > 0) await this._delay(remainingMediaMs);
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

  // ==================== 时间戳同步播放（专业字幕-音频绑定） ====================
  /**
   * 检测场景是否使用时间戳模式
   * 时间戳模式：每条字幕有 start（秒），直接和 audio.currentTime 同步
   */
  _hasTimestamps(lines) {
    return lines && lines.some(l => l.start !== undefined);
  },

  /**
   * 直接显示一条字幕（不经过hold计时，由时间戳驱动）
   */
  _displaySubtitle(line, type, speaker, style) {
    const bar = this._bar();
    if (!bar) return;
    bar.innerHTML = "";

    const isNarration = type === "narration";
    const el = document.createElement("div");
    el.className = isNarration ? "sb-narration" : "sb-dialogue";

    if (!isNarration && speaker) {
      const tag = document.createElement("span");
      tag.className = "sb-speaker" + (style ? ` ${style}` : " character");
      tag.textContent = speaker;
      el.appendChild(tag);
    }

    el.appendChild(document.createTextNode(line.text));
    bar.appendChild(el);

    // 注释小字
    if (line.note) {
      const noteEl = document.createElement("div");
      noteEl.className = "sb-note";
      noteEl.textContent = line.note;
      bar.appendChild(noteEl);
    }
  },

  /**
   * 基于时间戳的字幕-音频同步播放（虚拟时间轴）
   * ★ 不再用 audio.currentTime 做对比（它不受 playbackRate 影响）。
   * ★ 改用独立虚拟时钟：每帧累加 deltaTime * playbackRate，与音频实际播放完全一致。
   * @param {HTMLAudioElement} audio - 已开始播放的音频
   * @param {Array} entries - [{ line, start, end, type, speaker, style }]
   *   start/end 为秒，相对于音频原始时间轴
   * @returns {Promise} 所有字幕播完或音频结束时resolve
   */
  _playTimedSequence(audio, entries) {
    return new Promise(resolve => {
      if (!audio || !entries || entries.length === 0) { resolve(); return; }

      audio.playbackRate = this.textSpeed;

      let currentIdx = 0;
      let rafId = null;
      let spCheck = null;
      let resolved = false;
      let lastTimestamp = 0;
      let virtualTime = 0;  // ★ 虚拟时钟（秒），与音频播放速度完全同步
      const sceneId = this.currentSceneId;

      const cleanup = () => {
        if (rafId) cancelAnimationFrame(rafId);
        if (spCheck) clearInterval(spCheck);
        rafId = null;
        spCheck = null;
      };

      const finish = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve();
      };

      const tick = (timestamp) => {
        if (resolved) return;
        if (this.currentSceneId !== sceneId) { finish(); return; }

        // ★ 推进虚拟时钟：deltaTime * 当前 playbackRate
        if (lastTimestamp > 0) {
          const dt = (timestamp - lastTimestamp) / 1000;  // 秒
          virtualTime += dt * audio.playbackRate;
        }
        lastTimestamp = timestamp;

        // ★ 诊断：每 500ms 打印一次虚拟时钟 vs 实际音频时钟
        if (SyncLog._enabled) {
          const tInt = Math.floor(virtualTime * 2);  // 每0.5秒一次
          if (!tick._lastLogInt || tInt !== tick._lastLogInt) {
            tick._lastLogInt = tInt;
            SyncLog.vclockTick({ scene: sceneId, vtime: virtualTime, atime: audio.currentTime, rate: audio.playbackRate, note: 'raf-tick' });
          }
        }

        // 按虚拟时间轴显示字幕
        while (currentIdx < entries.length && virtualTime >= entries[currentIdx].start) {
          const entry = entries[currentIdx];
          SyncLog.subtitleShow({ scene: sceneId, idx: currentIdx, vtime: virtualTime, text: entry.line.text, note: `timed-trigger start=${entry.line.start}s` });  // ★
          if (entry.line.img) this._showSceneImage(entry.line.img);
          this._displaySubtitle(entry.line, entry.type, entry.speaker, entry.style);
          currentIdx++;
        }

        // 全部字幕已显示
        if (currentIdx >= entries.length) {
          const lastEntry = entries[entries.length - 1];
          const endSec = lastEntry.end || (audio.duration || virtualTime + 2);
          if (virtualTime >= endSec || audio.ended) {
            finish();
            return;
          }
        }

        rafId = requestAnimationFrame(tick);
      };

      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });

      // ★ 速度轮询：变速时同步 playbackRate（虚拟时钟自然跟随）
      spCheck = setInterval(() => {
        if (resolved || this.currentSceneId !== sceneId) {
          clearInterval(spCheck); spCheck = null; return;
        }
        if (audio && !audio.paused) {
          audio.playbackRate = this.textSpeed;
        }
      }, 150);

      rafId = requestAnimationFrame(tick);

      // 安全阀（按最大时长保守估计）
      const safetyMs = ((audio.duration || 120) / Math.max(0.5, this.textSpeed) + 5) * 1000;
      setTimeout(finish, safetyMs);
    });
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

      // hold计算：
      // - customHold（来自_calcCharBasedHolds或voiceSpan）已含速度倍率，不再除
      // - line.hold或默认值需要除以textSpeed
      let hold;
      if (customHold) {
        hold = Math.max(200, Math.round(customHold));
      } else {
        const baseHold = line.hold || (isNarration ? 2800 : 2200);
        hold = Math.max(200, Math.round(baseHold / this.textSpeed));
      }
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
      }, Math.max(200, Math.round(2800 / this.textSpeed)));
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

    await this._delay(Math.round(2000 / this.textSpeed));
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
    const candidates = this._buildAssetCandidates(slot.url, [".png", ".jpg", ".jpeg", ".webp"]);
    if (!candidates.length) {
      entry.failed = true;
      onResolve(false);
      return;
    }

    // ★ 检测本场景是否有"先播视频"的video slot
    const scene = (this.currentSceneId && typeof SCENES !== "undefined") ? SCENES[this.currentSceneId] : null;
    const hasPlayFirstVideo = scene?.assets?.videos?.some(v => v.playFirst === true);
    entry.shouldShow = !hasPlayFirstVideo;

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
    vid.playsInline = true;
    const playFirst = slot.playFirst === true;
    vid.loop = !playFirst;
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

      if (playFirst) {
        // 视频播完后再让图片接管
        vid.onended = () => {
          vid.classList.add("fading");
          vid.classList.remove("active");
          // 解锁所有 image entry
          if (this._sceneImageEntries) {
            this._sceneImageEntries.forEach(entry => {
              entry.shouldShow = true;
              if (entry.loaded && entry.element && !entry.hasShown) {
                entry.element.classList.add("active");
                entry.hasShown = true;
              }
            });
          }
          // 视频淡出后从 DOM 移除
          setTimeout(() => {
            if (vid.parentNode) vid.parentNode.removeChild(vid);
            vid.removeAttribute("src");
            vid.load();
          }, 1000);
        };
      }
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

    if (mediaLayer) {
      if (this._cinematicReady) {
        this._cinematicReady = false;  // 仅本次跳过
      } else {
        mediaLayer.innerHTML = "";
      }
    }

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
      // Subtitle-bound image switching: store entries, skip fixed-interval timeline
      this._sceneImageEntries = imageEntries;
      this._sceneImageCurrent = 0;
      this.sceneMediaState = { sceneId, startedAt: this._now(), timelineEndMs: 0 };

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
    this._showFloatPanel(false);
  },

  _hidePauseMenu() {
    this._hideFloatPanel();
  },

  _togglePause() {
    if (this.paused) this._hideFloatPanel();
    else this._showFloatPanel(false);
  },

  // ==================== 全局输入绑定 ====================
  _bindGlobalInputs() {
    document.addEventListener("keydown", (e) => {
      // 浮动面板打开时
      if (this.paused) {
        if (e.code === "Escape") {
          e.preventDefault();
          this._hideFloatPanel();
        }
        return;
      }

      // 全局快捷键
      if (e.code === "Escape") {
        e.preventDefault();
        this._showFloatPanel(false);
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

    // 浮动面板：点击外部关闭（面板背景层）
    document.getElementById("pauseMenu")?.addEventListener("click", (e) => {
      // 仅当点击的是面板背景层本身（非内部内容）时关闭
      if (e.target === e.currentTarget) {
        this._hideFloatPanel();
      }
    });

    // 浮动面板关闭按钮
    document.getElementById("pauseResume")?.addEventListener("click", () => this._hideFloatPanel());
  },

  // ==================== 重新开始 ====================
  restartGame() {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this._clearSceneTimers();
    this._stopSceneAudioTracks(); // ★ 清理场景音轨
    this._hideAllModules();
    this._hideChoices();
    this._clearBar();
    this._clearIntertitle();
    document.getElementById("reviewLayer").classList.remove("active");
    document.getElementById("reviewLayer").innerHTML = "";
    document.getElementById("pauseMenu").classList.remove("active");
    this.paused = false;
    this._floatPanelFromStart = false;
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

    const effectiveMs = totalAudioMs / this.textSpeed;
    const effectiveInterDelay = interDelayMs / this.textSpeed;

    // 如果所有行都有显式hold，按速度倍率缩放后使用
    const allHaveHold = lines.every(l => typeof l.hold === 'number' && l.hold > 0);
    if (allHaveHold) {
      return lines.map(l => Math.round(l.hold / this.textSpeed));
    }

    // 标记哪些行有显式hold，按速度倍率缩放
    const speedScale = this.textSpeed || 1.0;
    const hasHold = lines.map(l => typeof l.hold === 'number' && l.hold > 0);
    const scaledHolds = lines.map((l, i) => hasHold[i] ? Math.round(l.hold / speedScale) : 0);
    const explicitTotal = scaledHolds.reduce((s, h) => s + h, 0);
    const remainingMs = Math.max(0, effectiveMs - effectiveInterDelay - explicitTotal);

    // 只用没有hold的行计算字数比例
    const freeLines = lines.map((l, i) => hasHold[i] ? null : l);
    const freeChars = freeLines.reduce((s, l) => s + (l && l.text ? l.text.length : 0), 0);
    const freeCount = freeLines.filter(l => l !== null).length;

    if (freeCount === 0) {
      return scaledHolds;
    }
    if (freeChars === 0) {
      const avg = Math.round(remainingMs / freeCount);
      return lines.map((l, i) => hasHold[i] ? l.hold : avg);
    }

    const MIN_HOLD = 1800;
    const MAX_HOLD = 4500;

    // 按字数分配剩余时间，clamp到合理范围
    let raw = lines.map((l, i) => {
      if (hasHold[i]) return scaledHolds[i];
      const chars = l.text ? l.text.length : 0;
      return Math.max(MIN_HOLD, Math.min(MAX_HOLD, Math.round((chars / freeChars) * remainingMs)));
    });

    // 归一化非显式行使其总和匹配剩余时间
    const rawFreeTotal = raw.reduce((s, h, i) => s + (hasHold[i] ? 0 : h), 0);
    if (rawFreeTotal > 0) {
      raw = raw.map((h, i) => {
        if (hasHold[i]) return h;
        return Math.round((h / rawFreeTotal) * remainingMs);
      });
    }

    return raw;
  },

  // ==================== 电影转场：图片渐隐 + 下场景图片从下往上滑入 ====================
  async _cinematicTransition(fromScene, toScene) {
    console.log('[CINEMATIC] start from=%s to=%s', fromScene, toScene);
    const stage = document.getElementById("stage");
    const mediaLayer = document.getElementById("mediaLayer");
    if (!stage || !mediaLayer) {
      console.log('[CINEMATIC] ABORT: stage=%s mediaLayer=%s', !!stage, !!mediaLayer);
      return;
    }
    console.log('[CINEMATIC] preloading images...');

    // 预加载
    const preload = (src) => new Promise(resolve => {
      const img = new Image();
      img.onload = img.onerror = resolve;
      img.src = src;
    });
    await Promise.all([
      preload(`assets/images/${fromScene}/img_04.png`),
      preload(`assets/images/${toScene}/img_01.png`)
    ]);
    console.log('[CINEMATIC] images loaded, starting animation');

    // 旧图：全屏显示（在黑屏遮罩之上）
    const fromImg = document.createElement("img");
    fromImg.src = `assets/images/${fromScene}/img_04.png`;
    fromImg.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:9990;pointer-events:none;";
    document.body.appendChild(fromImg);

    // 新图：从屏幕下方 100% 处开始（完全不可见）
    const toImg = document.createElement("img");
    toImg.src = `assets/images/${toScene}/img_01.png`;
    toImg.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:9991;pointer-events:none;transform:translateY(100%);transition:transform 4s cubic-bezier(0.22,1,0.36,1);";
    document.body.appendChild(toImg);

    await this._delay(100);

    // 动画：旧图淡出，新图从下往上滑动覆盖
    fromImg.style.transition = "opacity 2.5s ease-out";
    fromImg.style.opacity = "0";
    toImg.style.transform = "translateY(0)";

    await this._delay(4200);
    console.log('[CINEMATIC] animation complete, moving images');

    // 新图滑入到位后，从 body 移到 mediaLayer 驻留
    toImg.style.position = "absolute";
    toImg.style.width = "100%";
    toImg.style.height = "100%";
    toImg.style.zIndex = "";
    toImg.classList.add("bg-main", "active");
    mediaLayer.appendChild(toImg);
    
    // 清理旧图
    fromImg.remove();
    
    this._cinematicReady = true;
  },

  // ==================== 工具 ====================
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // 场景内行间延迟：受速度倍率影响
  _sceneDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, Math.max(50, Math.round(ms / this.textSpeed))));
  },

  // ==================== 速度倍率 ====================
  setTextSpeed(speed) {
    this.textSpeed = Math.max(0.5, Math.min(2.0, speed));
    SyncLog.speedChange(this.textSpeed);  // ★ 诊断日志
    if (AudioManager._narrationAudio) {
      AudioManager._narrationAudio.playbackRate = this.textSpeed;
    }
    AudioManager._concurrentAudios.forEach(audio => {
      audio.playbackRate = this.textSpeed;
    });
    // ★ 立即同步绑定模式的当前旁白音频
    if (this._boundAudio && !this._boundAudio.paused) {
      this._boundAudio.playbackRate = this.textSpeed;
    }
    // ★ 同步场景级BGM/环境音轨
    if (this._sceneAudioTracks) {
      this._sceneAudioTracks.forEach(a => {
        if (a && !a.paused) a.playbackRate = this.textSpeed;
      });
    }
    const stage = document.getElementById("stage");
    if (stage) {
      stage.style.setProperty("--img-fade", `${(0.8 / this.textSpeed).toFixed(2)}s`);
    }
  },

  // ==================== 浮动设置面板 ====================
  _showFloatPanel(fromStart = false) {
    this.paused = true;
    this._floatPanelFromStart = fromStart;
    const panel = document.getElementById("pauseMenu");
    if (panel) panel.classList.add("active");
    // 从开始画面打开时隐藏"返回主页"按钮
    const restartBtn = document.getElementById("pauseRestart");
    if (restartBtn) restartBtn.style.display = fromStart ? "none" : "";
    // 同步当前设置值到UI
    this._syncFloatPanelUI();
  },

  _hideFloatPanel() {
    this.paused = false;
    const panel = document.getElementById("pauseMenu");
    if (panel) panel.classList.remove("active");
  },

  _syncFloatPanelUI() {
    const volMap = {
      master:  { input: "fpMasterVol",  val: "fpMasterVal"  },
      bgm:     { input: "fpBgmVol",     val: "fpBgmVal"     },
      ambient: { input: "fpAmbientVol", val: "fpAmbientVal" },
      sfx:     { input: "fpSfxVol",     val: "fpSfxVal"     },
      voice:   { input: "fpVoiceVol",   val: "fpVoiceVal"   },
    };
    Object.entries(volMap).forEach(([type, { input, val }]) => {
      const el = document.getElementById(input);
      const valEl = document.getElementById(val);
      const v = Math.round((AudioManager._volume[type] || 0) * 100);
      if (el) el.value = v;
      if (valEl) valEl.textContent = `${v}%`;
    });
    // 速度
    const speedEl = document.getElementById("fpSpeed");
    const speedVal = document.getElementById("fpSpeedVal");
    if (speedEl) speedEl.value = Math.round(this.textSpeed * 100);
    if (speedVal) speedVal.textContent = `${this.textSpeed.toFixed(1)}x`;
    // HUD
    const hudBtn = document.getElementById("fpHudToggle");
    if (hudBtn) hudBtn.textContent = this.hudVisible ? "显示中" : "已隐藏";
  },

  // ==================== 设置持久化 ====================
  _saveSetting(key, value) {
    try {
      localStorage.setItem(`aed_setting_${key}`, JSON.stringify(value));
    } catch (e) {}
  },

  _loadSettings() {
    try {
      // 音量
      const volTypes = ["master", "bgm", "ambient", "sfx", "voice"];
      volTypes.forEach(type => {
        const saved = localStorage.getItem(`aed_setting_vol_${type}`);
        if (saved !== null) {
          const val = JSON.parse(saved);
          AudioManager.setVolume(type, val);
        }
      });
      // 速度
      const savedSpeed = localStorage.getItem("aed_setting_textSpeed");
      if (savedSpeed !== null) {
        this.setTextSpeed(JSON.parse(savedSpeed));
      }
      // ★ 同步速度滑块UI，防止显示值与实际速度不一致
      const speedEl = document.getElementById("fpSpeed");
      const speedVal = document.getElementById("fpSpeedVal");
      if (speedEl) speedEl.value = Math.round(this.textSpeed * 100);
      if (speedVal) speedVal.textContent = `${this.textSpeed.toFixed(1)}x`;
      // HUD
      const savedHud = localStorage.getItem("aed_setting_hudVisible");
      if (savedHud !== null) {
        this.hudVisible = JSON.parse(savedHud);
        const hud = document.getElementById("hud");
        if (hud) hud.className = this.hudVisible ? "" : "hidden";
      }
    } catch (e) {}
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
