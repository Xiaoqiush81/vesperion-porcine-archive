# PIGDEX 081

维斯珀里昂猪类与异常现象图鉴。馆舍包含 52 种猪咪形态、78 张《猪猪塔罗牌》、宅邸抽牌桌与猪种鉴定所。

## 本地运行

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 添加新形态

编辑 `data/specimens.json`，按照既有对象结构追加记录即可。页面会自动生成卡片、筛选项和详细档案。

## 代码结构

- `assets/js/main.js`：轻量入口，负责初始化各项独立功能。
- `assets/js/archive.js`：数据加载、检索、筛选与详情弹窗。
- `assets/js/identity-data.js`：鉴定题库与形态权重；扩题只需编辑这一处。
- `assets/js/identity-engine.js`：无界面的随机抽题与匹配算法。
- `assets/js/identity-storage.js`：鉴定历史与上轮题目持久化。
- `assets/js/identity.js`：界面控制与身份牌导出。
- `assets/js/records.js`：聚合鉴定与占卜记录，生成宅邸档案室。
- `assets/js/record-links.js`：猪种与塔罗的策展式象征联结。
- `assets/js/favorites.js`：猪种与塔罗共用的本地收藏状态，不与具体界面耦合。
- `assets/js/audio.js`：基于 Web Audio 的宅邸背景音乐与交互音效；无需额外音频资源，并遵守 Safari 的用户手势播放限制。
- `assets/js/tarot*.js`：塔罗数据、抽牌引擎、记录存储与交互界面。
- `assets/tarot/thumbs/`：用于陈列和翻牌的轻量预览图；详情页再渐进加载高清原图。
- `assets/js/theme.js`：主题切换、持久化与浏览器主题色。
- `assets/style.css`：设计变量、组件样式与纸张／夜色主题。
- `data/specimens.json`：唯一的馆藏数据源。

主题通过 `data-theme` 与 CSS 自定义属性驱动，不依赖图鉴逻辑；新增主题或标本可以分别进行。

## 部署

向 `main` 分支推送后，GitHub Actions 会将仓库内容自动部署至 GitHub Pages。

## 档案守则

- 核心编号始终为 `081`；其他字母为同一标本的不同形态。
- 只记录已被观察到的猪咪现象，不得捏造不存在的罪名。
- 捕获率固定为 `0.00%`。
