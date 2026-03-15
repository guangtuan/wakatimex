# WakaTimeX

WakaTimeX is a self-hosted WakaTime sync and visualization project for personal use.

It pulls `heartbeats` and `user_agents` from WakaTime, stores the data in MySQL, and serves a local web UI for browsing coding activity.

The project currently focuses on these capabilities:

- Sync WakaTime heartbeat data into a local database
- Aggregate coding time, heartbeat counts, languages, projects, and editors by date range
- Render a GitHub contributions-style monthly coding calendar
- Show per-day Languages / Projects details after selecting a date
- Provide AI vs Human line change statistics
- Support both Chinese and English UI

Overall, it is not meant to replace WakaTime itself. It is a more local, customizable, and controllable archive and dashboard for your own activity data.

中文说明：[README.md](README.md)
