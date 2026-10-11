# PIGDEX 081

维斯珀里昂猪类与异常现象图鉴。一个记录 Specimen No.081 已知形态、技能、栖息地与重大猪事的静态网站。

**在线图鉴：** https://xiaoqiush81.github.io/vesperion-porcine-archive/

## 本地运行

```bash
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## 添加新形态

编辑 `data/specimens.json`，按照既有对象结构追加记录即可。页面会自动生成卡片、筛选项和详细档案。

## 部署

向 `main` 分支推送后，GitHub Actions 会将仓库内容自动部署至 GitHub Pages。

## 档案守则

- 核心编号始终为 `081`；其他字母为同一标本的不同形态。
- 只记录已被观察到的猪咪现象，不得捏造不存在的罪名。
- 捕获率固定为 `0.00%`。
