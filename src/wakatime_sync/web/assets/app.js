const versionEl = document.getElementById('version');
const lastSyncEl = document.getElementById('last-sync');
const syncRangeBtn = document.getElementById('sync-range-btn');
const syncStartDateEl = document.getElementById('sync-start-date');
const syncEndDateEl = document.getElementById('sync-end-date');
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
const langSwitchEl = document.getElementById('lang-switch');
const langEnBtn = document.getElementById('lang-en-btn');
const langZhBtn = document.getElementById('lang-zh-btn');
const pageType = document.body?.dataset.page || 'home';
const APP_TIMEZONE = 'Asia/Shanghai';

let languageChart = null;
let projectChart = null;
let currentMonth = new Date();
let currentSelectedDate = null;
let previewRequestToken = 0;

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
      charts_title: 'Monthly charts and rankings',
      charts_description: 'Open language, project, AI, and ranking panels on a dedicated page.',
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
      from: 'From',
      to: 'To',
      run_range: 'Sync',
      syncing: 'Syncing...',
      syncing_range: 'Syncing...',
      invalid_range: 'Please choose both start and end dates.',
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
      charts_title: '月度图表与排行',
      charts_description: '把语言、项目、AI 和排行面板放到独立页面查看。',
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
      from: '从',
      to: '到',
      run_range: '同步',
      syncing: '同步中…',
      syncing_range: '同步中…',
      invalid_range: '请选择开始和结束日期。',
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
  document.title = pageType === 'charts' ? t('doc.charts_title') : t('doc.home_title');

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
  void loadState();
  void loadStats();
}

function displayName(name) {
  return name || t('common.unknown');
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
  if (!syncRangeBtn || !syncStartDateEl || !syncEndDateEl) {
    return;
  }

  syncRangeBtn.disabled = isLoading;
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
    await loadStats();
  } catch (err) {
    alert(t('sync.error_prefix', { error: err }));
  } finally {
    setSyncLoadingState(false);
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

  const activeHours = (hours || []).filter((item) => (item.active_minutes || 0) > 0 || (item.heartbeats || 0) > 0);
  if (!activeHours.length) {
    calendarHourlyListEl.innerHTML = `<div class="calendar-hover-empty">${emptyMessage}</div>`;
    return;
  }

  const maxMinutes = Math.max(...activeHours.map((item) => item.active_minutes || 0), 0);
  calendarHourlyListEl.innerHTML = (hours || []).map((item) => {
    const pct = maxMinutes > 0 ? ((item.active_minutes || 0) / maxMinutes) * 100 : 0;
    return `
      <div class="calendar-hourly-row">
        <div class="calendar-hourly-label">${formatHourLabel(item.hour)}</div>
        <div class="calendar-hourly-bar">
          <div class="calendar-hourly-fill" style="width: ${pct}%;"></div>
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
  if (currentSelectedDate && currentSelectedDate >= start && currentSelectedDate <= end) {
    return currentSelectedDate;
  }

  const todayIso = toIsoDate(appToday());
  if (todayIso >= start && todayIso <= end) {
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

async function loadStats() {
  try {
    renderCalendarSkeleton(currentMonth);
    await ensureLanguageColorsLoaded();

    const { start, end } = monthRange(currentMonth);
    const todayIso = toIsoDate(appToday());
    const monthText = monthLabel(currentMonth);

    const [todayDaily, daily] = await Promise.all([
      fetchJson(`/api/stats/daily?start=${todayIso}&end=${todayIso}`),
      fetchJson(`/api/stats/daily?start=${start}&end=${end}`),
    ]);

    const today = todayDaily.days[0] || null;
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
    } else if (calendarMonthLabelEl) {
      calendarMonthLabelEl.textContent = monthText;
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

applyTranslations();
renderCalendarSkeleton(currentMonth);
loadHealth();
loadState();
loadStats();
