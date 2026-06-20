const versionEl = document.getElementById('version');
const lastSyncEl = document.getElementById('last-sync');
const syncRangeBtn = document.getElementById('sync-range-btn');
const syncUserAgentsBtn = document.getElementById('sync-user-agents-btn');
const syncStartDateEl = document.getElementById('sync-start-date');
const syncEndDateEl = document.getElementById('sync-end-date');
const syncHistoryListEl = document.getElementById('sync-history-list');
const todayActiveEl = document.getElementById('today-active');
const todayHeartbeatsEl = document.getElementById('today-heartbeats');
const weekActiveEl = document.getElementById('week-active');
const bestDayEl = document.getElementById('best-day');
const totalHeartbeatsEl = document.getElementById('total-heartbeats');
const totalHeartbeatsDetailEl = document.getElementById('total-heartbeats-detail');
const topLanguagesEl = document.getElementById('top-languages');
const topProjectsEl = document.getElementById('top-projects');
const topEditorsEl = document.getElementById('top-editors');
const dailyCalendarGridEl = document.getElementById('daily-calendar-grid');
const calendarMonthLabelEl = document.getElementById('calendar-month-label');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');
const todayBtn = document.getElementById('today-btn');
const calendarSidePanelEl = document.getElementById('calendar-side-panel');
const calendarHoverTitleEl = document.getElementById('calendar-hover-title');
const calendarHoverSummaryEl = document.getElementById('calendar-hover-summary');
const calendarHoverLanguagesEl = document.getElementById('calendar-hover-languages');
const calendarHoverProjectsEl = document.getElementById('calendar-hover-projects');
const calendarHourlyPanelEl = document.getElementById('calendar-hourly-panel');
const calendarHourlyTitleEl = document.getElementById('calendar-hourly-title');
const calendarHourlySummaryEl = document.getElementById('calendar-hourly-summary');
const calendarHourlyListEl = document.getElementById('calendar-hourly-list');
const prevMonthCardEl = document.getElementById('prev-month-card');
const prevMonthHoursEl = document.getElementById('prev-month-hours');
const prevMonthDeltaEl = document.getElementById('prev-month-delta');
const langSwitchEl = document.getElementById('lang-switch');
const langEnBtn = document.getElementById('lang-en-btn');
const langZhBtn = document.getElementById('lang-zh-btn');
const projectMappingFormEl = document.getElementById('project-mapping-form');
const projectMappingSourceEl = document.getElementById('project-mapping-source');
const projectMappingTargetEl = document.getElementById('project-mapping-target');
const projectMappingSubmitEl = document.getElementById('project-mapping-submit');
const projectMappingFeedbackEl = document.getElementById('project-mapping-feedback');
const projectMappingListEl = document.getElementById('project-mapping-list');
const projectMappingCountEl = document.getElementById('project-mapping-count');
const editorMappingFormEl = document.getElementById('editor-mapping-form');
const editorMappingSourceEl = document.getElementById('editor-mapping-source');
const editorMappingTargetEl = document.getElementById('editor-mapping-target');
const editorMappingSubmitEl = document.getElementById('editor-mapping-submit');
const editorMappingFeedbackEl = document.getElementById('editor-mapping-feedback');
const editorMappingListEl = document.getElementById('editor-mapping-list');
const editorMappingCountEl = document.getElementById('editor-mapping-count');
const pageType = document.body?.dataset.page || 'home';
const APP_TIMEZONE = 'Asia/Shanghai';
const SECONDS_PER_HOUR = 60 * 60;

let languageChart = null;
let projectChart = null;
let currentMonth = new Date();
let currentSelectedDate = null;
let previewRequestToken = 0;
let cachedCurrentDays = [];
let cachedPrevMonthDays = [];
let projectMappingOptions = [];
let editorMappingOptions = [];
let mappedEditorSources = new Set();
let syncHistoryRuns = [];

const dailyBreakdownCache = new Map();
const LANGUAGE_STORAGE_KEY = 'wakatime-sync.lang';
const SUPPORTED_LANGUAGES = new Set(['en', 'zh']);

const COLORS = [
  '#2da44e', '#0969da', '#8250df', '#bc4c00', '#cf222e',
  '#1b7f83', '#9a6700', '#57606a', '#1f883d', '#0550ae',
];

const DEFAULT_LANGUAGE_COLOR_MAP = {
  python: '#3572A5',
  markdown: '#083fa1',
  java: '#b07219',
  javascript: '#f1e05a',
  typescript: '#3178c6',
  go: '#00ADD8',
  shell: '#89e051',
  bash: '#89e051',
  json: '#292929',
  yaml: '#cb171e',
  yml: '#cb171e',
  html: '#e34c26',
  css: '#663399',
  scss: '#c6538c',
  sql: '#e38c00',
  xml: '#0060ac',
  plaintext: '#6e7781',
  text: '#6e7781',
  dockerfile: '#384d54',
  toml: '#9c4221',
  rust: '#dea584',
  kotlin: '#A97BFF',
  swift: '#F05138',
  c: '#555555',
  'c++': '#f34b7d',
  csharp: '#178600',
  'c#': '#178600',
};

let languageColorMap = { ...DEFAULT_LANGUAGE_COLOR_MAP };
let languageColorsPromise = null;

