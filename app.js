const STORAGE_KEY = "wudao-practice-records";
const PRESETS_KEY = "wudao-practice-presets";
const THEME_KEY = "wudao-theme";
const DEFAULT_PRESETS = [
  { id: "palm-pushup", name: "掌俯卧撑", unit: "个", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
  { id: "fist-pushup", name: "拳俯卧撑", unit: "个", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
  { id: "finger-pushup", name: "指俯卧撑", unit: "个", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
  { id: "squat", name: "深蹲", unit: "个", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
  { id: "stance", name: "站桩", unit: "分钟", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
  { id: "boxing-form", name: "拳法", unit: "遍", amount: 0, duration: 0, goalAmount: 0, goalDuration: 0 },
];

const state = {
  records: [],
  presets: [],
  editingId: null,
  editingPresetId: null,
  search: "",
};

const els = {
  currentDate: document.querySelector("#currentDate"),
  themeToggle: document.querySelector("#themeToggle"),
  entryForm: document.querySelector("#entryForm"),
  activityInput: document.querySelector("#activityInput"),
  dateInput: document.querySelector("#dateInput"),
  timeInput: document.querySelector("#timeInput"),
  amountInput: document.querySelector("#amountInput"),
  unitInput: document.querySelector("#unitInput"),
  durationInput: document.querySelector("#durationInput"),
  noteInput: document.querySelector("#noteInput"),
  managePresetsButton: document.querySelector("#managePresetsButton"),
  presetRow: document.querySelector("#presetRow"),
  presetManager: document.querySelector("#presetManager"),
  presetForm: document.querySelector("#presetForm"),
  presetNameInput: document.querySelector("#presetNameInput"),
  presetAmountInput: document.querySelector("#presetAmountInput"),
  presetUnitInput: document.querySelector("#presetUnitInput"),
  presetDurationInput: document.querySelector("#presetDurationInput"),
  presetGoalAmountInput: document.querySelector("#presetGoalAmountInput"),
  presetGoalDurationInput: document.querySelector("#presetGoalDurationInput"),
  presetList: document.querySelector("#presetList"),
  savePresetButton: document.querySelector("#savePresetButton"),
  cancelPresetEditButton: document.querySelector("#cancelPresetEditButton"),
  resetPresetsButton: document.querySelector("#resetPresetsButton"),
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  todayCount: document.querySelector("#todayCount"),
  todayAmount: document.querySelector("#todayAmount"),
  todayMinutes: document.querySelector("#todayMinutes"),
  todayGoalSummary: document.querySelector("#todayGoalSummary"),
  todayBreakdown: document.querySelector("#todayBreakdown"),
  todayList: document.querySelector("#todayList"),
  historyList: document.querySelector("#historyList"),
  searchInput: document.querySelector("#searchInput"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importFile: document.querySelector("#importFile"),
  clearButton: document.querySelector("#clearButton"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmCancel: document.querySelector("#confirmCancel"),
  confirmOk: document.querySelector("#confirmOk"),
  toast: document.querySelector("#toast"),
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeKey(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatFullDate(date = new Date()) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 1800);
}

function askConfirm({ title, message, okText = "确定" }) {
  els.confirmTitle.textContent = title;
  els.confirmMessage.textContent = message;
  els.confirmOk.textContent = okText;
  els.confirmDialog.hidden = false;
  els.confirmCancel.focus();

  return new Promise((resolve) => {
    function finish(value) {
      els.confirmDialog.hidden = true;
      els.confirmCancel.removeEventListener("click", cancel);
      els.confirmOk.removeEventListener("click", ok);
      els.confirmDialog.removeEventListener("click", backdrop);
      document.removeEventListener("keydown", escape);
      resolve(value);
    }

    function cancel() {
      finish(false);
    }

    function ok() {
      finish(true);
    }

    function backdrop(event) {
      if (event.target === els.confirmDialog) finish(false);
    }

    function escape(event) {
      if (event.key === "Escape") finish(false);
    }

    els.confirmCancel.addEventListener("click", cancel);
    els.confirmOk.addEventListener("click", ok);
    els.confirmDialog.addEventListener("click", backdrop);
    document.addEventListener("keydown", escape);
  });
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.records = raw ? JSON.parse(raw) : [];
  } catch {
    state.records = [];
    showToast("本地记录读取失败，已重新开始");
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function normalizePreset(item) {
  return {
    id: item.id || crypto.randomUUID(),
    name: String(item.name || "").trim(),
    unit: String(item.unit || "").trim(),
    amount: Number(item.amount) || 0,
    duration: Number(item.duration) || 0,
    goalAmount: Number(item.goalAmount) || 0,
    goalDuration: Number(item.goalDuration) || 0,
  };
}

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    const parsed = raw ? JSON.parse(raw) : DEFAULT_PRESETS;
    state.presets = parsed.map(normalizePreset).filter((preset) => preset.name);
  } catch {
    state.presets = DEFAULT_PRESETS.map(normalizePreset);
    showToast("常用项目读取失败，已恢复默认");
  }
}

function savePresets() {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(state.presets));
}

function applyTheme(theme) {
  const nextTheme = theme || localStorage.getItem(THEME_KEY) || "light";
  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem(THEME_KEY, nextTheme);
}

function setInitialDateTime() {
  const now = new Date();
  els.dateInput.value = todayKey(now);
  els.timeInput.value = timeKey(now);
  els.currentDate.textContent = formatFullDate(now);
}

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const left = `${a.date}T${a.time || "00:00"}`;
    const right = `${b.date}T${b.time || "00:00"}`;
    return right.localeCompare(left);
  });
}

function getTodayRecords() {
  const key = todayKey();
  return sortRecords(state.records.filter((record) => record.date === key));
}

function sumNumbers(records, field) {
  return records.reduce((total, record) => total + (Number(record[field]) || 0), 0);
}

function recordMeasure(record) {
  const parts = [];
  if (Number(record.amount) > 0) parts.push(`${record.amount}${record.unit || ""}`);
  if (Number(record.duration) > 0) parts.push(`${record.duration}分钟`);
  return parts.length ? parts.join(" · ") : "已完成";
}

function recordMatches(record, query) {
  if (!query) return true;
  const haystack = [record.activity, record.unit, record.note, record.date, record.time].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function presetMeasure(preset) {
  const parts = [];
  if (Number(preset.amount) > 0) parts.push(`${preset.amount}${preset.unit || ""}`);
  if (Number(preset.duration) > 0) parts.push(`${preset.duration}分钟`);
  return parts.join(" · ");
}

function presetGoalMeasure(preset) {
  const parts = [];
  if (Number(preset.goalAmount) > 0) parts.push(`${preset.goalAmount}${preset.unit || ""}`);
  if (Number(preset.goalDuration) > 0) parts.push(`${preset.goalDuration}分钟`);
  return parts.join(" · ");
}

function progressPercent(done, target) {
  if (!target) return 0;
  return Math.min(100, Math.round((done / target) * 100));
}

function totalsByActivity(records) {
  return records.reduce((map, record) => {
    const name = record.activity || "未命名";
    const current = map.get(name) || { amount: 0, duration: 0, unit: record.unit || "" };
    current.amount += Number(record.amount) || 0;
    current.duration += Number(record.duration) || 0;
    if (!current.unit && record.unit) current.unit = record.unit;
    map.set(name, current);
    return map;
  }, new Map());
}

function goalPresets() {
  return state.presets.filter((preset) => (
    Number(preset.goalAmount) > 0 || Number(preset.goalDuration) > 0
  ));
}

function goalProgress(records) {
  const totals = totalsByActivity(records);
  const goals = goalPresets();
  const goalTotals = goals.reduce((total, preset) => {
    const done = totals.get(preset.name) || { amount: 0, duration: 0, unit: preset.unit || "" };
    return {
      done: total.done + Math.min(done.amount, preset.goalAmount || 0) + Math.min(done.duration, preset.goalDuration || 0),
      target: total.target + (preset.goalAmount || 0) + (preset.goalDuration || 0),
    };
  }, { done: 0, target: 0 });

  const finished = goals.filter((preset) => {
    const done = totals.get(preset.name) || { amount: 0, duration: 0 };
    const amountOk = !preset.goalAmount || done.amount >= preset.goalAmount;
    const durationOk = !preset.goalDuration || done.duration >= preset.goalDuration;
    return amountOk && durationOk;
  }).length;

  return {
    finished,
    goals,
    percent: progressPercent(goalTotals.done, goalTotals.target),
    target: goalTotals.target,
    totals,
  };
}

function renderRecord(record) {
  const note = record.note ? `<div class="record-note">${escapeHtml(record.note)}</div>` : "";
  return `
    <article class="record-card" data-id="${record.id}">
      <div class="record-main">
        <div class="record-title">
          <strong>${escapeHtml(record.activity)}</strong>
          <span>${escapeHtml(recordMeasure(record))}</span>
        </div>
        <div class="record-meta">${escapeHtml(record.time || "")}</div>
        ${note}
      </div>
      <div class="record-actions">
        <button class="record-action" type="button" data-action="edit" aria-label="编辑 ${escapeHtml(record.activity)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.46V20h2.54L17.68 8.86l-2.54-2.54L4 17.46ZM19.78 6.76a1 1 0 0 0 0-1.42l-1.12-1.12a1 1 0 0 0-1.42 0l-.68.68 2.54 2.54.68-.68Z" /></svg>
        </button>
        <button class="record-action" type="button" data-action="delete" aria-label="删除 ${escapeHtml(record.activity)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm1 2h4V5h-4Zm-3 4a1 1 0 0 1 1.99-.14L9.86 19h4.28l.87-10.14A1 1 0 1 1 17 9.14l-.93 10.86A2 2 0 0 1 14.08 22H9.92a2 2 0 0 1-1.99-2L7 9.14A1 1 0 0 1 7 9Z" /></svg>
        </button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderToday() {
  const records = getTodayRecords();
  els.todayCount.textContent = records.length;
  els.todayAmount.textContent = sumNumbers(records, "amount");
  els.todayMinutes.textContent = sumNumbers(records, "duration");

  const dayProgress = goalProgress(records);
  const { goals, percent: overallPercent, finished: finishedGoals, totals } = dayProgress;

  els.todayGoalSummary.innerHTML = goals.length
    ? `
      <section class="goal-hero">
        <div class="goal-hero-head">
          <div>
            <span>今日目标</span>
            <strong>${overallPercent}%</strong>
          </div>
          <span>${finishedGoals}/${goals.length} 项完成</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(4, overallPercent)}%"></div></div>
        <p>${overallPercent >= 100 ? "今日目标已完成" : "继续积累，进度会随记录自动更新"}</p>
      </section>
    `
    : `<div class="empty-state">还没有设置今日目标</div>`;

  const goalRows = goals.map((preset) => {
    const done = totals.get(preset.name) || { amount: 0, duration: 0, unit: preset.unit || "" };
    const lines = [];

    if (preset.goalAmount) {
      const percent = progressPercent(done.amount, preset.goalAmount);
      const remaining = Math.max(0, preset.goalAmount - done.amount);
      lines.push(`
        <div class="goal-line">
          <span>数量</span>
          <strong>${done.amount}/${preset.goalAmount}${escapeHtml(preset.unit || "")}</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(4, percent)}%"></div></div>
        <div class="goal-line">
          <span>${remaining ? `还差 ${remaining}${escapeHtml(preset.unit || "")}` : "已达成"}</span>
          <span>${percent}%</span>
        </div>
      `);
    }

    if (preset.goalDuration) {
      const percent = progressPercent(done.duration, preset.goalDuration);
      const remaining = Math.max(0, preset.goalDuration - done.duration);
      lines.push(`
        <div class="goal-line">
          <span>时间</span>
          <strong>${done.duration}/${preset.goalDuration}分钟</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width: ${Math.max(4, percent)}%"></div></div>
        <div class="goal-line">
          <span>${remaining ? `还差 ${remaining}分钟` : "已达成"}</span>
          <span>${percent}%</span>
        </div>
      `);
    }

    const isDone = (!preset.goalAmount || done.amount >= preset.goalAmount)
      && (!preset.goalDuration || done.duration >= preset.goalDuration);

    return `
      <article class="goal-card ${isDone ? "done" : ""}">
        <div class="goal-card-head">
          <strong>${escapeHtml(preset.name)}</strong>
          <span class="goal-badge">${isDone ? "完成" : "进行中"}</span>
        </div>
        ${lines.join("")}
      </article>
    `;
  });

  const freeRows = [...totals.entries()]
    .filter(([activity]) => !goals.some((preset) => preset.name === activity))
    .map(([activity, item]) => {
      const measure = [
        item.amount ? `${item.amount}${item.unit}` : "",
        item.duration ? `${item.duration}分钟` : "",
      ].filter(Boolean).join(" · ");
      return `
        <div class="breakdown-row">
          <strong>${escapeHtml(activity)}</strong>
          <div class="bar-track"><div class="bar-fill" style="width: 100%"></div></div>
          <span>${escapeHtml(measure || "1次")}</span>
        </div>
      `;
    });

  els.todayBreakdown.innerHTML = goalRows.concat(freeRows).join("");

  els.todayList.innerHTML = records.length
    ? records.map(renderRecord).join("")
    : `<div class="empty-state">今天还没有记录</div>`;
}

function renderHistory() {
  const filtered = sortRecords(state.records).filter((record) => recordMatches(record, state.search));

  if (!filtered.length) {
    els.historyList.innerHTML = `<div class="empty-state">没有找到记录</div>`;
    return;
  }

  const groups = filtered.reduce((map, record) => {
    if (!map.has(record.date)) map.set(record.date, []);
    map.get(record.date).push(record);
    return map;
  }, new Map());

  els.historyList.innerHTML = [...groups.entries()]
    .map(([date, records]) => renderHistoryDay(date, records))
    .join("");
}

function renderHistoryDay(date, records) {
  const dayRecords = sortRecords(state.records.filter((record) => record.date === date));
  const progress = goalProgress(dayRecords);
  const totalAmount = sumNumbers(dayRecords, "amount");
  const totalMinutes = sumNumbers(dayRecords, "duration");
  const hasGoals = progress.goals.length > 0;
  const percent = hasGoals ? progress.percent : 0;
  const goalLabel = hasGoals ? `${progress.finished}/${progress.goals.length} 项完成` : "未设目标";
  const amountLabel = [
    totalAmount ? `数量 ${totalAmount}` : "",
    totalMinutes ? `分钟 ${totalMinutes}` : "",
  ].filter(Boolean).join(" · ") || "已记录";
  const detailId = `history-${date}`;
  const expanded = Boolean(state.search);

  return `
    <section class="history-day ${expanded ? "open" : ""}">
      <button class="history-day-toggle" type="button" data-history-toggle="${escapeHtml(detailId)}" aria-expanded="${expanded}" aria-controls="${escapeHtml(detailId)}">
        <div class="history-day-main">
          <div>
            <span>${escapeHtml(formatDate(date))}</span>
            <strong>${hasGoals ? `${percent}%` : "日课"}</strong>
          </div>
          <div class="bar-track"><div class="bar-fill" style="width: ${hasGoals ? Math.max(4, percent) : 100}%"></div></div>
          <small>${escapeHtml(goalLabel)} · ${dayRecords.length} 条 · ${escapeHtml(amountLabel)}</small>
        </div>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.3 9.3a1 1 0 0 1 1.4 0l3.3 3.29 3.3-3.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.42Z" /></svg>
      </button>
      <div class="history-day-detail" id="${escapeHtml(detailId)}" ${expanded ? "" : "hidden"}>
        ${records.map(renderRecord).join("")}
      </div>
    </section>
  `;
}

function renderPresets() {
  if (!state.presets.length) {
    els.presetRow.innerHTML = `<div class="empty-preset">暂无常用项目</div>`;
    els.presetList.innerHTML = `<div class="empty-state">还没有常用项目</div>`;
    return;
  }

  els.presetRow.innerHTML = state.presets
    .map((preset) => {
      const detail = presetMeasure(preset);
      return `
        <button type="button" class="preset" data-preset-id="${escapeHtml(preset.id)}">
          ${escapeHtml(preset.name)}
          ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
        </button>
      `;
    })
    .join("");

  els.presetList.innerHTML = state.presets
    .map((preset) => {
      const defaultDetail = presetMeasure(preset) || (preset.unit ? `单位：${preset.unit}` : "无默认值");
      const goalDetail = presetGoalMeasure(preset);
      const detail = goalDetail ? `${defaultDetail} · 目标 ${goalDetail}` : defaultDetail;
      return `
        <article class="preset-card" data-preset-id="${escapeHtml(preset.id)}">
          <div>
            <strong>${escapeHtml(preset.name)}</strong>
            <span>${escapeHtml(detail)}</span>
          </div>
          <div class="preset-actions">
            <button class="record-action" type="button" data-preset-action="edit" aria-label="编辑 ${escapeHtml(preset.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.46V20h2.54L17.68 8.86l-2.54-2.54L4 17.46ZM19.78 6.76a1 1 0 0 0 0-1.42l-1.12-1.12a1 1 0 0 0-1.42 0l-.68.68 2.54 2.54.68-.68Z" /></svg>
            </button>
            <button class="record-action" type="button" data-preset-action="delete" aria-label="删除 ${escapeHtml(preset.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3a1 1 0 0 0-1 1v1H5a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2h-3V4a1 1 0 0 0-1-1H9Zm1 2h4V5h-4Zm-3 4a1 1 0 0 1 1.99-.14L9.86 19h4.28l.87-10.14A1 1 0 1 1 17 9.14l-.93 10.86A2 2 0 0 1 14.08 22H9.92a2 2 0 0 1-1.99-2L7 9.14A1 1 0 0 1 7 9Z" /></svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  updatePresetSelection(els.activityInput.value.trim());
}

function renderAll() {
  renderPresets();
  renderToday();
  renderHistory();
}

function switchView(viewName) {
  els.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });
  els.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetFormAfterSave() {
  const activity = els.activityInput.value.trim();
  const unit = els.unitInput.value.trim();
  const amount = els.amountInput.value;
  const duration = els.durationInput.value;
  state.editingId = null;
  els.entryForm.reset();
  els.activityInput.value = activity || state.presets[0]?.name || "";
  els.unitInput.value = unit || state.presets[0]?.unit || "";
  els.amountInput.value = amount;
  els.durationInput.value = duration;
  setInitialDateTime();
  updatePresetSelection(els.activityInput.value.trim());
  els.entryForm.querySelector(".primary-action").lastChild.textContent = " 记一条";
}

