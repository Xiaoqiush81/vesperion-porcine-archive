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
- `assets/js/identity.js`：六项猪迹观察、形态匹配、鉴定记录与身份牌导出。
- `assets/js/tarot*.js`：塔罗数据、抽牌引擎、记录存储与交互界面。
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
