/* ============================================================
   achievements.js — 《生命守护者》成就系统
   ============================================================ */

const Achievements = {
  _achievements: [
    { id: 'first_beat', name: '第一下', desc: '成功完成第一次按压', unlocked: false },
    { id: 'combo_5', name: '连续稳定', desc: '达成5连击', unlocked: false },
    { id: 'combo_10', name: '节奏大师', desc: '达成10连击', unlocked: false },
    { id: 'perfect_cpr', name: '完美心肺', desc: '按压质量达到优秀', unlocked: false },
    { id: 'save_life', name: '生命守护者', desc: '成功挽救一条生命', unlocked: false },
  ],

  _notifications: [],

  init() {
    // 从localStorage加载已解锁成就
    const saved = localStorage.getItem('aed_achievements');
    if (saved) {
      const parsed = JSON.parse(saved);
      this._achievements.forEach(a => {
        if (parsed.includes(a.id)) a.unlocked = true;
      });
    }
  },

  unlock(id) {
    const achievement = this._achievements.find(a => a.id === id);
    if (!achievement || achievement.unlocked) return false;

    achievement.unlocked = true;
    this._save();
    this._showNotification(achievement);
    AudioManager.playAchievementSound();

    return true;
  },

  _save() {
    const unlockedIds = this._achievements.filter(a => a.unlocked).map(a => a.id);
    localStorage.setItem('aed_achievements', JSON.stringify(unlockedIds));
  },

  _showNotification(achievement) {
    // 创建成就弹窗
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-info">
        <div class="achievement-title">成就解锁</div>
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.desc}</div>
      </div>
    `;

    document.body.appendChild(notification);

    // 动画显示
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  },

  showStats() {
    // 创建成就统计界面
    const layer = document.createElement('div');
    layer.id = 'achievementLayer';
    layer.className = 'achievement-layer';
    layer.innerHTML = `
      <div class="achievement-panel">
        <h2>成就统计</h2>
        <div class="achievement-list">
          ${this._achievements.map(a => `
            <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-icon">${a.unlocked ? '🏆' : '🔒'}</div>
              <div class="achievement-info">
                <div class="achievement-name">${a.unlocked ? a.name : '???'}</div>
                <div class="achievement-desc">${a.unlocked ? a.desc : '未解锁'}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <button class="achievement-close" onclick="this.closest('.achievement-layer').remove()">关闭</button>
      </div>
    `;

    document.body.appendChild(layer);
  },

  getAll() {
    return this._achievements;
  }
};