function updatePresetSelection(activity) {
  document.querySelectorAll(".preset").forEach((button) => {
    const preset = state.presets.find((item) => item.id === button.dataset.presetId);
    button.classList.toggle("active", preset?.name === activity);
  });
}

function applyPreset(id) {
  const preset = state.presets.find((item) => item.id === id);
  if (!preset) return;
  els.activityInput.value = preset.name;
  els.unitInput.value = preset.unit;
  els.amountInput.value = preset.amount || "";
  els.durationInput.value = preset.duration || "";
  updatePresetSelection(preset.name);
}

function saveEntry(event) {
  event.preventDefault();
  const activity = els.activityInput.value.trim();
  const amount = Number(els.amountInput.value) || 0;
  const duration = Number(els.durationInput.value) || 0;

  if (!activity) {
    showToast("先写动作");
    return;
  }

  if (!amount && !duration) {
    showToast("数量或耗时至少填一个");
    return;
  }

  const record = {
    id: state.editingId || crypto.randomUUID(),
    activity,
    date: els.dateInput.value,
    time: els.timeInput.value,
    amount,
    unit: els.unitInput.value.trim(),
    duration,
    note: els.noteInput.value.trim(),
    updatedAt: new Date().toISOString(),
  };

  if (state.editingId) {
    state.records = state.records.map((item) => item.id === state.editingId ? record : item);
    showToast("已更新");
  } else {
    state.records.push({ ...record, createdAt: record.updatedAt });
    showToast("已记录");
  }

  saveRecords();
  renderAll();
  resetFormAfterSave();
}

function editRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  state.editingId = id;
  els.activityInput.value = record.activity;
  els.dateInput.value = record.date;
  els.timeInput.value = record.time;
  els.amountInput.value = record.amount || "";
  els.unitInput.value = record.unit || "";
  els.durationInput.value = record.duration || "";
  els.noteInput.value = record.note || "";
  els.entryForm.querySelector(".primary-action").lastChild.textContent = " 保存修改";
  updatePresetSelection(record.activity);
  switchView("log");
}

async function deleteRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  const ok = await askConfirm({
    title: "删除记录",
    message: `删除「${record.activity}」这条记录？`,
    okText: "删除",
  });
  if (!ok) return;
  state.records = state.records.filter((item) => item.id !== id);
  saveRecords();
  renderAll();
  showToast("已删除");
}

function handleRecordAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const card = button.closest("[data-id]");
  if (!card) return;
  if (button.dataset.action === "edit") editRecord(card.dataset.id);
  if (button.dataset.action === "delete") deleteRecord(card.dataset.id);
}

function handleHistoryClick(event) {
  const toggle = event.target.closest("[data-history-toggle]");
  if (toggle) {
    const detail = document.getElementById(toggle.dataset.historyToggle);
    if (!detail) return;
    const nextExpanded = detail.hidden;
    detail.hidden = !nextExpanded;
    toggle.setAttribute("aria-expanded", String(nextExpanded));
    toggle.closest(".history-day")?.classList.toggle("open", nextExpanded);
    return;
  }

  handleRecordAction(event);
}