const I18N = {
  en: {
    doc: {
      home_title: 'WakaTime Activity',
      charts_title: 'WakaTime Charts',
      project_mappings_title: 'Project Mappings',
      sync_history_title: 'Sync History',
    },
    brand: {
      activity: 'Activity',
    },
    nav: {
      lang_switch_label: 'Language switch',
    },
    page: {
      home: 'Home',
      charts: 'Charts',
      project_mappings: 'Mappings',
      sync_history: 'Sync History',
      charts_title: 'Monthly charts and rankings',
      charts_description: 'Open language, project, AI, and ranking panels on a dedicated page.',
    },
    project_mappings: {
      eyebrow: 'Mappings',
      title: 'Normalize project and editor names',
      description: 'Merge renamed folders and editor variants into stable names used across charts and breakdowns.',
      form_title: 'Add or update mapping',
      list_title: 'Current mappings',
      source_label: 'Source project',
      target_label: 'Target project',
      source_placeholder: 'Choose a source project',
      target_placeholder: 'Choose a target project',
      save: 'Save mapping',
      saving: 'Saving...',
      delete: 'Delete',
      empty: 'No project mappings yet.',
      count: '{count} mappings',
      invalid: 'Please fill in both project names.',
      invalid_same: 'Source and target project must be different.',
      saved: 'Mapping saved.',
      deleted: 'Mapping deleted.',
      load_error: 'Failed to load mappings.',
      options_error: 'Failed to load project options.',
      save_error: 'Failed to save mapping.',
      delete_error: 'Failed to delete mapping.',
    },
    editor_mappings: {
      form_title: 'Add or update mapping',
      list_title: 'Current mappings',
      source_label: 'Source editor',
      target_label: 'Target editor',
      source_placeholder: 'Choose a source editor',
      target_placeholder: 'Choose a target editor',
      save: 'Save mapping',
      saving: 'Saving...',
      delete: 'Delete',
      empty: 'No editor mappings yet.',
      count: '{count} mappings',
      invalid: 'Please fill in both editor names.',
      invalid_same: 'Source and target editor must be different.',
      saved: 'Mapping saved.',
      deleted: 'Mapping deleted.',
      load_error: 'Failed to load mappings.',
      options_error: 'Failed to load editor options.',
      save_error: 'Failed to save mapping.',
      delete_error: 'Failed to delete mapping.',
    },
    mobile: {
      sync: {
        title: 'Sync Range',
      },
      summary: {
        active: 'Active',
        best_day: 'Best Day',
        heartbeats: 'Heartbeats',
      },
    },
    hero: {
      title: 'Activity Overview',
    },
    summary: {
      today: 'Today',
      selected_month: 'Selected Month',
      best_prefix: 'Best:',
      total_heartbeats: 'Total Heartbeats',
      this_month: 'This month',
      prev_month: 'Last month',
      prev_month_delta_up: '↑{delta} vs last',
      prev_month_delta_down: '↓{delta} vs last',
      prev_month_delta_same: 'Same as last',
    },
    common: {
      heartbeats: 'heartbeats',
      to: 'to',
      no_data: 'No data',
      unknown: 'Unknown',
      error: 'error',
      confirm: 'OK',
    },
    state: {
      synced: 'Synced: {time}',
      never_synced: 'Never synced',
    },
    sync_history: {
      eyebrow: 'Sync History',
      title: 'Recent sync runs',
      description: 'Track each sync and review how long every step took.',
      empty: 'No sync runs yet.',
      load_error: 'Failed to load sync history.',
      running: 'Running',
      success: 'Success',
      failed: 'Failed',
      trigger_manual: 'Manual',
      trigger_scheduler: 'Scheduled',
      trigger_startup: 'Startup',
      type_heartbeat_recent: 'Recent heartbeats',
      type_heartbeat_range: 'Range heartbeats',
      type_user_agents: 'User agents',
      step_load_user_agent_editor_map: 'Load local user agent editors',
      step_sync_date: 'Sync {date}',
      step_update_last_sync_state: 'Update last sync time',
      step_fetch_user_agents: 'Fetch remote user agents',
      step_load_existing_user_agent_editor_map: 'Load existing user agent editors',
      step_upsert_user_agents: 'Save user agents',
      step_backfill_missing_editors: 'Backfill missing editors',
      summary_heartbeat_window: '{start} to {end}',
      summary_heartbeat_counts: '{dates} days, {fetched} fetched, {inserted} new, {updated} updated',
      summary_user_agents: '{count} user agents, {backfilled} backfilled',
      started_at: 'Started {time}',
      duration: '{duration}',
      trigger: 'Trigger: {trigger}',
      error: 'Error: {error}',
      metric_pages: '{count} pages',
      metric_fetched: '{count} fetched',
      metric_inserted: '{count} new',
      metric_updated: '{count} updated',
      metric_total_user_agents: '{count} user agents',
      metric_backfilled_heartbeats: '{count} backfilled',
      metric_last_sync_at: 'last sync {time}',
    },
    weekday: {
      mon: 'Mon',
      tue: 'Tue',
      wed: 'Wed',
      thu: 'Thu',
      fri: 'Fri',
      sat: 'Sat',
      sun: 'Sun',
    },
     calendar: {
       title: 'Monthly Coding Calendar',
       prev_month: 'Previous month',
       next_month: 'Next month',
       today: 'Today',
      less: 'Less',
      more: 'More',
      selected_day: 'Selected Day',
      select_day: 'Select a day',
      click_date: 'Click a date to view breakdowns',
      no_activity: 'No coding activity',
      summary_minutes: '{minutes}',
      summary_heartbeats: '{heartbeats} heartbeats',
      no_language_activity: 'No language activity for this day.',
      no_project_activity: 'No project activity for this day.',
      hourly_distribution: '24h Distribution',
      hourly_select_day: 'Select a day',
      hourly_click_date: 'Click a date to view hourly activity',
      hourly_peak: 'Peak {hour}',
      hourly_no_activity: 'No hourly activity for this day.',
      hourly_loading: 'Loading hourly activity…',
      hourly_failed: 'Failed to load hourly activity.',
      hourly_minutes: '{minutes}',
      hourly_heartbeats: '{heartbeats} hb',
      loading_language: 'Loading language breakdown…',
      loading_project: 'Loading project breakdown…',
      failed_language: 'Failed to load language breakdown.',
      failed_project: 'Failed to load project breakdown.',
      load_error: 'Unable to load daily breakdown',
    },
    sections: {
      languages: 'Languages',
      projects: 'Projects',
    },
    ai: {
      title: 'AI Coding Activity',
      ai_line_changes: 'AI Line Changes',
      ai_share: 'AI Share',
      human_line_changes: 'Human Line Changes',
      total_line_changes: 'Total Line Changes',
      bar_label: 'AI vs Human Changes',
      legend_ai: 'AI',
      legend_human: 'Human',
    },
    details: {
      top_languages: 'Top Languages',
      top_projects: 'Top Projects',
      top_editors: 'Top Editors',
    },
    sync: {
      title: 'Sync Data',
      description: 'Manually trigger a sync to fetch heartbeats from WakaTime',
      user_agents: 'User Agents',
      from: 'From',
      to: 'To',
      run_range: 'Sync',
      syncing_user_agents: 'Refreshing...',
      syncing: 'Syncing...',
      syncing_range: 'Syncing...',
      invalid_range: 'Please choose both start and end dates.',
      user_agents_success: 'User agents refreshed: {count}, backfilled: {backfilled}',
      error_prefix: 'Error: {error}',
      stats_error: 'Stats error: {error}',
    },
    footer: {
      copy: 'WakaTime Sync Dashboard © 2025',
    },
  },
  zh: {
    doc: {
      home_title: 'WakaTime 活动面板',
      charts_title: 'WakaTime 图表面板',
      project_mappings_title: '项目映射',
      sync_history_title: '同步记录',
    },
    brand: {
      activity: '活动',
    },
    nav: {
      lang_switch_label: '语言切换',
    },
    page: {
      home: '首页',
      charts: '图表',
      project_mappings: '映射',
      sync_history: '同步记录',
      charts_title: '月度图表与排行',
      charts_description: '把语言、项目、AI 和排行面板放到独立页面查看。',
    },
    project_mappings: {
      eyebrow: '映射',
      title: '统一项目和编辑器名称',
      description: '把重命名后的文件夹和编辑器别名归并成稳定名称，图表和明细都会按映射后的结果聚合。',
      form_title: '新增或更新映射',
      list_title: '当前映射',
      source_label: '源项目',
      target_label: '目标项目',
      source_placeholder: '选择源项目',
      target_placeholder: '选择目标项目',
      save: '保存映射',
      saving: '保存中…',
      delete: '删除',
      empty: '暂时还没有项目映射。',
      count: '{count} 条映射',
      invalid: '请填写源项目和目标项目。',
      invalid_same: '源项目和目标项目不能相同。',
      saved: '映射已保存。',
      deleted: '映射已删除。',
      load_error: '项目映射加载失败。',
      options_error: '项目候选项加载失败。',
      save_error: '保存项目映射失败。',
      delete_error: '删除项目映射失败。',
    },
    editor_mappings: {
      form_title: '新增或更新映射',
      list_title: '当前映射',
      source_label: '源编辑器',
      target_label: '目标编辑器',
      source_placeholder: '选择源编辑器',
      target_placeholder: '选择目标编辑器',
      save: '保存映射',
      saving: '保存中…',
      delete: '删除',
      empty: '暂时还没有编辑器映射。',
      count: '{count} 条映射',
      invalid: '请填写源编辑器和目标编辑器。',
      invalid_same: '源编辑器和目标编辑器不能相同。',
      saved: '映射已保存。',
      deleted: '映射已删除。',
      load_error: '编辑器映射加载失败。',
      options_error: '编辑器候选项加载失败。',
      save_error: '保存编辑器映射失败。',
      delete_error: '删除编辑器映射失败。',
    },
    mobile: {
      sync: {
        title: '同步范围',
      },
      summary: {
        active: '活跃时长',
        best_day: '最佳日期',
        heartbeats: '心跳总数',
      },
    },
    hero: {
      title: '活动概览',
    },
    summary: {
      today: '今日',
      selected_month: '所选月份',
      best_prefix: '最佳：',
      total_heartbeats: '总心跳数',
      this_month: '本月',
      prev_month: '上月',
      prev_month_delta_up: '↑{delta} 较上月',
      prev_month_delta_down: '↓{delta} 较上月',
      prev_month_delta_same: '与上月持平',
    },
    common: {
      heartbeats: '心跳',
      to: '至',
      no_data: '暂无数据',
      unknown: '未知',
      error: '错误',
      confirm: '确定',
    },
    state: {
      synced: '已同步：{time}',
      never_synced: '尚未同步',
    },
    sync_history: {
      eyebrow: '同步记录',
      title: '最近同步',
      description: '记录每次同步，并展示每个步骤的耗时。',
      empty: '暂时还没有同步记录。',
      load_error: '同步记录加载失败。',
      running: '进行中',
      success: '成功',
      failed: '失败',
      trigger_manual: '手动',
      trigger_scheduler: '定时',
      trigger_startup: '启动预热',
      type_heartbeat_recent: '最近心跳同步',
      type_heartbeat_range: '区间心跳同步',
      type_user_agents: 'User Agent 同步',
      step_load_user_agent_editor_map: '加载本地 User Agent 编辑器映射',
      step_sync_date: '同步 {date}',
      step_update_last_sync_state: '更新最后同步时间',
      step_fetch_user_agents: '拉取远程 User Agent',
      step_load_existing_user_agent_editor_map: '加载现有 User Agent 编辑器映射',
      step_upsert_user_agents: '保存 User Agent',
      step_backfill_missing_editors: '回填缺失编辑器',
      summary_heartbeat_window: '{start} 至 {end}',
      summary_heartbeat_counts: '{dates} 天，拉取 {fetched}，新增 {inserted}，更新 {updated}',
      summary_user_agents: '{count} 个 User Agent，回填 {backfilled}',
      started_at: '开始于 {time}',
      duration: '{duration}',
      trigger: '触发方式：{trigger}',
      error: '错误：{error}',
      metric_pages: '{count} 页',
      metric_fetched: '拉取 {count}',
      metric_inserted: '新增 {count}',
      metric_updated: '更新 {count}',
      metric_total_user_agents: '{count} 个 User Agent',
      metric_backfilled_heartbeats: '回填 {count}',
      metric_last_sync_at: '最后同步 {time}',
    },
    weekday: {
      mon: '周一',
      tue: '周二',
      wed: '周三',
      thu: '周四',
      fri: '周五',
      sat: '周六',
      sun: '周日',
    },
     calendar: {
       title: '月度编码日历',
       prev_month: '上个月',
       next_month: '下个月',
       today: '回到今天',
      less: '少',
      more: '多',
      selected_day: '已选日期',
      select_day: '选择某一天',
      click_date: '点击日期查看统计',
      no_activity: '当天没有编码活动',
      summary_minutes: '{minutes}',
      summary_heartbeats: '{heartbeats} 条心跳',
      no_language_activity: '当天没有语言统计。',
      no_project_activity: '当天没有项目统计。',
      hourly_distribution: '24h 分布',
      hourly_select_day: '选择某一天',
      hourly_click_date: '点击日期查看逐小时活动',
      hourly_peak: '高峰 {hour}',
      hourly_no_activity: '当天没有逐小时活动。',
      hourly_loading: '正在加载逐小时活动…',
      hourly_failed: '逐小时活动加载失败。',
      hourly_minutes: '{minutes}',
      hourly_heartbeats: '{heartbeats} 条',
      loading_language: '正在加载语言统计…',
      loading_project: '正在加载项目统计…',
      failed_language: '语言统计加载失败。',
      failed_project: '项目统计加载失败。',
      load_error: '当天统计加载失败',
    },
    sections: {
      languages: '语言',
      projects: '项目',
    },
    ai: {
      title: 'AI 编码活动',
      ai_line_changes: 'AI 变更行数',
      ai_share: 'AI 占比',
      human_line_changes: '人工变更行数',
      total_line_changes: '总变更行数',
      bar_label: 'AI 与人工变更占比',
      legend_ai: 'AI',
      legend_human: '人工',
    },
    details: {
      top_languages: '常用语言',
      top_projects: '常用项目',
      top_editors: '常用编辑器',
    },
    sync: {
      title: '同步数据',
      description: '手动触发同步，从 WakaTime 获取心跳数据',
      user_agents: 'User Agents',
      from: '从',
      to: '到',
      run_range: '同步',
      syncing_user_agents: '刷新中…',
      syncing: '同步中…',
      syncing_range: '同步中…',
      invalid_range: '请选择开始和结束日期。',
      user_agents_success: 'User Agent 已刷新：{count}，回填心跳：{backfilled}',
      error_prefix: '错误：{error}',
      stats_error: '统计加载失败：{error}',
    },
    footer: {
      copy: 'WakaTime 同步面板 © 2025',
    },
  },
};

function getStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function detectLanguage() {
  const stored = getStoredLanguage();
  if (stored && SUPPORTED_LANGUAGES.has(stored)) {
    return stored;
  }

  const browserLanguage = (navigator.language || '').toLowerCase();
  return browserLanguage.startsWith('zh') ? 'zh' : 'en';
}

let currentLang = detectLanguage();

function localeForLanguage(lang = currentLang) {
  return lang === 'zh' ? 'zh-CN' : 'en-US';
}

function resolveMessage(lang, key) {
  const source = I18N[lang] || I18N.en;
  return key.split('.').reduce((acc, part) => (acc && part in acc ? acc[part] : null), source);
}

function t(key, vars = {}) {
  const template = resolveMessage(currentLang, key) || resolveMessage('en', key) || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

function setStoredLanguage(lang) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // ignore storage failures
  }
}

function applyTranslations() {
  document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
  document.title = pageType === 'charts'
    ? t('doc.charts_title')
    : pageType === 'project-mappings'
      ? t('doc.project_mappings_title')
      : pageType === 'sync-history'
        ? t('doc.sync_history_title')
        : t('doc.home_title');

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });

  if (langSwitchEl) {
    langSwitchEl.setAttribute('aria-label', t('nav.lang_switch_label'));
  }
  if (prevMonthBtn) {
    prevMonthBtn.setAttribute('aria-label', t('calendar.prev_month'));
  }
  if (nextMonthBtn) {
    nextMonthBtn.setAttribute('aria-label', t('calendar.next_month'));
  }

  [langEnBtn, langZhBtn].filter(Boolean).forEach((button) => {
    const active = button.dataset.lang === currentLang;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES.has(lang) || lang === currentLang) {
    return;
  }

  currentLang = lang;
  setStoredLanguage(lang);
  applyTranslations();
  if (pageType === 'project-mappings') {
    refreshProjectMappingSelects();
    refreshEditorMappingSelects();
  }
  renderSyncHistory(syncHistoryRuns);
  void loadState();
  if (pageType === 'project-mappings') {
    void loadProjectMappings();
    void loadEditorMappings();
  } else if (pageType !== 'sync-history') {
    void loadStats();
  }
}

