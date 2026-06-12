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
  }
};