function exportRecords() {
  const payload = {
    app: "武道日课",
    exportedAt: new Date().toISOString(),
    presets: state.presets,
    records: sortRecords(state.records),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wudao-records-${todayKey()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("已导出");
}

function importRecords(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const records = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(records)) throw new Error("invalid");
      const normalized = records
        .filter((item) => item && item.activity && item.date)
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          activity: String(item.activity),
          date: String(item.date),
          time: item.time ? String(item.time) : "00:00",
          amount: Number(item.amount) || 0,
          unit: item.unit ? String(item.unit) : "",
          duration: Number(item.duration) || 0,
          note: item.note ? String(item.note) : "",
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        }));
      const byId = new Map(state.records.map((item) => [item.id, item]));
      normalized.forEach((item) => byId.set(item.id, item));
      state.records = [...byId.values()];

      if (Array.isArray(parsed.presets)) {
        const presets = parsed.presets.map(normalizePreset).filter((item) => item.name);
        const presetById = new Map(state.presets.map((item) => [item.id, item]));
        presets.forEach((item) => presetById.set(item.id, item));
        state.presets = [...presetById.values()];
        savePresets();
      }

      saveRecords();
      renderAll();
      showToast(`已导入 ${normalized.length} 条`);
    } catch {
      showToast("导入失败");
    } finally {
      els.importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function resetPresetForm() {
  state.editingPresetId = null;
  els.presetForm.reset();
  els.savePresetButton.textContent = "保存项目";
  els.cancelPresetEditButton.hidden = true;
}

function savePreset(event) {
  event.preventDefault();
  const preset = normalizePreset({
    id: state.editingPresetId || crypto.randomUUID(),
    name: els.presetNameInput.value,
    unit: els.presetUnitInput.value,
    amount: els.presetAmountInput.value,
    duration: els.presetDurationInput.value,
    goalAmount: els.presetGoalAmountInput.value,
    goalDuration: els.presetGoalDurationInput.value,
  });

  if (!preset.name) {
    showToast("先写项目名");
    return;
  }

  const duplicate = state.presets.find((item) => (
    item.name === preset.name && item.id !== state.editingPresetId
  ));
  if (duplicate) {
    showToast("已有同名项目");
    return;
  }

  if (state.editingPresetId) {
    state.presets = state.presets.map((item) => item.id === state.editingPresetId ? preset : item);
    showToast("项目已更新");
  } else {
    state.presets.push(preset);
    showToast("项目已保存");
  }

  savePresets();
  renderPresets();
  resetPresetForm();
}

function editPreset(id) {
  const preset = state.presets.find((item) => item.id === id);
  if (!preset) return;
  state.editingPresetId = id;
  els.presetNameInput.value = preset.name;
  els.presetUnitInput.value = preset.unit;
  els.presetAmountInput.value = preset.amount || "";
  els.presetDurationInput.value = preset.duration || "";
  els.presetGoalAmountInput.value = preset.goalAmount || "";
  els.presetGoalDurationInput.value = preset.goalDuration || "";
  els.savePresetButton.textContent = "保存修改";
  els.cancelPresetEditButton.hidden = false;
  els.presetNameInput.focus();
}

async function deletePreset(id) {
  const preset = state.presets.find((item) => item.id === id);
  if (!preset) return;
  const ok = await askConfirm({
    title: "删除项目",
    message: `删除「${preset.name}」这个常用项目？历史记录不会受影响。`,
    okText: "删除",
  });
  if (!ok) return;
  state.presets = state.presets.filter((item) => item.id !== id);
  if (state.editingPresetId === id) resetPresetForm();
  savePresets();
  renderPresets();
  showToast("项目已删除");
}

function handlePresetAction(event) {
  const button = event.target.closest("[data-preset-action]");
  if (!button) return;
  const card = button.closest("[data-preset-id]");
  if (!card) return;
  if (button.dataset.presetAction === "edit") editPreset(card.dataset.presetId);
  if (button.dataset.presetAction === "delete") deletePreset(card.dataset.presetId);
}

function bindEvents() {
  els.entryForm.addEventListener("submit", saveEntry);
  els.presetRow.addEventListener("click", (event) => {
    const button = event.target.closest(".preset");
    if (!button) return;
    applyPreset(button.dataset.presetId);
  });
  els.managePresetsButton.addEventListener("click", () => {
    switchView("settings");
    els.presetManager.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  els.presetForm.addEventListener("submit", savePreset);
  els.presetList.addEventListener("click", handlePresetAction);
  els.cancelPresetEditButton.addEventListener("click", resetPresetForm);
  els.resetPresetsButton.addEventListener("click", async () => {
    const ok = await askConfirm({
      title: "恢复默认项目",
      message: "恢复默认常用项目？不会影响已经保存的练功记录。",
      okText: "恢复",
    });
    if (!ok) return;
    state.presets = DEFAULT_PRESETS.map(normalizePreset);
    savePresets();
    resetPresetForm();
    renderPresets();
    showToast("已恢复默认项目");
  });
  els.activityInput.addEventListener("input", () => updatePresetSelection(els.activityInput.value.trim()));
  els.navItems.forEach((item) => {
    item.addEventListener("click", () => switchView(item.dataset.view));
  });
  els.todayList.addEventListener("click", handleRecordAction);
  els.historyList.addEventListener("click", handleHistoryClick);
  els.searchInput.addEventListener("input", () => {
    state.search = els.searchInput.value.trim();
    renderHistory();
  });
  els.exportButton.addEventListener("click", exportRecords);
  els.importButton.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", () => {
    const [file] = els.importFile.files;
    if (file) importRecords(file);
  });
  els.clearButton.addEventListener("click", async () => {
    if (!state.records.length) {
      showToast("现在没有记录");
      return;
    }
    const ok = await askConfirm({
      title: "清空记录",
      message: "清空全部练功记录？",
      okText: "清空",
    });
    if (!ok) return;
    state.records = [];
    saveRecords();
    renderAll();
    showToast("已清空");
  });
  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "light" ? "dark" : "light");
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js");
  } catch {
    // The app still works without offline caching.
  }
}

function init() {
  applyTheme();
  setInitialDateTime();
  loadRecords();
  loadPresets();
  bindEvents();
  if (!els.activityInput.value.trim() && state.presets[0]) applyPreset(state.presets[0].id);
  renderAll();
  registerServiceWorker();
}

init();
