# WakaTimeX

WakaTimeX 是一个面向个人自托管的 WakaTime 数据同步与可视化项目。

它会从 WakaTime 拉取 `heartbeats` 和 `user_agents`，将数据保存到 MySQL，并提供一套本地网页界面来查看编码活动。

项目目前主要包含这些能力：

- 将 WakaTime 心跳数据同步到本地数据库
- 按日期范围汇总编码时长、心跳数、语言、项目、编辑器等统计
- 首页展示 GitHub contributions 风格的月度编码日历，并按北京时间聚合日期
- 支持点击日期查看当天的 Languages / Projects 详情和 24 小时活跃分布
- 独立的 Charts 页面展示语言、项目、AI 统计和排行信息
- 提供 AI / Human line changes 统计
- 提供中英文界面切换

整体上，它不是对 WakaTime 官方产品的替代，而是一个更偏本地、自定义、可控的数据归档和展示面板。

English version: [README.en.md](README.en.md)
