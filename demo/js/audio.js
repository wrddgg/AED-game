/* ============================================================
   audio.js — 《生命守护者》音频接口
   自动尝试常见扩展名，资源缺失时静默失败
   ============================================================ */

const AudioManager = {
  _bgm: null,
  _ambient: null,
  _muted: false,
  _volume: { master: 0.8, bgm: 0.6, ambient: 0.5, sfx: 0.8, voice: 1.0 },
  _activeSfx: [],
  _supportedAudioExts: [".mp3", ".wav", ".ogg"],

  init() {
    this.stopAll();
    this._muted = false;
    this._activeSfx = [];
  },

  _applyVolume(audio, type, volumeOverride) {
    if (!audio) return;
    const master = this._muted ? 0 : this._volume.master;
    const group = this._volume[type] ?? 1;
    const explicit = volumeOverride ?? 1;
    audio.volume = Math.max(0, Math.min(1, master * group * explicit));
  },

  _normalizeBasePath(path) {
    if (!path) return "";
    return path.replace(/\.(mp3|wav|ogg)$/i, "").trim();
  },

  async _resolveSource(basePath) {
    const normalized = this._normalizeBasePath(basePath);
    if (!normalized) return null;

    for (const ext of this._supportedAudioExts) {
      const candidate = `${normalized}${ext}`;
      try {
        const res = await fetch(candidate, { method: "HEAD" });
        if (res.ok) return candidate;
      } catch (_) {}
    }

    return null;
  },

  async _buildAudio(basePath, { loop = false, preload = "auto", type = "sfx", volume = 1.0 } = {}) {
    const src = await this._resolveSource(basePath);
    if (!src) return null;

    const audio = new Audio(src);
    audio.dataset.group = type;
    audio.loop = loop;
    audio.preload = preload;
    this._applyVolume(audio, type, volume);
    return audio;
  },

  async playBgm(basePath, opts = {}) {
    const volume = opts.volume ?? 1.0;
    if (this._bgm?.dataset?.basePath === this._normalizeBasePath(basePath)) {
      this._applyVolume(this._bgm, "bgm", volume);
      return this._bgm;
    }

    if (this._bgm) {
      this._bgm.pause();
      this._bgm = null;
    }

    const audio = await this._buildAudio(basePath, { loop: true, preload: "auto", type: "bgm", volume });
    if (!audio) return null;

    audio.dataset.basePath = this._normalizeBasePath(basePath);
    this._bgm = audio;
    audio.play().catch(() => {});
    return audio;
  },

  async setAmbience(basePath, opts = {}) {
    const volume = opts.volume ?? 1.0;
    if (this._ambient?.dataset?.basePath === this._normalizeBasePath(basePath)) {
      this._applyVolume(this._ambient, "ambient", volume);
      return this._ambient;
    }

    if (this._ambient) {
      this._ambient.pause();
      this._ambient = null;
    }

    const audio = await this._buildAudio(basePath, { loop: true, preload: "auto", type: "ambient", volume });
    if (!audio) return null;

    audio.dataset.basePath = this._normalizeBasePath(basePath);
    this._ambient = audio;
    audio.play().catch(() => {});
    return audio;
  },

  async playSfx(basePath, opts = {}) {
    const volume = opts.volume ?? 1.0;
    const once = opts.once !== false;
    const audio = await this._buildAudio(basePath, { loop: !once, preload: "auto", type: "sfx", volume });
    if (!audio) return null;

    this._activeSfx.push(audio);
    audio.addEventListener("ended", () => {
      this._activeSfx = this._activeSfx.filter(item => item !== audio);
    }, { once: true });
    audio.play().catch(() => {});
    return audio;
  },

  async playVoice(sceneId, lineId, opts = {}) {
    const basePath = opts.basePath || `assets/audio/voice/${sceneId}/${lineId}`;
    const audio = await this._buildAudio(basePath, { loop: false, preload: "auto", type: "voice", volume: opts.volume ?? 1.0 });
    if (!audio) return null;
    audio.play().catch(() => {});
    return audio;
  },

  stopAll() {
    if (this._bgm) {
      this._bgm.pause();
      this._bgm.currentTime = 0;
      this._bgm = null;
    }
    if (this._ambient) {
      this._ambient.pause();
      this._ambient.currentTime = 0;
      this._ambient = null;
    }
    this.stopNarration();
    this._activeSfx.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
    });
    this._activeSfx = [];
  },

  setVolume(type, value) {
    if (this._volume[type] !== undefined) {
      this._volume[type] = Math.max(0, Math.min(1, value));
      this._applyVolume(this._bgm, "bgm", 1);
      this._applyVolume(this._ambient, "ambient", 1);
      this._activeSfx.forEach(audio => {
        const group = audio.dataset?.group || "sfx";
        this._applyVolume(audio, group, 1);
      });
    }
  },

  toggleMute() {
    this._muted = !this._muted;
    this._applyVolume(this._bgm, "bgm", 1);
    this._applyVolume(this._ambient, "ambient", 1);
    this._activeSfx.forEach(audio => {
      const group = audio.dataset?.group || "sfx";
      this._applyVolume(audio, group, 1);
    });
    return this._muted;
  },

  isReady() {
    return true;
  },

  // CPR节拍音效（120bpm，嘟嘟声）
  _cprContext: null,
  _cprInterval: null,
  _cprBeepDuration: 0.08, // 80ms的嘟嘟声

  startCprMetronome(bpm = 120, volume = 0.6) {
    this.stopCprMetronome();

    if (!this._cprContext) {
      this._cprContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const context = this._cprContext;
    const intervalMs = (60 / bpm) * 1000;

    // 生成嘟嘟声
    const playBeep = () => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.value = 880; // A5音
      oscillator.type = 'sine'; // 正弦波，清晰的嘟嘟声

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + this._cprBeepDuration);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + this._cprBeepDuration);
    };

    // 立即播放第一声
    playBeep();

    // 定时播放后续节拍
    this._cprInterval = setInterval(playBeep, intervalMs);
  },

  stopCprMetronome() {
    if (this._cprInterval) {
      clearInterval(this._cprInterval);
      this._cprInterval = null;
    }
  },

  isCprMetronomeRunning() {
    return this._cprInterval !== null;
  },

  // ==================== 环境音效生成器 ====================

  // 周围人声嘈杂音效
  _crowdContext: null,
  _crowdNodes: [],
  _crowdActive: false,

  startCrowdNoise(duration = 30, volume = 0.3) {
    if (this._crowdActive) return;

    if (!this._crowdContext) {
      this._crowdContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = this._crowdContext;
    this._crowdActive = true;

    // 生成3-5个声音层模拟不同人的说话
    const voiceCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < voiceCount; i++) {
      this._createCrowdVoiceLayer(ctx, volume, i);
    }

    // 设置自动停止
    if (duration > 0) {
      setTimeout(() => this.stopCrowdNoise(), duration * 1000);
    }
  },

  _createCrowdVoiceLayer(ctx, baseVolume, index) {
    // 白噪音源
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // 带通滤波器（人声频率范围）
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300 + index * 150 + Math.random() * 100; // 不同音色
    filter.Q.value = 0.5;

    // 增益节点（波动音量）
    const gain = ctx.createGain();
    gain.gain.value = 0;

    // 低频振荡器调制音量（模拟说话节奏）
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.3 + index * 0.1 + Math.random() * 0.2; // 不同节奏
    lfo.type = 'sine';
    lfoGain.gain.value = baseVolume * 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    lfo.start();

    this._crowdNodes.push(noise, filter, gain, lfo, lfoGain);
  },

  stopCrowdNoise() {
    this._crowdActive = false;
    this._crowdNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this._crowdNodes = [];
  },

  // 紧张音乐生成器
  _tensionContext: null,
  _tensionNodes: [],
  _tensionActive: false,
  _tensionInterval: null,

  startTensionMusic(intensity = 0.5, volume = 0.4) {
    if (this._tensionActive) return;

    if (!this._tensionContext) {
      this._tensionContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = this._tensionContext;
    this._tensionActive = true;
    this._tensionNodes = [];

    // 基础紧张低音
    this._createTensionDrone(ctx, volume * 0.3);

    // 不和谐和弦
    this._createTensionChord(ctx, volume * 0.2);

    // 节奏脉冲
    this._tensionInterval = setInterval(() => {
      if (!this._tensionActive) return;
      this._playTensionPulse(ctx, volume * intensity);
    }, 800);
  },

  _createTensionDrone(ctx, volume) {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; // 低音A
    osc2.type = 'sine';
    osc2.frequency.value = 55.5; // 微调失谐（beat频率）

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    gain.gain.value = volume;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    this._tensionNodes.push(osc1, osc2, gain, filter);
  },

  _createTensionChord(ctx, volume) {
    // 不和谐和弦（增四度/减五度）
    const frequencies = [146.83, 174.61, 220, 261.63]; // D4, F4, A4, C5（不和谐）
    const gains = [];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.value = volume * 0.15 * (1 - i * 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this._tensionNodes.push(osc, gain);
      gains.push(gain);
    });
  },

  _playTensionPulse(ctx, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 80 + Math.random() * 20;

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  },

  stopTensionMusic() {
    this._tensionActive = false;

    if (this._tensionInterval) {
      clearInterval(this._tensionInterval);
      this._tensionInterval = null;
    }

    this._tensionNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this._tensionNodes = [];
  },

  isTensionMusicRunning() {
    return this._tensionActive;
  },

  // ==================== 警告音效 ====================

  // 按压中断警告音
  playInterruptionWarning() {
    if (!this._cprContext) {
      this._cprContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this._cprContext;

    // 3个快速警告嘟嘟声
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = 440;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }, i * 200);
    }
  },

  // ==================== 背景环境音 ====================

  _bgContext: null,
  _bgNodes: [],
  _bgActive: false,

  startBackgroundAmbience(volume = 0.2) {
    if (this._bgActive) return;

    if (!this._bgContext) {
      this._bgContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = this._bgContext;
    this._bgActive = true;
    this._bgNodes = [];

    // 雨声（白噪音+低通滤波）
    this._createRainSound(ctx, volume * 0.6);

    // 远处城市噪音（粉红噪音）
    this._createCityNoise(ctx, volume * 0.4);
  },

  _createRainSound(ctx, volume) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();

    this._bgNodes.push(noise, filter, gain);
  },

  _createCityNoise(ctx, volume) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    // LFO波动
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = volume * 0.3;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    lfo.start();

    this._bgNodes.push(noise, filter, gain, lfo, lfoGain);
  },

  stopBackgroundAmbience() {
    this._bgActive = false;
    this._bgNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) {}
    });
    this._bgNodes = [];
  },

  isBackgroundAmbienceRunning() {
    return this._bgActive;
  },

  // ==================== 旁白音频（完整生命周期管理） ====================
  _narrationAudio: null,
  _narrationCallId: 0,       // 调用序号，阻止旧回调污染
  _narrationTimeout: null,   // fallback计时器句柄
  _narrationResolve: null,   // 当前pending的Promise resolve

  playNarration(audioPath) {
    // 彻底停止并销毁上一段旁白
    this.stopNarration();
    const callId = ++this._narrationCallId;

    return new Promise((resolve) => {
      this._narrationResolve = resolve;
      const audio = new Audio(audioPath);
      audio.preload = "auto";
      this._applyVolume(audio, "voice", 1.0);
      this._narrationAudio = audio;

      let resolved = false;
      const done = (result) => {
        // 校验调用序号，阻止旧回调生效
        if (resolved || callId !== this._narrationCallId) return;
        resolved = true;
        this._narrationResolve = null;
        this._clearNarrationTimeout();
        // 移除事件监听器，防止内存泄漏
        audio.removeEventListener("canplaythrough", onCanPlay);
        audio.removeEventListener("loadedmetadata", onMeta);
        audio.removeEventListener("error", onError);
        resolve(result);
      };

      const onCanPlay = () => {
        audio.play().catch(() => {});
        done(audio);
      };
      const onMeta = () => {
        if (!resolved) {
          audio.play().catch(() => {});
          done(audio);
        }
      };
      const onError = () => {
        console.warn("[Audio] 旁白音频加载失败:", audioPath);
        this._narrationAudio = null;
        done(null);
      };

      audio.addEventListener("canplaythrough", onCanPlay);
      audio.addEventListener("loadedmetadata", onMeta);
      audio.addEventListener("error", onError);

      // 安全阀：2秒后强制触发
      this._narrationTimeout = setTimeout(() => {
        if (callId !== this._narrationCallId) return;
        if (!resolved) {
          audio.play().catch(() => {});
          done(audio);
        }
      }, 2000);

      audio.load();
    });
  },

  /** 彻底停止并销毁旁白音频：移除src、终止加载、使旧Promise失效 */
  stopNarration() {
    this._clearNarrationTimeout();
    // 使旧Promise的resolve失效
    if (this._narrationResolve) {
      this._narrationResolve = null;
    }
    if (this._narrationAudio) {
      const audio = this._narrationAudio;
      try {
        audio.pause();
        audio.currentTime = 0;
        // 移除src并重新load，彻底终止任何进行中的加载/解码
        audio.removeAttribute("src");
        audio.load();
      } catch (e) {}
      this._narrationAudio = null;
    }
    // 递增序号，使所有旧回调失效
    this._narrationCallId++;
  },

  /** 清理fallback超时计时器 */
  _clearNarrationTimeout() {
    if (this._narrationTimeout) {
      clearTimeout(this._narrationTimeout);
      this._narrationTimeout = null;
    }
  },

  // ==================== 成就音效 ====================

  playAchievementSound() {
    if (!this._bgContext) {
      this._bgContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = this._bgContext;

    // 成就解锁音效（C大调和弦）
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }, i * 100);
    });
  }
};
