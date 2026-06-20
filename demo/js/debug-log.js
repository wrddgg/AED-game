/* ============================================================
   debug-log.js — 精准诊断音频-字幕同步问题
   
   用法：浏览器控制台输入 SyncLog.enable() 开启
         SyncLog.disable() 关闭
         SyncLog.dump() 打印最近 200 条日志
   ============================================================ */

const SyncLog = {
  _enabled: false,
  _buffer: [],
  _maxSize: 200,

  enable() {
    this._enabled = true;
    this._buffer = [];
    console.log('%c[SyncLog] ✅ 同步诊断已开启', 'color:#6ee7b7;font-size:14px');
  },

  disable() {
    this._enabled = false;
    console.log('%c[SyncLog] ⏹ 同步诊断已关闭', 'color:#f5c842;');
  },

  dump() {
    console.table(this._buffer.map(e => ({
      tick: e.tick,
      when: new Date(e.ts).toISOString().slice(11, 23),
      scene: e.scene,
      event: e.event,
      rate: e.rate?.toFixed(2),
      vtime: e.vtime?.toFixed(2),
      atime: e.atime?.toFixed(2),
      idx: e.idx,
      txt: (e.text || '').slice(0, 30),
      note: e.note || ''
    })));
  },

  _push(event, data = {}) {
    if (!this._enabled) return;
    const entry = {
      tick: this._buffer.length,
      ts: Date.now(),
      scene: data.scene || Game.currentSceneId || '?',
      event,
      rate: data.rate,
      vtime: data.vtime,
      atime: data.atime,
      idx: data.idx,
      text: data.text,
      note: data.note || '',
    };
    this._buffer.push(entry);
    if (this._buffer.length > this._maxSize) this._buffer.shift();

    // 关键事件实时打印
    const emoji = {
      'speed-change': '⚡',
      'subtitle-show': '📝',
      'audio-start': '🔊',
      'audio-ended': '🔇',
      'vclock-tick': '⏱',
      'no-audio-hold': '⏸',
      'mode-enter': '🎬',
      'mode-skip': '⏭',
    }[event] || '•';

    let info = `${emoji} [${entry.when}] ${event}`;
    if (data.rate !== undefined) info += ` rate=${data.rate.toFixed(2)}`;
    if (data.vtime !== undefined) info += ` vtime=${data.vtime.toFixed(2)}s`;
    if (data.atime !== undefined) info += ` atime=${data.atime.toFixed(2)}s`;
    if (data.idx !== undefined) info += ` idx=${data.idx}`;
    if (data.text) info += ` text="${data.text.slice(0,40)}"`;
    if (data.note) info += ` [${data.note}]`;
    console.log(info);
  },

  /** 外部调用：通用日志 */
  log(event, data = {}) {
    this._push(event, data);
  },

  /** 外部调用：速度变更 */
  speedChange(newRate) {
    this._push('speed-change', { rate: newRate, note: `textSpeed → ${newRate.toFixed(2)}` });
  },

  /** 外部调用：字幕显示 */
  subtitleShow(data) {
    this._push('subtitle-show', data);
  },

  /** 外部调用：音频开始播放 */
  audioStart(data) {
    this._push('audio-start', data);
  },

  /** 外部调用：音频结束 */
  audioEnded(data) {
    this._push('audio-ended', data);
  },

  /** 外部调用：虚拟时钟推进 */
  vclockTick(data) {
    this._push('vclock-tick', data);
  },

  /** 外部调用：进入某个渲染模式 */
  modeEnter(mode, sceneId) {
    this._push('mode-enter', { scene: sceneId, note: `mode=${mode}` });
  },
};

// 暴露到全局，方便控制台操作
window.SyncLog = SyncLog;
