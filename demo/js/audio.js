/* ============================================================
   audio.js — 《生命守护者》音频接口
   预留接口，现在没音频就静默，代码不能报错
   ============================================================ */

const AudioManager = {
  _bgm: null,
  _muted: false,
  _volume: { master: 0.8, bgm: 0.6, sfx: 0.8, voice: 1.0 },
  _activeSfx: [],

  init() {
    this._muted = false;
    this._activeSfx = [];
    console.log("[Audio] 音频接口已就绪。素材未加载，静默运行。");
  },

  // ---- 播放背景音乐 ----
  playBgm(name, opts = {}) {
    const fallback = opts.fallback || "silence";
    console.log(`[Audio] BGM: ${name} (fallback: ${fallback})`);
    // 素材就位后实现：
    // - 从 assets/audio/bgm/${name}.mp3 加载
    // - 循环播放，fadeIn
    // - 不存在则静默
  },

  // ---- 播放音效 ----
  playSfx(name, opts = {}) {
    const { volume = 1.0, once = true } = opts;
    console.log(`[Audio] SFX: ${name} (vol: ${volume})`);
    // 素材就位后实现：
    // - 从 assets/audio/sfx/${name}.wav 加载
    // - once=true 则播完销毁
  },

  // ---- 播放配音 ----
  playVoice(sceneId, lineId) {
    const key = `${sceneId}_${lineId}`;
    console.log(`[Audio] Voice: ${key}`);
    // 素材就位后实现：
    // - 从 assets/audio/voice/${sceneId}/${lineId}.mp3 加载
    // - 顺序播放，播完触发 callback
  },

  // ---- 设置环境音 ----
  setAmbience(name) {
    console.log(`[Audio] Ambience: ${name}`);
    // 素材就位后实现：
    // - rain_heavy / crowd_murmur / ambulance_siren / silence
  },

  // ---- 停止所有 ----
  stopAll() {
    console.log("[Audio] 停止所有音频");
    this._activeSfx = [];
  },

  // ---- 音量控制 ----
  setVolume(type, value) {
    if (this._volume[type] !== undefined) {
      this._volume[type] = Math.max(0, Math.min(1, value));
    }
  },

  // ---- 静音切换 ----
  toggleMute() {
    this._muted = !this._muted;
    return this._muted;
  },

  // ---- 音频上下文检查 ----
  isReady() {
    return true; // 素材未加载时始终返回true，不阻塞
  }
};