function displayName(name) {
  return name || t('common.unknown');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeSeriesName(name) {
  return String(name || '')
    .trim()
    .toLowerCase();
}

function buildLanguageColorMap(rawMap) {
  const nextMap = { ...DEFAULT_LANGUAGE_COLOR_MAP };
  for (const [name, meta] of Object.entries(rawMap || {})) {
    const normalized = normalizeSeriesName(name);
    const color = typeof meta === 'string' ? meta : meta?.color;
    if (!normalized || typeof color !== 'string' || !color.startsWith('#')) {
      continue;
    }
    nextMap[normalized] = color;
  }
  return nextMap;
}

async function ensureLanguageColorsLoaded() {
  if (!languageColorsPromise) {
    languageColorsPromise = fetchJson('/assets/github-colors.json')
      .then((data) => {
        languageColorMap = buildLanguageColorMap(data);
      })
      .catch(() => {
        languageColorMap = { ...DEFAULT_LANGUAGE_COLOR_MAP };
      });
  }

  await languageColorsPromise;
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function fallbackColor(name, scope = 'generic', offset = 0) {
  const paletteIndex = (hashString(`${scope}:${normalizeSeriesName(name)}`) + offset) % COLORS.length;
  return COLORS[paletteIndex];
}

function seriesColor(name, scope = 'generic', offset = 0) {
  if (scope === 'language') {
    const mapped = languageColorMap[normalizeSeriesName(name)];
    if (mapped) {
      return mapped;
    }
  }
  return fallbackColor(name, scope, offset);
}

function fmtMinutes(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function fmtDurationSeconds(seconds) {
  if (!seconds || seconds <= 0) return '0m';
  if (seconds < 60) return `${seconds}s`;
  return fmtMinutes(seconds / 60);
}

function fmtNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function timezoneParts(date = new Date(), options = {}) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

function appToday() {
  const parts = timezoneParts();
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIsoDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function monthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function shiftMonth(date, offset) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function monthLabel(date) {
  return date.toLocaleDateString(localeForLanguage(), { month: 'long', year: 'numeric', timeZone: APP_TIMEZONE });
}

function shortDateLabel(dateString) {
  return fromIsoDate(dateString).toLocaleDateString(localeForLanguage(), { month: 'short', day: 'numeric', timeZone: APP_TIMEZONE });
}

function fullDateLabel(dateString) {
  return fromIsoDate(dateString).toLocaleDateString(localeForLanguage(), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: APP_TIMEZONE,
  });
}

function monthRange(date) {
  return {
    start: toIsoDate(monthStart(date)),
    end: toIsoDate(monthEnd(date)),
  };
}

function isIsoDateInRange(dateString, startIso, endIso) {
  const dateTime = fromIsoDate(dateString).getTime();
  return dateTime >= fromIsoDate(startIso).getTime() && dateTime <= fromIsoDate(endIso).getTime();
}

function syncRangeDefaults() {
  const today = appToday();
  const start = new Date(today);
  const isMonday = today.getDay() === 1;
  start.setDate(today.getDate() - (isMonday ? 3 : 1));
  return {
    start: toIsoDate(start),
    end: toIsoDate(today),
  };
}

function calendarLevel(minutes, maxMinutes) {
  if (!minutes || minutes <= 0 || maxMinutes <= 0) return 0;
  const ratio = minutes / maxMinutes;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
}

async function fetchJson(url, options = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function loadHealth() {
  if (!versionEl) {
    return;
  }
  try {
    const data = await fetchJson('/api/health');
    versionEl.textContent = `v${data.version}`;
  } catch {
    versionEl.textContent = t('common.error');
  }
}

async function loadState() {
  if (!lastSyncEl) {
    return;
  }
  try {
    const data = await fetchJson('/api/sync/state');
    const last = data.last_sync_at;
    if (last && last !== 'never') {
      const d = new Date(last);
      lastSyncEl.textContent = t('state.synced', { time: d.toLocaleString(localeForLanguage(), { timeZone: APP_TIMEZONE }) });
    } else {
      lastSyncEl.textContent = t('state.never_synced');
    }
  } catch {
    lastSyncEl.textContent = t('common.error');
  }
}

function formatSyncTimestamp(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  return date.toLocaleString(localeForLanguage(), { timeZone: APP_TIMEZONE });
}

function formatDurationMs(value) {
  const ms = Number(value || 0);
  if (!ms) {
    return '—';
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 1 : 2)} s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m ${remainSeconds.toFixed(remainSeconds >= 10 ? 0 : 1)}s`;
}

function syncHistoryTypeLabel(syncType) {
  return t(`sync_history.type_${syncType}`);
}

function syncHistoryStatusLabel(status) {
  return t(`sync_history.${status}`);
}

function syncHistoryTriggerLabel(triggerSource) {
  return t(`sync_history.trigger_${triggerSource}`);
}

function syncHistoryStepLabel(step) {
  const vars = step?.details && typeof step.details === 'object' ? step.details : {};
  return t(`sync_history.step_${step.step_key}`, vars);
}

function syncHistoryMetricText(key, value) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (key === 'last_sync_at') {
    return t('sync_history.metric_last_sync_at', { time: formatSyncTimestamp(value) });
  }
  return t(`sync_history.metric_${key}`, { count: fmtNumber(value) });
}

function syncHistorySummaryLines(run) {
  const summary = run?.summary && typeof run.summary === 'object' ? run.summary : {};
  if (run.sync_type === 'user_agents') {
    return [t('sync_history.summary_user_agents', {
      count: fmtNumber(summary.total_user_agents || 0),
      backfilled: fmtNumber(summary.backfilled_heartbeats || 0),
    })];
  }

  const start = summary.start_date || '—';
  const end = summary.end_date || start;
  return [
    t('sync_history.summary_heartbeat_window', { start, end }),
    t('sync_history.summary_heartbeat_counts', {
      dates: fmtNumber(summary.date_count || 0),
      fetched: fmtNumber(summary.fetched || 0),
      inserted: fmtNumber(summary.inserted || 0),
      updated: fmtNumber(summary.updated || 0),
    }),
  ];
}

function renderSyncHistory(runs) {
  if (!syncHistoryListEl) {
    return;
  }

  syncHistoryRuns = Array.isArray(runs) ? runs : [];
  if (!syncHistoryRuns.length) {
    syncHistoryListEl.innerHTML = `<div class="calendar-hover-empty">${t('sync_history.empty')}</div>`;
    return;
  }

  syncHistoryListEl.innerHTML = syncHistoryRuns.map((run, index) => {
    const summaryLines = syncHistorySummaryLines(run)
      .map((line) => `<div class="sync-history-summary-line">${escapeHtml(line)}</div>`)
      .join('');
    const stepItems = Array.isArray(run.steps) ? run.steps.map((step) => {
      const details = step?.details && typeof step.details === 'object' ? step.details : {};
      const detailKeys = ['pages', 'fetched', 'inserted', 'updated', 'total_user_agents', 'backfilled_heartbeats', 'last_sync_at'];
      const metrics = detailKeys
        .map((key) => syncHistoryMetricText(key, details[key]))
        .filter(Boolean)
        .map((text) => `<span class="sync-history-step-metric">${escapeHtml(text)}</span>`)
        .join('');
      const errorHtml = step.error_message
        ? `<div class="sync-history-run-error">${escapeHtml(t('sync_history.error', { error: step.error_message }))}</div>`
        : '';
      return `
        <div class="sync-history-step-row">
          <div class="sync-history-step-top">
            <span class="sync-history-step-name">${escapeHtml(syncHistoryStepLabel(step))}</span>
            <span class="sync-history-step-duration">${escapeHtml(formatDurationMs(step.duration_ms))}</span>
          </div>
          <div class="sync-history-step-meta">${metrics}</div>
          ${errorHtml}
        </div>
      `;
    }).join('') : '';

    const errorHtml = run.error_message
      ? `<div class="sync-history-run-error">${escapeHtml(t('sync_history.error', { error: run.error_message }))}</div>`
      : '';

    return `
      <details class="sync-history-run" ${index === 0 ? 'open' : ''}>
        <summary class="sync-history-run-summary">
          <div class="sync-history-run-main">
            <div class="sync-history-run-title-row">
              <span class="sync-history-run-title">${escapeHtml(syncHistoryTypeLabel(run.sync_type))}</span>
              <span class="sync-history-run-status is-${escapeHtml(run.status)}">${escapeHtml(syncHistoryStatusLabel(run.status))}</span>
            </div>
            <div class="sync-history-run-meta">
              <span>${escapeHtml(t('sync_history.started_at', { time: formatSyncTimestamp(run.started_at) }))}</span>
              <span>${escapeHtml(t('sync_history.trigger', { trigger: syncHistoryTriggerLabel(run.trigger_source) }))}</span>
              <span>${escapeHtml(t('sync_history.duration', { duration: formatDurationMs(run.duration_ms) }))}</span>
            </div>
            <div class="sync-history-summary">${summaryLines}</div>
          </div>
        </summary>
        <div class="sync-history-run-body">
          ${errorHtml}
          <div class="sync-history-steps">${stepItems}</div>
        </div>
      </details>
    `;
  }).join('');
}

async function loadSyncHistory() {
  if (!syncHistoryListEl) {
    return;
  }

  try {
    const data = await fetchJson('/api/sync/history?limit=12');
    renderSyncHistory(data.runs || []);
  } catch {
    syncHistoryRuns = [];
    syncHistoryListEl.innerHTML = `<div class="calendar-hover-empty">${t('sync_history.load_error')}</div>`;
  }
}

function ensureSyncRangeDefaults() {
  if (!syncStartDateEl || !syncEndDateEl) {
    return;
  }

  if (!syncStartDateEl.value || !syncEndDateEl.value) {
    const defaults = syncRangeDefaults();
    syncStartDateEl.value = syncStartDateEl.value || defaults.start;
    syncEndDateEl.value = syncEndDateEl.value || defaults.end;
  }
}

function setSyncLoadingState(isLoading, rangeMode = false) {
  if (!syncRangeBtn || !syncUserAgentsBtn || !syncStartDateEl || !syncEndDateEl) {
    return;
  }

  syncRangeBtn.disabled = isLoading;
  syncUserAgentsBtn.disabled = isLoading;
  syncStartDateEl.disabled = isLoading;
  syncEndDateEl.disabled = isLoading;

  if (isLoading) {
    syncRangeBtn.dataset.originalHtml = syncRangeBtn.dataset.originalHtml || syncRangeBtn.innerHTML;
    syncRangeBtn.textContent = rangeMode ? t('sync.syncing_range') : t('sync.run_range');
    return;
  }

  if (syncRangeBtn.dataset.originalHtml) {
    syncRangeBtn.innerHTML = syncRangeBtn.dataset.originalHtml;
  }
}

function setUserAgentRefreshLoadingState(isLoading) {
  if (!syncUserAgentsBtn || !syncRangeBtn || !syncStartDateEl || !syncEndDateEl) {
    return;
  }

  syncUserAgentsBtn.disabled = isLoading;
  syncRangeBtn.disabled = isLoading;
  syncStartDateEl.disabled = isLoading;
  syncEndDateEl.disabled = isLoading;

  if (isLoading) {
    syncUserAgentsBtn.dataset.originalHtml = syncUserAgentsBtn.dataset.originalHtml || syncUserAgentsBtn.innerHTML;
    syncUserAgentsBtn.textContent = t('sync.syncing_user_agents');
    return;
  }

  if (syncUserAgentsBtn.dataset.originalHtml) {
    syncUserAgentsBtn.innerHTML = syncUserAgentsBtn.dataset.originalHtml;
  }
}

async function runSyncRange() {
  ensureSyncRangeDefaults();

  const start = syncStartDateEl?.value || '';
  const end = syncEndDateEl?.value || '';
  if (!start || !end) {
    alert(t('sync.invalid_range'));
    return;
  }

  setSyncLoadingState(true, true);

  try {
    const params = new URLSearchParams({ start, end });
    await fetchJson(`/api/sync/range?${params.toString()}`, { method: 'POST' });
    dailyBreakdownCache.clear();
    await loadState();
    await loadSyncHistory();
    if (pageType !== 'sync-history') {
      await loadStats();
    }
  } catch (err) {
    alert(t('sync.error_prefix', { error: err }));
  } finally {
    setSyncLoadingState(false);
  }
}

async function runUserAgentRefresh() {
  setUserAgentRefreshLoadingState(true);

  try {
    const result = await fetchJson('/api/sync/user-agents', { method: 'POST' });
    dailyBreakdownCache.clear();
    await loadSyncHistory();
    if (pageType !== 'project-mappings' && pageType !== 'sync-history') {
      await loadStats();
    }
    alert(t('sync.user_agents_success', {
      count: result.total_user_agents,
      backfilled: result.backfilled_heartbeats,
    }));
  } catch (err) {
    alert(t('sync.error_prefix', { error: err }));
  } finally {
    setUserAgentRefreshLoadingState(false);
  }
}

function setProjectMappingFeedback(messageKey = '', type = '') {
  if (!projectMappingFeedbackEl) {
    return;
  }
  projectMappingFeedbackEl.textContent = messageKey ? t(messageKey) : '';
  projectMappingFeedbackEl.dataset.state = type;
}

function setProjectMappingLoadingState(isLoading) {
  if (!projectMappingSubmitEl || !projectMappingSourceEl || !projectMappingTargetEl) {
    return;
  }
  projectMappingSubmitEl.disabled = isLoading;
  projectMappingSourceEl.disabled = isLoading;
  projectMappingTargetEl.disabled = isLoading;
  if (isLoading) {
    projectMappingSubmitEl.dataset.originalHtml = projectMappingSubmitEl.dataset.originalHtml || projectMappingSubmitEl.innerHTML;
    projectMappingSubmitEl.textContent = t('project_mappings.saving');
    return;
  }
  if (projectMappingSubmitEl.dataset.originalHtml) {
    projectMappingSubmitEl.innerHTML = projectMappingSubmitEl.dataset.originalHtml;
    delete projectMappingSubmitEl.dataset.originalHtml;
  }
}

function setEditorMappingFeedback(messageKey = '', type = '') {
  if (!editorMappingFeedbackEl) {
    return;
  }
  editorMappingFeedbackEl.textContent = messageKey ? t(messageKey) : '';
  editorMappingFeedbackEl.dataset.state = type;
}

function setEditorMappingLoadingState(isLoading) {
  if (!editorMappingSubmitEl || !editorMappingSourceEl || !editorMappingTargetEl) {
    return;
  }
  editorMappingSubmitEl.disabled = isLoading;
  editorMappingSourceEl.disabled = isLoading;
  editorMappingTargetEl.disabled = isLoading;
  if (isLoading) {
    editorMappingSubmitEl.dataset.originalHtml = editorMappingSubmitEl.dataset.originalHtml || editorMappingSubmitEl.innerHTML;
    editorMappingSubmitEl.textContent = t('editor_mappings.saving');
    return;
  }
  if (editorMappingSubmitEl.dataset.originalHtml) {
    editorMappingSubmitEl.innerHTML = editorMappingSubmitEl.dataset.originalHtml;
    delete editorMappingSubmitEl.dataset.originalHtml;
  }
}

function updateSelectOptions(selectEl, options, placeholder, preserveValue = '', getOptionMeta = null) {
  if (!selectEl) {
    return;
  }

  const safeOptions = Array.isArray(options) ? options : [];
  const desiredValue = preserveValue || selectEl.value || '';
  const optionHtml = safeOptions.map((item) => {
    const name = item?.name || '';
    const count = Number(item?.count || 0);
    const meta = typeof getOptionMeta === 'function' ? getOptionMeta(item) : null;
    const mutedStyle = meta?.muted ? ' style="color: #6e7781;"' : '';
    return `<option value="${escapeHtml(name)}"${mutedStyle}>${escapeHtml(`${name} (${fmtNumber(count)})`)}</option>`;
  }).join('');

  selectEl.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${optionHtml}`;
  selectEl.value = safeOptions.some((item) => item?.name === desiredValue) ? desiredValue : '';
}

function refreshProjectMappingSelects() {
  updateSelectOptions(
    projectMappingSourceEl,
    projectMappingOptions,
    t('project_mappings.source_placeholder'),
  );
  updateSelectOptions(
    projectMappingTargetEl,
    projectMappingOptions,
    t('project_mappings.target_placeholder'),
  );
}

function refreshEditorMappingSelects() {
  updateSelectOptions(
    editorMappingSourceEl,
    editorMappingOptions,
    t('editor_mappings.source_placeholder'),
    '',
    (item) => ({ muted: mappedEditorSources.has(item?.name || '') }),
  );
  updateSelectOptions(
    editorMappingTargetEl,
    editorMappingOptions,
    t('editor_mappings.target_placeholder'),
    '',
    (item) => ({ muted: mappedEditorSources.has(item?.name || '') }),
  );
}

function renderProjectMappings(mappings) {
  if (!projectMappingListEl) {
    return;
  }

  const safeMappings = Array.isArray(mappings) ? mappings : [];
  if (projectMappingCountEl) {
    projectMappingCountEl.textContent = t('project_mappings.count', { count: safeMappings.length });
  }

  if (!safeMappings.length) {
    projectMappingListEl.innerHTML = `<div class="calendar-hover-empty">${t('project_mappings.empty')}</div>`;
    return;
  }

  projectMappingListEl.innerHTML = safeMappings.map((item) => `
    <div class="project-mapping-row">
      <div class="project-mapping-row-copy">
        <div class="project-mapping-source">${escapeHtml(item.source_project)}</div>
        <div class="project-mapping-arrow" aria-hidden="true">→</div>
        <div class="project-mapping-target">${escapeHtml(item.target_project)}</div>
      </div>
      <div class="project-mapping-row-actions">
        <button
          class="nav-sync-btn secondary small"
          type="button"
          data-action="delete-project-mapping"
          data-source-project="${escapeHtml(item.source_project)}"
        >${t('project_mappings.delete')}</button>
      </div>
    </div>
  `).join('');
}

async function loadProjectMappings() {
  if (!projectMappingListEl) {
    return;
  }

  try {
    const data = await fetchJson('/api/project-mappings');
    renderProjectMappings(data.mappings || []);
  } catch {
    if (projectMappingCountEl) {
      projectMappingCountEl.textContent = '—';
    }
    projectMappingListEl.innerHTML = `<div class="calendar-hover-empty">${t('project_mappings.load_error')}</div>`;
  }
}

async function loadProjectMappingOptions() {
  if (!projectMappingSourceEl || !projectMappingTargetEl) {
    return;
  }

  try {
    const data = await fetchJson('/api/project-options');
    projectMappingOptions = Array.isArray(data.options) ? data.options : [];
    refreshProjectMappingSelects();
  } catch {
    projectMappingOptions = [];
    refreshProjectMappingSelects();
    setProjectMappingFeedback('project_mappings.options_error', 'error');
  }
}

function renderEditorMappings(mappings) {
  if (!editorMappingListEl) {
    return;
  }

  const safeMappings = Array.isArray(mappings) ? mappings : [];
  if (editorMappingCountEl) {
    editorMappingCountEl.textContent = t('editor_mappings.count', { count: safeMappings.length });
  }

  if (!safeMappings.length) {
    editorMappingListEl.innerHTML = `<div class="calendar-hover-empty">${t('editor_mappings.empty')}</div>`;
    return;
  }

  editorMappingListEl.innerHTML = safeMappings.map((item) => `
    <div class="project-mapping-row">
      <div class="project-mapping-row-copy">
        <div class="project-mapping-source">${escapeHtml(item.source_editor)}</div>
        <div class="project-mapping-arrow" aria-hidden="true">→</div>
        <div class="project-mapping-target">${escapeHtml(item.target_editor)}</div>
      </div>
      <div class="project-mapping-row-actions">
        <button
          class="nav-sync-btn secondary small"
          type="button"
          data-action="delete-editor-mapping"
          data-source-editor="${escapeHtml(item.source_editor)}"
        >${t('editor_mappings.delete')}</button>
      </div>
    </div>
  `).join('');
}

async function loadEditorMappings() {
  if (!editorMappingListEl) {
    return;
  }

  try {
    const data = await fetchJson('/api/editor-mappings');
    const safeMappings = Array.isArray(data.mappings) ? data.mappings : [];
    mappedEditorSources = new Set(safeMappings.map((item) => item?.source_editor || '').filter(Boolean));
    refreshEditorMappingSelects();
    renderEditorMappings(safeMappings);
  } catch {
    mappedEditorSources = new Set();
    refreshEditorMappingSelects();
    if (editorMappingCountEl) {
      editorMappingCountEl.textContent = '—';
    }
    editorMappingListEl.innerHTML = `<div class="calendar-hover-empty">${t('editor_mappings.load_error')}</div>`;
  }
}

async function loadEditorMappingOptions() {
  if (!editorMappingSourceEl || !editorMappingTargetEl) {
    return;
  }

  try {
    const data = await fetchJson('/api/editor-options');
    editorMappingOptions = Array.isArray(data.options) ? data.options : [];
    refreshEditorMappingSelects();
  } catch {
    editorMappingOptions = [];
    refreshEditorMappingSelects();
    setEditorMappingFeedback('editor_mappings.options_error', 'error');
  }
}

async function saveProjectMapping(event) {
  event.preventDefault();

  const sourceProject = projectMappingSourceEl?.value?.trim() || '';
  const targetProject = projectMappingTargetEl?.value?.trim() || '';
  if (!sourceProject || !targetProject) {
    setProjectMappingFeedback('project_mappings.invalid', 'error');
    return;
  }
  if (sourceProject === targetProject) {
    setProjectMappingFeedback('project_mappings.invalid_same', 'error');
    return;
  }

  setProjectMappingFeedback('', '');
  setProjectMappingLoadingState(true);

  try {
    const data = await fetchJson('/api/project-mappings', {
      method: 'POST',
      body: JSON.stringify({
        source_project: sourceProject,
        target_project: targetProject,
      }),
    });
    renderProjectMappings(data.mappings || []);
    if (projectMappingFormEl) {
      projectMappingFormEl.reset();
    }
    refreshProjectMappingSelects();
    setProjectMappingFeedback('project_mappings.saved', 'success');
  } catch {
    setProjectMappingFeedback('project_mappings.save_error', 'error');
  } finally {
    setProjectMappingLoadingState(false);
  }
}

async function saveEditorMapping(event) {
  event.preventDefault();

  const sourceEditor = editorMappingSourceEl?.value?.trim() || '';
  const targetEditor = editorMappingTargetEl?.value?.trim() || '';
  if (!sourceEditor || !targetEditor) {
    setEditorMappingFeedback('editor_mappings.invalid', 'error');
    return;
  }
  if (sourceEditor === targetEditor) {
    setEditorMappingFeedback('editor_mappings.invalid_same', 'error');
    return;
  }

  setEditorMappingFeedback('', '');
  setEditorMappingLoadingState(true);

  try {
    const data = await fetchJson('/api/editor-mappings', {
      method: 'POST',
      body: JSON.stringify({
        source_editor: sourceEditor,
        target_editor: targetEditor,
      }),
    });
    renderEditorMappings(data.mappings || []);
    if (editorMappingFormEl) {
      editorMappingFormEl.reset();
    }
    refreshEditorMappingSelects();
    setEditorMappingFeedback('editor_mappings.saved', 'success');
  } catch {
    setEditorMappingFeedback('editor_mappings.save_error', 'error');
  } finally {
    setEditorMappingLoadingState(false);
  }
}

async function deleteProjectMapping(sourceProject) {
  try {
    const data = await fetchJson(`/api/project-mappings/${encodeURIComponent(sourceProject)}`, {
      method: 'DELETE',
    });
    renderProjectMappings(data.mappings || []);
    refreshProjectMappingSelects();
    setProjectMappingFeedback('project_mappings.deleted', 'success');
  } catch {
    setProjectMappingFeedback('project_mappings.delete_error', 'error');
  }
}

async function deleteEditorMapping(sourceEditor) {
  try {
    const data = await fetchJson(`/api/editor-mappings/${encodeURIComponent(sourceEditor)}`, {
      method: 'DELETE',
    });
    renderEditorMappings(data.mappings || []);
    refreshEditorMappingSelects();
    setEditorMappingFeedback('editor_mappings.deleted', 'success');
  } catch {
    setEditorMappingFeedback('editor_mappings.delete_error', 'error');
  }
}

function renderDetailList(el, items, scope = 'generic', colorOffset = 0) {
  if (!el) {
    return;
  }
  if (!items || !items.length) {
    el.innerHTML = `<div class="detail-item"><span class="detail-name">${t('common.no_data')}</span></div>`;
    return;
  }

  const maxMinutes = Math.max(...items.map((item) => item.active_minutes || 0));

  el.innerHTML = items.map((item, idx) => {
    const pct = maxMinutes > 0 ? ((item.active_minutes || 0) / maxMinutes) * 100 : 0;
    const color = seriesColor(item.name, scope, colorOffset + idx);
    return `
      <div class="detail-item">
        <span class="detail-name">${displayName(item.name)}</span>
        <div class="detail-bar">
          <div class="detail-bar-fill" style="width: ${pct}%; background: ${color}"></div>
        </div>
        <span class="detail-time">${fmtMinutes(item.active_minutes)}</span>
      </div>
    `;
  }).join('');
}

function renderLegend(containerId, items, scope = 'generic', colorOffset = 0) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items || !items.length) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = items.slice(0, 5).map((item, idx) => {
    const color = seriesColor(item.name, scope, colorOffset + idx);
    return `
      <div class="legend-item">
        <span class="legend-color" style="background: ${color}"></span>
        <span>${displayName(item.name)}</span>
      </div>
    `;
  }).join('');
}

function renderCalendarSummary(minutes, heartbeats) {
  if (!calendarHoverSummaryEl) {
    return;
  }
  if (heartbeats > 0) {
    calendarHoverSummaryEl.innerHTML = `
      <span>${t('calendar.summary_minutes', { minutes: fmtMinutes(minutes) })}</span>
      <span>${t('calendar.summary_heartbeats', { heartbeats: fmtNumber(heartbeats) })}</span>
    `;
    return;
  }

  calendarHoverSummaryEl.textContent = t('calendar.no_activity');
}

function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function formatHourMinuteLabel(hour, secondOffset = 0) {
  const safeOffset = clampHourlySecond(secondOffset, SECONDS_PER_HOUR - 1);
  const minute = Math.floor(safeOffset / 60);
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function clampHourlySecond(secondOffset, max = SECONDS_PER_HOUR) {
  return Math.max(0, Math.min(max, Math.floor(secondOffset || 0)));
}

function formatHourlySegmentLabel(segment, hour, startSecond, endSecond) {
  return [
    displayName(segment.name),
    fmtDurationSeconds(segment.active_seconds || 0),
    `${formatHourMinuteLabel(hour, startSecond)}-${formatHourMinuteLabel(hour, endSecond)}`,
  ].join(' · ');
}

function renderHourlySegments(segments, hour) {
  return segments.map((segment) => {
    const startSecond = clampHourlySecond(segment.start_second);
    const endSecond = clampHourlySecond(segment.end_second, SECONDS_PER_HOUR);
    const segmentLeft = (startSecond / SECONDS_PER_HOUR) * 100;
    const segmentWidth = ((endSecond - startSecond) / SECONDS_PER_HOUR) * 100;
    const segmentLabel = formatHourlySegmentLabel(segment, hour, startSecond, endSecond);
    return `
      <span
        class="calendar-hourly-segment"
        style="left: ${segmentLeft}%; width: ${segmentWidth}%; background: ${seriesColor(segment.name, 'editor')};"
        title="${escapeHtml(segmentLabel)}"
      ></span>
    `;
  }).join('');
}

function renderHourlyFill(totalSeconds) {
  if (totalSeconds <= 0) {
    return '';
  }

  return `<div class="calendar-hourly-fill" style="width: ${(totalSeconds / SECONDS_PER_HOUR) * 100}%;"></div>`;
}

function renderHourlySummary(totalMinutes, peakHour) {
  if (!calendarHourlySummaryEl) {
    return;
  }

  if (!totalMinutes) {
    calendarHourlySummaryEl.textContent = t('calendar.hourly_no_activity');
    return;
  }

  calendarHourlySummaryEl.innerHTML = `
    <span>${t('calendar.summary_minutes', { minutes: fmtMinutes(totalMinutes) })}</span>
    <span class="calendar-hourly-summary-sep">·</span>
    <span>${t('calendar.hourly_peak', { hour: formatHourLabel(peakHour ?? 0) })}</span>
  `;
}

function renderHourlyDistribution(hours, emptyMessage) {
  if (!calendarHourlyListEl) {
    return;
  }

  const activeHours = (hours || []).filter((item) => (item.active_seconds || 0) > 0 || (item.heartbeats || 0) > 0);
  if (!activeHours.length) {
    calendarHourlyListEl.innerHTML = `<div class="calendar-hover-empty">${emptyMessage}</div>`;
    return;
  }

  calendarHourlyListEl.innerHTML = (hours || []).map((item) => {
    const totalSeconds = item.active_seconds || 0;
    const segments = (item.segments || []).filter((segment) => (
      (segment.active_seconds || 0) > 0
      && Number.isFinite(segment.start_second)
      && Number.isFinite(segment.end_second)
      && (segment.end_second || 0) > (segment.start_second || 0)
    ));
    const fillMarkup = segments.length ? renderHourlySegments(segments, item.hour) : renderHourlyFill(totalSeconds);
    return `
      <div class="calendar-hourly-row">
        <div class="calendar-hourly-label">${formatHourLabel(item.hour)}</div>
        <div class="calendar-hourly-bar">
          ${fillMarkup}
        </div>
        <div class="calendar-hourly-meta">
          <span>${t('calendar.hourly_minutes', { minutes: fmtMinutes(item.active_minutes || 0) })}</span>
          <span>${t('calendar.hourly_heartbeats', { heartbeats: fmtNumber(item.heartbeats || 0) })}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderHoverBreakdown(el, items, scope, colorOffset, emptyMessage) {
  if (!el) {
    return;
  }
  if (!items || !items.length) {
    el.innerHTML = `<div class="calendar-hover-empty">${emptyMessage}</div>`;
    return;
  }

  const maxMinutes = Math.max(...items.map((item) => item.active_minutes || 0), 0);
  el.innerHTML = items.map((item, idx) => {
    const pct = maxMinutes > 0 ? ((item.active_minutes || 0) / maxMinutes) * 100 : 0;
    const color = seriesColor(item.name, scope, colorOffset + idx);
    return `
      <div class="calendar-hover-row">
        <div class="calendar-hover-meta">
          <div class="calendar-hover-name">${displayName(item.name)}</div>
          <div class="calendar-hover-bar">
            <div class="calendar-hover-fill" style="width: ${pct}%; background: ${color}"></div>
          </div>
        </div>
        <div class="calendar-hover-value">${fmtMinutes(item.active_minutes)}</div>
      </div>
    `;
  }).join('');
}

function setActiveCalendarCell(dateString) {
  if (!dailyCalendarGridEl) {
    return;
  }
  dailyCalendarGridEl
    .querySelectorAll('.calendar-cell.is-active')
    .forEach((cell) => cell.classList.remove('is-active'));

  if (!dateString) {
    return;
  }

  const cell = dailyCalendarGridEl.querySelector(`.calendar-cell[data-date="${dateString}"]`);
  if (cell) {
    cell.classList.add('is-active');
  }
}

function renderSelectedDayPanel(dateString, minutes, heartbeats, languages, projects, hourly) {
  if (!calendarSidePanelEl || !calendarHoverTitleEl) {
    return;
  }
  currentSelectedDate = dateString;
  setActiveCalendarCell(dateString);
  calendarSidePanelEl.classList.toggle('is-empty', heartbeats <= 0);
  if (calendarHourlyPanelEl) {
    calendarHourlyPanelEl.classList.toggle('is-empty', heartbeats <= 0);
  }
  calendarHoverTitleEl.textContent = fullDateLabel(dateString);
  renderCalendarSummary(minutes, heartbeats);
  renderHoverBreakdown(calendarHoverLanguagesEl, languages, 'language', 0, t('calendar.no_language_activity'));
  renderHoverBreakdown(calendarHoverProjectsEl, projects, 'project', 2, t('calendar.no_project_activity'));

  renderHourlySummary(
    hourly?.total_active_minutes || 0,
    typeof hourly?.peak_hour === 'number' ? hourly.peak_hour : null,
  );
  renderHourlyDistribution(hourly?.hours || [], t('calendar.hourly_no_activity'));
}

function renderSelectedDayLoading(dateString, minutes, heartbeats) {
  if (!calendarSidePanelEl || !calendarHoverTitleEl) {
    return false;
  }
  currentSelectedDate = dateString;
  setActiveCalendarCell(dateString);
  calendarSidePanelEl.classList.toggle('is-empty', heartbeats <= 0);
  if (calendarHourlyPanelEl) {
    calendarHourlyPanelEl.classList.toggle('is-empty', heartbeats <= 0);
  }
  calendarHoverTitleEl.textContent = fullDateLabel(dateString);
  renderCalendarSummary(minutes, heartbeats);
  if (heartbeats > 0) {
    calendarHoverLanguagesEl.innerHTML = `<div class="calendar-hover-empty">${t('calendar.loading_language')}</div>`;
    calendarHoverProjectsEl.innerHTML = `<div class="calendar-hover-empty">${t('calendar.loading_project')}</div>`;
    if (calendarHourlySummaryEl) {
      calendarHourlySummaryEl.textContent = t('calendar.hourly_loading');
    }
    renderHourlyDistribution([], t('calendar.hourly_loading'));
    return true;
  }

  renderHoverBreakdown(calendarHoverLanguagesEl, [], 'language', 0, t('calendar.no_language_activity'));
  renderHoverBreakdown(calendarHoverProjectsEl, [], 'project', 2, t('calendar.no_project_activity'));
  renderHourlySummary(0, null);
  renderHourlyDistribution([], t('calendar.hourly_no_activity'));
  return false;
}

function buildCalendarSkeleton(month) {
  const firstDay = monthStart(month);
  const lastDay = monthEnd(month);
  const cells = [];
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < leadingEmptyCells; i += 1) {
    cells.push('<div class="calendar-cell is-empty" aria-hidden="true"></div>');
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const iso = toIsoDate(date);
    cells.push(`
      <button
        type="button"
        class="calendar-cell is-loading level-0 no-activity"
        data-date="${iso}"
        data-minutes="0"
        data-heartbeats="0"
        title="${iso}"
        aria-label="${iso}"
      >
        <span class="calendar-day">${day}</span>
        <span class="calendar-duration">--</span>
        <span class="calendar-heartbeats">--</span>
      </button>
    `);
  }

  while (cells.length % 7 !== 0) {
    cells.push('<div class="calendar-cell is-empty" aria-hidden="true"></div>');
  }

  return cells.join('');
}

function renderCalendarSkeleton(month) {
  if (!dailyCalendarGridEl || !calendarMonthLabelEl) {
    if (calendarMonthLabelEl) {
      calendarMonthLabelEl.textContent = monthLabel(month);
    }
    return;
  }

  calendarMonthLabelEl.textContent = monthLabel(month);
  dailyCalendarGridEl.innerHTML = buildCalendarSkeleton(month);
}

function resolveSelectedCalendarDate(daily) {
  const { start, end } = monthRange(currentMonth);
  if (currentSelectedDate && isIsoDateInRange(currentSelectedDate, start, end)) {
    return currentSelectedDate;
  }

  const todayIso = toIsoDate(appToday());
  if (isIsoDateInRange(todayIso, start, end)) {
    return todayIso;
  }

  const activeDays = (daily.days || []).filter((day) => (day.heartbeats || 0) > 0);
  if (activeDays.length > 0) {
    return activeDays[activeDays.length - 1].date;
  }

  return start;
}

async function selectCalendarDay(dateString, minutes, heartbeats) {
  if (!dateString) {
    return;
  }

  const shouldFetch = renderSelectedDayLoading(dateString, minutes, heartbeats);
  renderPrevMonthCard(dateString);
  if (!shouldFetch) {
    return;
  }

  const cached = dailyBreakdownCache.get(dateString);
  if (cached) {
    renderSelectedDayPanel(dateString, minutes, heartbeats, cached.languages, cached.projects, cached.hourly);
    return;
  }

  const requestToken = ++previewRequestToken;

  try {
    const [languages, projects, hourly] = await Promise.all([
      fetchJson(`/api/stats/breakdown?by=language&limit=5&start=${dateString}&end=${dateString}`),
      fetchJson(`/api/stats/breakdown?by=project&limit=5&start=${dateString}&end=${dateString}`),
      fetchJson(`/api/stats/hourly?start=${dateString}&end=${dateString}`),
    ]);

    if (requestToken !== previewRequestToken || currentSelectedDate !== dateString) {
      return;
    }

    const payload = {
      languages: languages.items || [],
      projects: projects.items || [],
      hourly,
    };
    dailyBreakdownCache.set(dateString, payload);
    renderSelectedDayPanel(dateString, minutes, heartbeats, payload.languages, payload.projects, payload.hourly);
  } catch {
    if (requestToken !== previewRequestToken || currentSelectedDate !== dateString) {
      return;
    }

    calendarHoverSummaryEl.textContent = t('calendar.load_error');
    renderHoverBreakdown(calendarHoverLanguagesEl, [], 'language', 0, t('calendar.failed_language'));
    renderHoverBreakdown(calendarHoverProjectsEl, [], 'project', 2, t('calendar.failed_project'));
    if (calendarHourlySummaryEl) {
      calendarHourlySummaryEl.textContent = t('calendar.hourly_failed');
    }
    renderHourlyDistribution([], t('calendar.hourly_failed'));
  }
}

function renderDailyCalendar(data) {
  if (!dailyCalendarGridEl || !calendarMonthLabelEl) {
    if (calendarMonthLabelEl) {
      calendarMonthLabelEl.textContent = monthLabel(currentMonth);
    }
    return;
  }
  const days = data.days || [];
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const maxMinutes = Math.max(0, ...days.map((day) => day.active_minutes || 0));
  const todayIso = toIsoDate(appToday());
  const lastDay = monthEnd(currentMonth);

  calendarMonthLabelEl.textContent = monthLabel(currentMonth);

  if (!dailyCalendarGridEl.querySelector('.calendar-cell[data-date]')) {
    dailyCalendarGridEl.innerHTML = buildCalendarSkeleton(currentMonth);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const iso = toIsoDate(date);
    const stats = dayMap.get(iso);
    const minutes = stats?.active_minutes || 0;
    const heartbeats = stats?.heartbeats || 0;
    const level = calendarLevel(minutes, maxMinutes);
    const activityText = minutes > 0 ? fmtMinutes(minutes) : t('calendar.no_activity');

    const cell = dailyCalendarGridEl.querySelector(`.calendar-cell[data-date="${iso}"]`);
    if (!cell) {
      continue;
    }

    cell.className = [
      'calendar-cell',
      `level-${level}`,
      minutes > 0 ? 'has-activity' : 'no-activity',
      currentSelectedDate === iso ? 'is-active' : '',
    ].filter(Boolean).join(' ');
    cell.dataset.minutes = String(minutes);
    cell.dataset.heartbeats = String(heartbeats);
    cell.title = `${iso} · ${activityText} · ${heartbeats} ${t('common.heartbeats')}`;
    cell.setAttribute('aria-label', `${iso}, ${activityText}, ${heartbeats} ${t('common.heartbeats')}`);

    const durationEl = cell.querySelector('.calendar-duration');
    const heartbeatsEl = cell.querySelector('.calendar-heartbeats');

    if (durationEl) {
      durationEl.textContent = minutes > 0 ? fmtMinutes(minutes) : '—';
    }
    if (heartbeatsEl) {
      heartbeatsEl.textContent = heartbeats > 0 ? `${fmtNumber(heartbeats)} hb` : '0 hb';
    }
  }
}

function initPieChart(canvasId, items, scope = 'generic', colorOffset = 0) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext('2d');

  const chart = canvasId === 'languageChart' ? languageChart : projectChart;
  if (chart) {
    chart.destroy();
  }

  const labels = items.map((item) => displayName(item.name));
  const values = items.map((item) => item.active_minutes || 0);
  const colors = items.map((item, idx) => seriesColor(item.name, scope, colorOffset + idx));

  const newChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#24292f',
          bodyColor: '#57606a',
          borderColor: '#d0d7de',
          borderWidth: 1,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${fmtMinutes(ctx.raw)}`,
          },
        },
      },
    },
  });

  if (canvasId === 'languageChart') {
    languageChart = newChart;
  } else {
    projectChart = newChart;
  }
}

