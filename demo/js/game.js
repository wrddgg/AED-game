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

  // ==================== 初始化 ====================
  init() {
    GameState.init();
    AudioManager.init();
    Interactions.cleanup();

    this.currentSceneId = null;
    this.isTyping = false;
    this.hudVisible = false;
    this.paused = false;

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
    setTimeout(() => this.goToScene("prologue_factory"), 600);
  },

  // ==================== 场景导航 ====================
  goToScene(sceneId) {
    const scene = SCENES[sceneId];
    if (!scene) {
      console.warn("[Game] 场景不存在:", sceneId);
      return;
    }

    this.currentSceneId = sceneId;
    this.isTyping = false;
    if (this.typingTimer) clearTimeout(this.typingTimer);

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

  // ==================== 工具：去标点（narration用） ====================
  _stripPunctuation(text) {
    return text.replace(/[，。！？；：""''（）【】《》、…—\-—\s]/g, "").trim();
  },

  // ==================== 工具：底部字幕带引用 ====================
  _bar() { return document.getElementById("subtitleBar"); },

  async _renderScene(scene) {
    this.isTyping = true;
    this._clearBar();

    // ===== 渲染主行 =====
    if (scene.lines && scene.lines.length > 0) {
      if (scene.mode === "narration") {
        for (const line of scene.lines) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          await this._barLine(line, "narration");
        }
      } else if (scene.mode === "dialogue") {
        for (let i = 0; i < scene.lines.length; i++) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          const line = scene.lines[i];
          const speaker = (i === 0 && scene.speaker) ? scene.speaker : line.speaker;
          const style = line.style || null;
          await this._barLine(line, "dialogue", speaker, style);
        }
      } else if (scene.mode === "choice") {
        for (const line of scene.lines) {
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          await this._barLine(line, "narration");
        }
      }
      // review模式不需要字幕
    }

    // ===== 渲染后续行 =====
    if (scene.nextLines) {
      for (let i = 0; i < scene.nextLines.length; i++) {
        if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }

        const nl = scene.nextLines[i];

        // 检查是否与下一行标记为重叠对话（多人同时说话）
        const nextNl = scene.nextLines[i + 1];
        if (nl.overlap && nextNl && nextNl.mode === "dialogue") {
          // 多人物重叠：同时渲染两行
          await this._barMultiSpeaker(nl, nextNl);
          i++; // 跳过后一行
          continue;
        }

        if (nl.mode === "narration") {
          await this._delay(nl.delay || 400);
          await this._barLine(nl, "narration");
        } else if (nl.mode === "dialogue") {
          await this._delay(nl.delay || 500);
          await this._barLine(nl, "dialogue", nl.speaker, nl.style);
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
      Interactions.showReview();
    }

    this.isTyping = false;
    this._updateHUD();

    // ===== 自动推进到下一场景（非选择/非复盘时） =====
    if (!scene.choices && scene.mode !== "review") {
      const nextId = this._resolveNext(scene);
      if (nextId) {
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
  _barLine(line, type, speaker, style) {
    // 先结束上一行的等待
    resolve();

    return new Promise(resolve => {
      this._lineResolve = resolve;

      const bar = this._bar();
      if (!bar) { resolve(); return; }

      const isNarration = type === "narration";
      const text = isNarration ? this._stripPunctuation(line.text) : line.text;
      if (!text) { resolve(); return; }

      // 清空旧内容再显示新行
      bar.innerHTML = "";

      const hlWords = line.hl || [];
      const el = document.createElement("div");
      el.className = isNarration ? "sb-narration" : "sb-dialogue";

      if (!isNarration && speaker) {
        const tag = document.createElement("span");
        tag.className = "sb-speaker" + (style ? ` ${style}` : " character");
        tag.textContent = speaker;
        el.appendChild(tag);
      }

      if (isNarration) {
        el.textContent = text;
        bar.appendChild(el);
        this.typingTimer = setTimeout(resolve, line.hold || 2000);
      } else {
        const spans = [];
        for (let i = 0; i < text.length; i++) {
          const span = document.createElement("span");
          span.className = "char";
          span.textContent = text[i];
          el.appendChild(span);
          spans.push({ el: span, index: i });
        }
        bar.appendChild(el);

        const hlRanges = [];
        hlWords.forEach(w => {
          let idx = text.indexOf(w);
          while (idx !== -1) { hlRanges.push({ start: idx, end: idx + w.length }); idx = text.indexOf(w, idx + 1); }
        });
        const isHl = (idx) => hlRanges.some(r => idx >= r.start && idx < r.end);

        let charIdx = 0;
        const speed = line.speed || 38;
        const revealNext = () => {
          if (charIdx >= spans.length) { this.typingTimer = setTimeout(resolve, 600); return; }
          const s = spans[charIdx];
          if (isHl(s.index)) s.el.classList.add("hl");
          s.el.classList.add("revealed");
          charIdx++;
          this.typingTimer = setTimeout(revealNext, speed);
        };
        revealNext();
      }
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
    resolve();
    return new Promise(resolve => {
      this._lineResolve = resolve;
      const bar = this._bar();
      if (!bar || !text) { resolve(); return; }
      const el = document.createElement("div");
      el.className = "sb-note";
      const spans = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = text[i];
        el.appendChild(span);
        spans.push(span);
      }
      bar.appendChild(el);
      let idx = 0;
      const reveal = () => {
        if (idx >= spans.length) { this.typingTimer = setTimeout(resolve, 200); return; }
        spans[idx].classList.add("revealed");
        idx++;
        this.typingTimer = setTimeout(reveal, 30);
      };
      reveal();
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

  _loadImageSlot(slot, mediaLayer, stage, onResolve) {
    const candidates = this._buildAssetCandidates(slot.url, [".webp", ".png", ".jpg", ".jpeg"]);
    if (!candidates.length) {
      onResolve(false);
      return;
    }

    const img = document.createElement("img");
    img.className = `scene-img ${slot.cssClass || ""}`;
    img.alt = "";
    let index = 0;

    const tryNext = () => {
      if (index >= candidates.length) {
        img.remove();
        onResolve(false);
        return;
      }
      img.src = candidates[index++];
    };

    img.onload = () => {
      img.classList.add("active");
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

    if (mediaLayer) mediaLayer.innerHTML = "";

    const assets = scene.assets || {};
    const images = (assets.images || []).filter(img => img.url && img.url.trim() !== "");
    const videos = (assets.videos || []).filter(vid => vid.url && vid.url.trim() !== "");
    const totalSlots = images.length + videos.length;

    if (!totalSlots) {
      this._applyStageFallback(stage, fallback);
    } else {
      let resolvedSlots = 0;
      let loadedAny = false;
      let fallbackApplied = false;

      const handleResolved = (success) => {
        resolvedSlots += 1;
        loadedAny = loadedAny || success;
        if (resolvedSlots >= totalSlots && !loadedAny && !fallbackApplied) {
          fallbackApplied = true;
          this._applyStageFallback(stage, fallback);
        }
      };

      videos.forEach(slot => this._loadVideoSlot(slot, mediaLayer, stage, handleResolved));
      images.forEach(slot => this._loadImageSlot(slot, mediaLayer, stage, handleResolved));

      setTimeout(() => {
        if (!loadedAny && !fallbackApplied) {
          fallbackApplied = true;
          this._applyStageFallback(stage, fallback);
        }
      }, 5000);
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
      if (e.target.closest("#choiceLayer")) return;
      if (e.target.closest("#pauseMenu")) return;
      if (e.target.closest("#debugPanel")) return;
    });

    // 开始画面点击
    document.getElementById("startScreen")?.addEventListener("click", () => {
      this._startGame();
    });

    // 暂停菜单按钮
    document.getElementById("pauseResume")?.addEventListener("click", () => this._hidePauseMenu());
    document.getElementById("pauseRestart")?.addEventListener("click", () => {
      this._hidePauseMenu();
      this.restartGame();
    });
    document.getElementById("pauseToggleHUD")?.addEventListener("click", () => {
      this.toggleHUD();
      this._hidePauseMenu();
    });
    document.getElementById("pauseReview")?.addEventListener("click", () => {
      this._hidePauseMenu();
      this._hideAllModules();
      Interactions.showReview();
    });
  },

  // ==================== 重新开始 ====================
  restartGame() {
    if (this.typingTimer) clearTimeout(this.typingTimer);
    this._hideAllModules();
    this._hideChoices();
    this._clearBar();
    this._clearIntertitle();
    document.getElementById("reviewLayer").classList.remove("active");
    document.getElementById("reviewLayer").innerHTML = "";
    document.getElementById("pauseMenu").classList.remove("active");
    this.paused = false;
    this.currentSceneId = null;
    Interactions.cleanup();
    GameState.init();
    this._updateHUD();
    this._showStartScreen();
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
