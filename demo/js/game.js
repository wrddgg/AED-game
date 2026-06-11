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
    document.getElementById("narrationLayer").innerHTML = "";
    document.getElementById("subtitleLayer").innerHTML = "";
    this._clearStackedNarrator();
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
      document.getElementById("narrationLayer").innerHTML = "";
      document.getElementById("subtitleLayer").innerHTML = "";
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
      if (scene.assets?.sounds) {
        scene.assets.sounds.forEach(s => {
          if (s.url && s.url.trim() !== "") {
            if (s.type === "bgm" || s.type === "ambient") {
              AudioManager.playBgm(s.url, { volume: s.volume || 0.6 });
            } else {
              AudioManager.playSfx(s.url, { volume: s.volume || 0.8 });
            }
          }
        });
      }

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
    const el = document.getElementById("stackedNarrator");
    if (el) {
      el.classList.remove("active");
      el.innerHTML = "";
    }
  },



  async _renderScene(scene) {
    this.isTyping = true;

    // 收集所有需要堆叠的字幕行（当前阶段）
    const ittQueue = [];

    // 渲染主行
    if (scene.lines && scene.lines.length > 0) {
      if (scene.mode === "narration") {
        for (const line of scene.lines) {
          if (line.important || scene.keepNarration) {
            await this._typeLine(line, "narration");
          } else {
            ittQueue.push(line);
          }
        }
        // 立即渲染 lines[] 中收集的字幕行（在 nextLines 之前）
        if (ittQueue.length > 0) {
          await this._delay(400);
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          await this._renderStackedNarrationBlock(ittQueue, scene);
          ittQueue.length = 0;
        }
      } else if (scene.mode === "dialogue") {
        for (let i = 0; i < scene.lines.length; i++) {
          if (i === 0 && scene.speaker) {
            this._showSpeakerTag(scene.speaker, scene.lines[i].style);
          }
          await this._typeLine(scene.lines[i], "subtitle");
        }
      } else if (scene.mode === "choice") {
        for (const line of scene.lines) {
          await this._renderNarrativeLine(line, scene);
        }
      } else if (scene.mode === "review") {
        // 复盘页面在scene结束后处理
      }
    }

    // 渲染后续行
    if (scene.nextLines) {
      for (const nl of scene.nextLines) {
        if (nl.mode === "narration" && !nl.important && !scene.keepNarration) {
          // 字幕行：收集到队列
          ittQueue.push(nl);
        } else if (nl.mode === "narration") {
          // 重要旁白 → 左侧
          await this._delay(300);
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          await this._typeLine(nl, "narration");
        } else {
          // 对白 → 底部字幕
          await this._delay(500);
          if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
          document.getElementById("subtitleLayer").innerHTML = "";

          if (nl.mode === "dialogue") {
            this._showSpeakerTag(nl.speaker, nl.style);
            await this._typeLine({ text: nl.text, hl: nl.hl || [] }, "subtitle");
          }

          if (nl.note) {
            await this._delay(300);
            await this._typeNote(nl.note, []);
          }
        }
      }
    }

    // === 渲染 nextLines 中收集的字幕行：堆叠 → 消散 → 雪花 ===
    if (ittQueue.length > 0) {
      await this._delay(400);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      await this._renderStackedNarrationBlock(ittQueue, scene);
    }

    // 交互模块
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

    // 选择
    if (scene.choices) {
      await this._delay(600);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      this._showChoices(scene);
    }

    // 复盘
    if (scene.mode === "review") {
      await this._delay(400);
      Interactions.showReview();
    }

    // 无选择则显示推进提示
    if (!scene.choices && scene.mode !== "review") {
      await this._delay(800);
      if (this.currentSceneId !== scene.id) { this.isTyping = false; return; }
      this._showNavHint();
    }

    this.isTyping = false;
    this._updateHUD();
  },

  // ==================== 堆叠旁白：句句向下累积 → 整块消散 → 雪花 ====================
  async _renderStackedNarrationBlock(lines, scene) {
    if (!lines || lines.length === 0) return;

    const container = document.getElementById("stackedNarrator");
    const holdDuration = 1.5;
    const dissolveDuration = 1.5;

    // 清空上轮、显示容器
    container.innerHTML = "";
    container.classList.add("active");

    // 逐行生成，每行生成后不消除上一行
    for (let i = 0; i < lines.length; i++) {
      if (this.currentSceneId !== scene.id) { this._clearStackedNarrator(); return; }

      const line = lines[i];
      const lineEl = document.createElement("div");
      lineEl.className = "subtitle-line";
      container.appendChild(lineEl);

      // 构建逐字 span
      const text = line.text;
      const hlWords = line.hl || [];
      const spans = [];

      for (let j = 0; j < text.length; j++) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = text[j];
        lineEl.appendChild(span);
        spans.push({ el: span, index: j });
      }

      // 高亮区间
      const hlRanges = [];
      hlWords.forEach(w => {
        let idx = text.indexOf(w);
        while (idx !== -1) {
          hlRanges.push({ start: idx, end: idx + w.length });
          idx = text.indexOf(w, idx + 1);
        }
      });
      const isHl = (idx) => hlRanges.some(r => idx >= r.start && idx < r.end);

      // 逐字显示
      for (let k = 0; k < spans.length; k++) {
        if (this.currentSceneId !== scene.id) { this._clearStackedNarrator(); return; }
        if (this.skipNext) {
          spans.forEach(s => {
            s.el.classList.add("show");
            if (isHl(s.index)) s.el.classList.add("hl");
          });
          this.skipNext = false;
          break;
        }
        const s = spans[k];
        if (isHl(s.index)) s.el.classList.add("hl");
        s.el.classList.add("show");
        await this._delay(35);
      }

      // 行间停顿（最后一行不停）
      if (i < lines.length - 1) {
        await this._delay(300);
      }
    }

    if (this.currentSceneId !== scene.id) { this._clearStackedNarrator(); return; }

    // 整块停留
    await this._delay(holdDuration * 1000);

    if (this.currentSceneId !== scene.id) { this._clearStackedNarrator(); return; }

    // 渐隐消散
    await this._dissolveText(container, dissolveDuration);
  },

  // ==================== 渐隐消散 ====================
  _dissolveText(container, duration) {
    return new Promise(resolve => {
      // 生成雪花粒子（CSS降级方案）
      const particles = [];
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const parent = document.getElementById("game");

      for (let i = 0; i < 18; i++) {
        const particle = document.createElement("div");
        particle.className = "snow-particle";
        particle.style.left = (cx + (Math.random() - 0.5) * rect.width) + "px";
        particle.style.top = (cy + (Math.random() - 0.5) * rect.height) + "px";
        particle.style.animationDuration = (0.8 + Math.random() * 1.2) + "s";
        particle.style.animationDelay = Math.random() * 0.4 + "s";
        particle.style.width = (3 + Math.random() * 5) + "px";
        particle.style.height = particle.style.width;
        if (parent) parent.appendChild(particle);
        particles.push(particle);
      }

      // 渐隐文本
      container.style.transition = `opacity ${duration * 0.5}s ease-out`;
      container.style.opacity = "0";

      // 清理
      setTimeout(() => {
        container.classList.remove("active");
        container.innerHTML = "";
        container.style.transition = "";
        container.style.opacity = "";
        particles.forEach(p => p.remove());
        resolve();
      }, duration * 1000);
    });
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

  // ==================== 打字效果 ====================
  _renderNarrativeLine(line, scene) {
    const useLeftNarration = line.important || scene.keepNarration;
    if (useLeftNarration) return this._typeLine(line, "narration");
    return this._typeIntertitle(line);
  },

  _typeIntertitle(line) {
    return new Promise(resolve => {
      const layer = document.getElementById("intertitleLayer");
      if (!layer) {
        this._typeLine(line, "narration").then(resolve);
        return;
      }

      const text = line.text || "";
      layer.innerHTML = "";
      layer.className = "active";

      const container = document.createElement("div");
      container.className = "intertitle-text";
      layer.appendChild(container);

      const spans = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = text[i];
        container.appendChild(span);
        spans.push({ el: span, index: i });
      }

      let charIdx = 0;
      const revealNext = () => {
        if (charIdx >= spans.length) {
          this.typingTimer = setTimeout(() => {
            layer.classList.add("fading");
            this.typingTimer = setTimeout(() => {
              this._clearIntertitle();
              resolve();
            }, 760);
          }, line.hold || 680);
          return;
        }

        if (this.skipNext) {
          spans.forEach(s => {
            s.el.classList.add("revealed");
          });
          this.skipNext = false;
          charIdx = spans.length;
          revealNext();
          return;
        }

        const s = spans[charIdx];
        s.el.classList.add("revealed");
        charIdx++;
        this.typingTimer = setTimeout(revealNext, line.speed || 34);
      };

      revealNext();
    });
  },

  _clearIntertitle() {
    const layer = document.getElementById("intertitleLayer");
    if (!layer) return;
    layer.className = "";
    layer.innerHTML = "";
    this.skipNext = false;
  },

  _typeLine(line, target) {
    return new Promise(resolve => {
      const text = line.text;
      const hlWords = line.hl || [];
      const isNarration = target === "narration";
      const panel = document.getElementById(isNarration ? "narrationLayer" : "subtitleLayer");

      // 旁白：新建行，累积
      // 字幕：清空旧内容再新建
      const container = document.createElement("div");
      container.className = isNarration ? "narration-line" : "subtitle-text";

      if (!isNarration) {
        // 字幕复用subtitleLayer但保留speaker-tag
        const existingTag = panel.querySelector(".speaker-tag-line");
        panel.innerHTML = "";
        if (existingTag) panel.appendChild(existingTag);
      }

      panel.appendChild(container);

      // 旧旁白变暗
      if (isNarration) {
        panel.querySelectorAll(".narration-line").forEach(el => {
          if (el !== container) el.classList.add("old");
        });
      }

      // 构建字符span
      const spans = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = text[i];
        container.appendChild(span);
        spans.push({ el: span, char: text[i], index: i });
      }

      // 高亮区间
      const hlRanges = [];
      hlWords.forEach(word => {
        let idx = text.indexOf(word);
        while (idx !== -1) {
          hlRanges.push({ start: idx, end: idx + word.length });
          idx = text.indexOf(word, idx + 1);
        }
      });

      function isHl(idx) {
        return hlRanges.some(r => idx >= r.start && idx < r.end);
      }

      // 逐字显示
      let charIdx = 0;
      const baseSpeed = isNarration ? 50 : 40;
      const speed = line.speed || baseSpeed;

      function revealNext() {
        if (charIdx >= spans.length) {
          resolve();
          return;
        }

        // 支持跳过
        if (this.skipNext) {
          spans.forEach(s => {
            s.el.classList.add("revealed");
            if (isHl(s.index)) s.el.classList.add("hl");
          });
          this.skipNext = false;
          resolve();
          return;
        }

        const s = spans[charIdx];
        if (isHl(s.index)) s.el.classList.add("hl");
        s.el.classList.add("revealed");
        charIdx++;

        // 滚动旁白
        if (isNarration) {
          panel.scrollTop = panel.scrollHeight;
        }

        this.typingTimer = setTimeout(revealNext, speed);
      }
      revealNext = revealNext.bind(this);
      revealNext();
    });
  },

  _typeNote(text, hl) {
    return new Promise(resolve => {
      const panel = document.getElementById("subtitleLayer");
      const container = document.createElement("div");
      container.className = "subtitle-note";
      panel.appendChild(container);

      const spans = [];
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = text[i];
        container.appendChild(span);
        spans.push({ el: span, char: text[i], index: i });
      }

      let charIdx = 0;
      const revealNext = () => {
        if (charIdx >= spans.length) { resolve(); return; }
        if (this.skipNext) {
          spans.forEach(s => s.el.classList.add("revealed"));
          this.skipNext = false;
          resolve();
          return;
        }
        spans[charIdx].el.classList.add("revealed");
        charIdx++;
        this.typingTimer = setTimeout(revealNext, 35);
      };
      revealNext();
    });
  },

  // ==================== 字幕标签 ====================
  _showSpeakerTag(name, style) {
    const panel = document.getElementById("subtitleLayer");
    const tagLine = document.createElement("div");
    tagLine.className = "speaker-tag-line";
    tagLine.style.cssText = "text-align:center;margin-bottom:4px;";

    const tag = document.createElement("span");
    tag.className = "speaker-tag";
    if (style === "aed-voice") tag.classList.add("aed-voice");
    if (style === "dispatcher") tag.classList.add("dispatcher");
    tag.textContent = name;
    tagLine.appendChild(tag);
    panel.appendChild(tagLine);
  },

  // ==================== 舞台管理 ====================
  _updateStage(scene) {
    const stage = document.getElementById("stage");
    const mediaLayer = document.getElementById("mediaLayer");
    const fallback = scene.stage || "rain_road";

    // 先清除旧的媒体内容
    if (mediaLayer) mediaLayer.innerHTML = "";

    // 从 scene.assets 读取素材（而非不存在的全局 ASSETS）
    const assets = scene.assets;
    const images = assets?.images || [];
    const videos = assets?.videos || [];

    // 尝试加载第一张有效图片
    const mainImage = images.find(img => img.url && img.url.trim() !== "");
    const mainVideo = videos.find(vid => vid.url && vid.url.trim() !== "");

    if (mainImage || mainVideo) {
      let loaded = false;

      // 加载图片
      if (mainImage) {
        const img = document.createElement("img");
        img.className = `scene-img ${mainImage.cssClass || ""}`;
        img.src = mainImage.url;
        img.alt = "";
        img.onload = () => {
          img.classList.add("active");
          stage.style.backgroundImage = "";
          stage.className = "";
          loaded = true;
        };
        img.onerror = () => {
          img.remove();
          if (!loaded) {
            stage.style.backgroundImage = "";
            stage.className = fallback;
          }
        };
        if (mediaLayer) mediaLayer.appendChild(img);
      }

      // 加载视频（目前预留，视频不自动播放）
      if (mainVideo) {
        const vid = document.createElement("video");
        vid.className = `scene-video ${mainVideo.cssClass || ""}`;
        vid.src = mainVideo.url;
        vid.muted = true;
        vid.loop = true;
        vid.playsInline = true;
        vid.onloadeddata = () => {
          vid.classList.add("active");
          loaded = true;
        };
        vid.onerror = () => {
          vid.remove();
          if (!loaded) {
            stage.style.backgroundImage = "";
            stage.className = fallback;
          }
        };
        if (mediaLayer) mediaLayer.appendChild(vid);
      }

      // 超时回退（素材加载超过5秒则回退到CSS背景）
      setTimeout(() => {
        if (!loaded && document.getElementById("mediaLayer")?.children.length === 0) {
          stage.style.backgroundImage = "";
          stage.className = fallback;
        }
      }, 5000);
    } else {
      // 无素材 → 使用CSS占位背景
      stage.style.backgroundImage = "";
      stage.className = fallback;
    }

    // 应用场景速度CSS变量
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
    this._clearIntertitle();
    this._clearStackedNarrator();
    this._hideCprFlash();
    this._hideAedDot();
    this._hideVignette();
  },

  // ==================== 导航提示 ====================
  _showNavHint() {
    document.getElementById("navHint").style.display = "block";
  },
  _hideNavHint() {
    document.getElementById("navHint").style.display = "none";
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

      // 推进（非选择/非交互模式）/ 开始画面
      if ((e.code === "Space" || e.code === "ArrowRight") && !this.isTyping) {
        e.preventDefault();

        // 开始画面：按空格开始游戏
        const startScreen = document.getElementById("startScreen");
        if (startScreen && startScreen.style.display !== "none") {
          this._startGame();
          return;
        }

        const scene = SCENES[this.currentSceneId];
        if (!scene) return;

        // 如果有选择在显示，不推进
        if (document.getElementById("choiceLayer")?.classList.contains("active")) return;
        // 如果交互模块活跃，不推进
        if (document.getElementById("cprModule")?.classList.contains("active")) return;
        if (document.getElementById("aedModule")?.classList.contains("active")) return;
        if (document.getElementById("assignModule")?.classList.contains("active")) return;
        if (document.getElementById("takeoverModule")?.classList.contains("active")) return;

        if (scene.next) {
          this.goToScene(this._resolveNext(scene));
        }
      }
    });

    // 鼠标点击推进
    document.getElementById("game").addEventListener("click", (e) => {
      if (this.isTyping) {
        // 跳过打字
        this.skipNext = true;
        return;
      }

      // 忽略选择/交互区域的点击
      if (e.target.closest("#choiceLayer")) return;
      if (e.target.closest("#cprModule")) return;
      if (e.target.closest("#aedModule")) return;
      if (e.target.closest("#assignModule")) return;
      if (e.target.closest("#takeoverModule")) return;
      if (e.target.closest("#reviewLayer")) return;
      if (e.target.closest("#pauseMenu")) return;
      if (e.target.closest("#debugPanel")) return;

      // 推进场景
      const scene = SCENES[this.currentSceneId];
      if (scene && scene.next && !scene.choices) {
        this.goToScene(this._resolveNext(scene));
      }
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
    document.getElementById("narrationLayer").innerHTML = "";
    document.getElementById("subtitleLayer").innerHTML = "";
    this._clearStackedNarrator();
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