function sumMinutesUpToDay(days, dayNum) {
  let total = 0;
  for (const d of days) {
    if (fromIsoDate(d.date).getDate() <= dayNum) {
      total += d.active_minutes || 0;
    }
  }
  return total;
}

function renderPrevMonthCard(selectedDateString) {
  if (!prevMonthCardEl || !prevMonthHoursEl || !selectedDateString) {
    return;
  }

  const selectedDay = fromIsoDate(selectedDateString).getDate();
  const currentMinutes = sumMinutesUpToDay(cachedCurrentDays, selectedDay);
  const prevMinutes = sumMinutesUpToDay(cachedPrevMonthDays, selectedDay);
  if (prevMinutes <= 0) {
    prevMonthCardEl.style.display = 'none';
    return;
  }

  prevMonthCardEl.style.display = '';
  prevMonthHoursEl.textContent = fmtMinutes(prevMinutes);
  prevMonthCardEl.title = t('summary.prev_month');

  if (prevMonthDeltaEl) {
    const diff = currentMinutes - prevMinutes;
    if (diff > 0) {
      prevMonthDeltaEl.textContent = t('summary.prev_month_delta_up', { delta: fmtMinutes(diff) });
      prevMonthDeltaEl.className = 'stat-detail stat-delta delta-up';
    } else if (diff < 0) {
      prevMonthDeltaEl.textContent = t('summary.prev_month_delta_down', { delta: fmtMinutes(Math.abs(diff)) });
      prevMonthDeltaEl.className = 'stat-detail stat-delta delta-down';
    } else {
      prevMonthDeltaEl.textContent = t('summary.prev_month_delta_same');
      prevMonthDeltaEl.className = 'stat-detail stat-delta delta-same';
    }
  }
}

