## 技术栈
- 后端：`FastAPI` + `Tortoise ORM` + `MySQL` + `APScheduler`
- 外部数据：`WakaTime API`（heartbeats、user_agents）
- 前端：原生 `HTML/CSS/JS`，图表用 `Chart.js`
- 运行方式：本地开发优先走 `compose.yaml`
- 前端已支持中英文切换，语言颜色使用 vendored 的 GitHub 语言颜色表：`src/wakatime_sync/web/assets/github-colors.json`

## 典型模块目录实例
- 应用入口：`src/wakatime_sync/main.py`
- API 路由与响应模型：`src/wakatime_sync/biz/api/routes.py`、`src/wakatime_sync/biz/api/schemas.py`
- WakaTime 客户端：`src/wakatime_sync/biz/wakatime/client.py`
- 同步逻辑：`src/wakatime_sync/biz/sync/service.py`
- 统计逻辑：`src/wakatime_sync/biz/stats/service.py`
- 数据模型：`src/wakatime_sync/sys/db.py`
- 前端页面与资源：`src/wakatime_sync/web/index.html`、`src/wakatime_sync/web/assets/app.js`、`src/wakatime_sync/web/assets/styles.css`
- 第三方说明：`THIRD_PARTY_NOTICES.md`、`third_party/ozh-github-colors.LICENSE`

## 本地开发自测流程
- 启动：`docker compose -f compose.yaml up --build -d`
- 查看状态：`docker compose -f compose.yaml logs -f`
- 健康检查：`http://127.0.0.1:9506/api/health`
- 这个 compose 会挂载 `src/`，前端改动通常不需要重启容器，直接刷新页面即可
- 改 JS 后先跑：`node --check src/wakatime_sync/web/assets/app.js`
- 需要验证运行中资源时，优先用容器内请求：`docker compose -f compose.yaml exec -T app python - <<'PY' ... PY`
- 导出本地 MySQL SQL 文件：`./export-db.sh`（可选输出路径参数）
- 本地依赖前提：`compose.yaml` 已内置 MySQL 8；WakaTime key 来自 `~/.wakatime.cfg` 或环境变量

## 代码品味和偏好
- 优先做小而准的改动，避免无关重构
- 后端改动优先修根因，不做表面补丁
- 前端尽量把文案、交互、颜色策略集中在 `src/wakatime_sync/web/assets/app.js` / `styles.css`
- 语言维度的颜色必须稳定，不要按排序随机分配；优先用 GitHub language colors，项目/编辑器可用稳定 fallback
- 需要引用实现时，直接写文件路径，少贴大段代码

## 涉及品味和偏好
- UI 风格偏 `github.com` / `OpenCode Web UI`：浅色、克制、低饱和、弱渐变、少“AI 味”
- 日期是主视觉区域：顶部标题和摘要卡片要尽量紧凑，不抢月历空间
- 月历规则：
  - 周一是每周第一天
  - 默认看当前月，可前后切月
  - 格子用 GitHub contributions 风格绿阶
  - hover 不要有跳动位移动效
  - 选中交互优先 click，不要依赖 hover popup
- 当前月历交互是“左侧月历 + 右侧详情面板”；点击日期后，右侧展示当天 `Languages` / `Projects`
- 右侧详情摘要分两行展示（时长 / 心跳数），日期标题尽量保持单行
- 页面支持中英文切换；新增文案时记得同时补 `I18N` 字典
- favicon 已采用 GitHub 绿格子风格，继续保持一致视觉语言
