/* ============================================================
   leaderboard.js — 《圆心之外》排行榜系统
   使用localStorage保存本地排行榜
   ============================================================ */

const Leaderboard = {
  _data: [],
  _maxEntries: 10,

  init() {
    const saved = localStorage.getItem('aed_leaderboard');
    if (saved) {
      this._data = JSON.parse(saved);
    }
  },

  addScore(playerName, score, details = {}) {
    const entry = {
      id: Date.now(),
      name: playerName || '匿名',
      score: score,
      quality: details.quality || 0,
      combo: details.combo || 0,
      time: details.time || 0,
      date: new Date().toLocaleDateString('zh-CN'),
    };

    this._data.push(entry);

    // 按分数排序
    this._data.sort((a, b) => b.score - a.score);

    // 只保留前N名
    if (this._data.length > this._maxEntries) {
      this._data = this._data.slice(0, this._maxEntries);
    }

    this._save();
    return this._data.findIndex(e => e.id === entry.id) + 1; // 返回排名
  },

  getTopScores() {
    return this._data;
  },

  getRank(score) {
    const rank = this._data.findIndex(e => e.score < score) + 1;
    return rank || this._data.length + 1;
  },

  clearAll() {
    this._data = [];
    this._save();
  },

  _save() {
    localStorage.setItem('aed_leaderboard', JSON.stringify(this._data));
  }
};