async function loadStats() {
  try {
    renderCalendarSkeleton(currentMonth);
    await ensureLanguageColorsLoaded();

    const { start, end } = monthRange(currentMonth);
    const prevMonth = shiftMonth(currentMonth, -1);
    const { start: prevStart, end: prevEnd } = monthRange(prevMonth);
    const todayIso = toIsoDate(appToday());
    const monthText = monthLabel(currentMonth);
    const needsTodayRequest = !isIsoDateInRange(todayIso, start, end);

    const [daily, todayDaily, prevMonthDaily] = await Promise.all([
      fetchJson(`/api/stats/daily?start=${start}&end=${end}`),
      needsTodayRequest ? fetchJson(`/api/stats/daily?start=${todayIso}&end=${todayIso}`) : null,
      prevMonthCardEl ? fetchJson(`/api/stats/daily?start=${prevStart}&end=${prevEnd}`) : null,
    ]);
    const daysByDate = new Map((daily.days || []).map((day) => [day.date, day]));
    cachedCurrentDays = daily.days || [];
    cachedPrevMonthDays = prevMonthDaily?.days || [];

    const today = needsTodayRequest
      ? (todayDaily?.days?.[0] || null)
      : (daysByDate.get(todayIso) || null);

    if (todayActiveEl) {
      todayActiveEl.textContent = today ? fmtMinutes(today.active_minutes) : '0m';
    }
    if (todayHeartbeatsEl) {
      todayHeartbeatsEl.textContent = today ? fmtNumber(today.heartbeats) : '0';
    }

    if (weekActiveEl) {
      weekActiveEl.textContent = fmtMinutes(daily.total_active_minutes);
    }
    if (bestDayEl) {
      bestDayEl.textContent = daily.best_day ? shortDateLabel(daily.best_day) : '-';
    }
    if (totalHeartbeatsEl) {
      totalHeartbeatsEl.textContent = fmtNumber(daily.total_heartbeats);
    }
    renderDailyCalendar(daily);
    if (dailyCalendarGridEl && calendarSidePanelEl) {
      const selectedDate = resolveSelectedCalendarDate(daily);
      const selectedDay = (daily.days || []).find((day) => day.date === selectedDate);
      await selectCalendarDay(
        selectedDate,
        selectedDay?.active_minutes || 0,
        selectedDay?.heartbeats || 0,
      );
    } else {
      const effectiveEnd = end <= todayIso ? monthEnd(currentMonth) : appToday();
      renderPrevMonthCard(toIsoDate(effectiveEnd));
      if (calendarMonthLabelEl) {
        calendarMonthLabelEl.textContent = monthText;
      }
    }

    if (pageType === 'charts') {
      const [langs, projects, editors, aiStats] = await Promise.all([
        fetchJson(`/api/stats/breakdown?by=language&limit=10&start=${start}&end=${end}`),
        fetchJson(`/api/stats/breakdown?by=project&limit=10&start=${start}&end=${end}`),
        fetchJson(`/api/stats/breakdown?by=editor&limit=5&start=${start}&end=${end}`),
        fetchJson(`/api/stats/ai?start=${start}&end=${end}`),
      ]);

      const aiInsertEl = document.getElementById('ai-insert');
      const aiDeleteEl = document.getElementById('ai-delete');
      const humanInsertEl = document.getElementById('human-insert');
      const humanDeleteEl = document.getElementById('human-delete');
      if (aiInsertEl) {
        aiInsertEl.textContent = fmtNumber(aiStats.ai_line_changes);
      }
      if (aiDeleteEl) {
        aiDeleteEl.textContent = `${(aiStats.ai_percentage || 0).toFixed(1)}%`;
      }
      if (humanInsertEl) {
        humanInsertEl.textContent = fmtNumber(aiStats.human_line_changes);
      }
      if (humanDeleteEl) {
        humanDeleteEl.textContent = fmtNumber(aiStats.total_changes || 0);
      }

      const aiPercent = aiStats.ai_percentage || 0;
      const humanPercent = 100 - aiPercent;
      const aiBarEl = document.getElementById('ai-bar');
      const humanBarEl = document.getElementById('human-bar');
      const aiPercentEl = document.getElementById('ai-percent');
      const humanPercentEl = document.getElementById('human-percent');
      if (aiBarEl) {
        aiBarEl.style.width = `${aiPercent}%`;
      }
      if (humanBarEl) {
        humanBarEl.style.width = `${humanPercent}%`;
      }
      if (aiPercentEl) {
        aiPercentEl.textContent = `${aiPercent.toFixed(1)}%`;
      }
      if (humanPercentEl) {
        humanPercentEl.textContent = `${humanPercent.toFixed(1)}%`;
      }

      initPieChart('languageChart', langs.items || [], 'language', 0);
      initPieChart('projectChart', projects.items || [], 'project', 2);
      renderLegend('language-legend', langs.items || [], 'language', 0);
      renderLegend('project-legend', projects.items || [], 'project', 2);

      renderDetailList(topLanguagesEl, langs.items || [], 'language', 0);
      renderDetailList(topProjectsEl, projects.items || [], 'project', 2);
      renderDetailList(topEditorsEl, editors.items || [], 'editor', 4);
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

function getCalendarCell(target) {
  return target instanceof Element ? target.closest('.calendar-cell[data-date]') : null;
}

function handleCalendarCellInteraction(event) {
  const cell = getCalendarCell(event.target);
  if (!cell) {
    return;
  }

  void selectCalendarDay(
    cell.dataset.date,
    Number(cell.dataset.minutes || 0),
    Number(cell.dataset.heartbeats || 0),
  );
}

if (dailyCalendarGridEl) {
  dailyCalendarGridEl.addEventListener('click', handleCalendarCellInteraction);
  dailyCalendarGridEl.addEventListener('focusin', handleCalendarCellInteraction);
  dailyCalendarGridEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const cell = getCalendarCell(event.target);
    if (!cell) {
      return;
    }

    event.preventDefault();
    void selectCalendarDay(
      cell.dataset.date,
      Number(cell.dataset.minutes || 0),
      Number(cell.dataset.heartbeats || 0),
    );
  });
}

if (prevMonthBtn) {
  prevMonthBtn.addEventListener('click', async () => {
    currentMonth = shiftMonth(currentMonth, -1);
    await loadStats();
  });
}

if (nextMonthBtn) {
  nextMonthBtn.addEventListener('click', async () => {
    currentMonth = shiftMonth(currentMonth, 1);
    await loadStats();
  });
}

if (todayBtn) {
  todayBtn.addEventListener('click', async () => {
    currentMonth = new Date();
    await loadStats();
  });
}

if (langEnBtn) {
  langEnBtn.addEventListener('click', () => setLanguage('en'));
}
if (langZhBtn) {
  langZhBtn.addEventListener('click', () => setLanguage('zh'));
}

ensureSyncRangeDefaults();
if (syncRangeBtn) {
  syncRangeBtn.addEventListener('click', runSyncRange);
}
if (syncUserAgentsBtn) {
  syncUserAgentsBtn.addEventListener('click', runUserAgentRefresh);
}

if (projectMappingFormEl) {
  projectMappingFormEl.addEventListener('submit', saveProjectMapping);
}

if (editorMappingFormEl) {
  editorMappingFormEl.addEventListener('submit', saveEditorMapping);
}

if (projectMappingListEl) {
  projectMappingListEl.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-action="delete-project-mapping"]')
      : null;
    if (!button) {
      return;
    }
    const sourceProject = button.getAttribute('data-source-project');
    if (!sourceProject) {
      return;
    }
    void deleteProjectMapping(sourceProject);
  });
}

if (editorMappingListEl) {
  editorMappingListEl.addEventListener('click', (event) => {
    const button = event.target instanceof Element
      ? event.target.closest('[data-action="delete-editor-mapping"]')
      : null;
    if (!button) {
      return;
    }
    const sourceEditor = button.getAttribute('data-source-editor');
    if (!sourceEditor) {
      return;
    }
    void deleteEditorMapping(sourceEditor);
  });
}

applyTranslations();
renderCalendarSkeleton(currentMonth);
loadHealth();
loadState();
if (pageType === 'sync-history') {
  loadSyncHistory();
}
if (pageType === 'project-mappings') {
  loadProjectMappingOptions();
  loadProjectMappings();
  loadEditorMappingOptions();
  loadEditorMappings();
} else if (pageType !== 'sync-history') {
  loadStats();
}
