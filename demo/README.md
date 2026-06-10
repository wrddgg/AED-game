# 《生命守护者》Demo 框架

电影式互动急救叙事游戏 — 第一章 Demo 框架。

## 快速启动

直接在浏览器打开 `index.html`，或启动本地服务器：

```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .
```

## 目录结构

```
demo/
  index.html          # 入口，DOM结构 + 模块加载
  css/
    style.css         # 全部样式（电影色、占位背景、响应式）
  js/
    scenes.js         # 场景数据 + 资源表（素材替换只需改这里）
    state.js          # 状态变量系统（12个变量 + applyEffects）
    game.js           # 核心引擎（渲染/跳转/HUD/暂停/输入）
    interactions.js   # 交互模块（CPR/AED/点名/换人/复盘）
    audio.js          # 音频接口（预留，当前静默运行）
  assets/
    images/           # 图片素材（就位后替换）
    videos/           # 视频素材
    audio/            # 音频素材
  README.md           # 本文件
```

## 素材替换

所有素材路径在 `js/scenes.js` 顶部的 `ASSETS` 对象中管理：

```js
const ASSETS = {
  prologue_factory: {
    image: "assets/images/prologue_factory.jpg",
    fallback: "factory_fire"  // 图片不存在时使用的CSS占位背景
  },
  // ...
};
```

替换步骤：
1. 将图片放入 `assets/images/`；
2. 确认路径与 `ASSETS` 中的 `image` 一致；
3. 图片加载成功后自动显示，失败则使用 `fallback` 占位。

## 操作方式

| 按键 | 功能 |
|------|------|
| 鼠标点击 | 推进剧情 / 跳过打字 |
| 空格 | 推进剧情 / CPR按压 / AED操作 |
| A / B | 选择分支 |
| H | 显示/隐藏 HUD |
| R | 重新开始 |
| Esc | 暂停菜单 |

## 技术说明

- 纯前端实现，无需构建工具，直接打开即可运行；
- 所有场景数据驱动，跳转不写死在按钮里；
- 占位背景使用 CSS 渐变 + 噪点 + 遮罩，无图片也能呈现电影氛围；
- 状态变量按 `第一章互动系统表.md` 建立，每次选择自动计算；
- 音频接口已预留，素材未就位时静默运行不报错。

## 完成标准

1. 打开后第一眼像游戏，不像网页
2. 没有素材时，占位画面有电影感
3. 旁白/对白/AED语音/调度员样式不同
4. 所有选择能正确跳转
5. 所有选择能改变变量
6. CPR模块能操作并影响按压质量
7. AED模块能操作并判断是否清场
8. 家属冲突能造成按压中断差异
9. 有章节复盘
10. 后续替换素材不需改核心代码
