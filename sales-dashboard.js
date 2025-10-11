// No Firebase integration. Data comes from localStorage or sample fallback.

// UI elements
const monthPicker = document.getElementById('month-picker');
const sumMonthlyEl = document.getElementById('sum-monthly');
const avgDailyEl = document.getElementById('avg-daily');
const topCategoryEl = document.getElementById('top-category');
const loadingOverlay = document.getElementById('loading-overlay');
let loadingTimer = null;

let trendChart = null;
let categoryChart = null;
let chartLibPromise = null;

async function ensureChart() {
  if (!chartLibPromise) {
    chartLibPromise = import('https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js');
  }
  const mod = await chartLibPromise;
  // UMD exposes Chart as default and named export
  return mod.Chart || mod.default || window.Chart;
}

function showLoading(show, delayed = false) {
  if (!loadingOverlay) return;
  if (delayed && show) {
    window.clearTimeout(loadingTimer);
    loadingTimer = window.setTimeout(() => {
      loadingOverlay.classList.remove('hidden');
      loadingOverlay.classList.add('flex');
    }, 300);
    return;
  }
  window.clearTimeout(loadingTimer);
  loadingOverlay.classList.toggle('hidden', !show);
  loadingOverlay.classList.toggle('flex', show);
}

function formatRM(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR', minimumFractionDigits: 2 }).format(n).replace('MYR', 'RM');
}

function getMonthBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const daysInMonth = end.getDate();
  return { start, end, daysInMonth };
}

function parseRecordDate(d) {
  if (typeof d === 'number') return new Date(d);
  if (typeof d === 'string') return new Date(d);
  return new Date(NaN);
}

function sampleSales(year, monthIndex) {
  const yyyy = year;
  const mm = String(monthIndex + 1).padStart(2, '0');
  return [
    { category: 'Beverage', amount: 120, date: `${yyyy}-${mm}-01`, payment: 'Cash' },
    { category: 'Food', amount: 230, date: `${yyyy}-${mm}-02`, payment: 'Cash' },
    { category: 'Cigarette', amount: 310, date: `${yyyy}-${mm}-03`, payment: 'Bank' },
    { category: 'Misc', amount: 60, date: `${yyyy}-${mm}-03`, payment: 'E-wallet' },
    { category: 'Food', amount: 180, date: `${yyyy}-${mm}-05`, payment: 'Cash' },
    { category: 'Beverage', amount: 95, date: `${yyyy}-${mm}-08`, payment: 'Bank' }
  ];
}

async function fetchMonthlySales(year, monthIndex) {
  const key = 'salesRecordsLocal';
  let list = [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) list = JSON.parse(raw);
  } catch {}
  if (!Array.isArray(list) || list.length === 0) list = sampleSales(year, monthIndex);

  const { start, end } = getMonthBounds(year, monthIndex);
  const startMs = +new Date(start.getFullYear(), start.getMonth(), 1, 0, 0, 0, 0);
  const endMs = +new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  return list
    .map(r => ({
      category: r.category || 'Misc',
      amount: Number(r.amount) || 0,
      date: parseRecordDate(r.date),
      payment: r.payment || ''
    }))
    .filter(r => Number.isFinite(r.date.getTime()) && r.date.getTime() >= startMs && r.date.getTime() <= endMs);
}

function computeSummary(rows, year, monthIndex) {
  const { daysInMonth } = getMonthBounds(year, monthIndex);
  const totalsByDay = new Array(daysInMonth).fill(0);
  const daysWithSales = new Set();
  const totalsByCategory = new Map();

  let sum = 0;
  for (const r of rows) {
    const day = r.date.getDate();
    totalsByDay[day - 1] += r.amount;
    sum += r.amount;
    daysWithSales.add(day);
    const prev = totalsByCategory.get(r.category) || 0;
    totalsByCategory.set(r.category, prev + r.amount);
  }

  const avg = daysWithSales.size ? (sum / daysWithSales.size) : 0;
  let topCategory = '—';
  if (totalsByCategory.size) {
    topCategory = Array.from(totalsByCategory.entries()).sort((a, b) => b[1] - a[1])[0][0];
  }
  return { sum, avg, topCategory, totalsByDay, totalsByCategory };
}

async function renderTrendChart(labels, data) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;
  if (trendChart) {
    trendChart.destroy();
  }
  const Chart = await ensureChart();
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Sales (RM)',
        data,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgba(79, 70, 229, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${formatRM(ctx.parsed.y)}`
          }
        }
      }
    }
  });
}

async function renderCategoryChart(entries) {
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  if (categoryChart) {
    categoryChart.destroy();
  }
  const labels = entries.map(e => e[0]);
  const data = entries.map(e => e[1]);
  const colors = [
    '#4f46e5','#22c55e','#f59e0b','#ef4444','#06b6d4','#a855f7','#84cc16','#f97316'
  ];
  const Chart = await ensureChart();
  categoryChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length])
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const l = ctx.label || '';
              const v = ctx.parsed || 0;
              return `${l}: ${formatRM(v)}`;
            }
          }
        }
      }
    }
  });
}

async function refresh() {
  showLoading(true, true);
  try {
    const now = new Date();
    const value = monthPicker.value; // yyyy-mm
    const y = value ? Number(value.split('-')[0]) : now.getFullYear();
    const m = value ? Number(value.split('-')[1]) - 1 : now.getMonth();

    // Try warm data from localStorage instantly
    const cacheKey = `salesDash:${y}-${m+1}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      hydrateAndRender(parsed, y, m);
    }

    const rows = await fetchMonthlySales(y, m);
    localStorage.setItem(cacheKey, JSON.stringify(rows.map(r => ({
      category: r.category,
      amount: r.amount,
      date: r.date.getTime(),
      payment: r.payment
    }))));
    hydrateAndRender(rows, y, m);
    // Wire export
    const btn = document.getElementById('export-csv-sales');
    if (btn) {
      btn.onclick = () => exportCSV(rows);
    }
    const { sum, avg, topCategory, totalsByDay, totalsByCategory } = computeSummary(rows, y, m);

    sumMonthlyEl.textContent = formatRM(sum);
    avgDailyEl.textContent = formatRM(avg);
    topCategoryEl.textContent = topCategory;

    // Trend chart labels 1..days
    const { daysInMonth } = getMonthBounds(y, m);
    const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    renderTrendChart(labels, totalsByDay);

    // Category chart
    const entries = Array.from(totalsByCategory.entries());
    renderCategoryChart(entries);
  } catch (err) {
    console.error('Failed to load sales dashboard', err);
    alert('Failed to load sales data. See console for details.');
  } finally {
    showLoading(false);
  }
}

async function hydrateAndRender(rows, y, m) {
  const hydrated = rows.map(r => ({
    ...r,
    date: r.date instanceof Date ? r.date : new Date(r.date)
  }));
  const { sum, avg, topCategory, totalsByDay, totalsByCategory } = computeSummary(hydrated, y, m);
  sumMonthlyEl.textContent = formatRM(sum);
  avgDailyEl.textContent = formatRM(avg);
  topCategoryEl.textContent = topCategory;
  const { daysInMonth } = getMonthBounds(y, m);
  const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  await renderTrendChart(labels, totalsByDay);
  const entries = Array.from(totalsByCategory.entries());
  await renderCategoryChart(entries);
}

function exportCSV(rows) {
  if (!rows || !rows.length) return;
  const headers = ['category','amount','date','payment'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const dateStr = r.date instanceof Date ? r.date.toISOString().slice(0,10) : r.date;
    lines.push([r.category, r.amount, dateStr, r.payment || ''].join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sales.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function initMonthPicker() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  monthPicker.value = `${yyyy}-${mm}`;
  monthPicker.addEventListener('change', refresh);
  // Auto-refresh when localStorage sales data changes (e.g., from main page)
  window.addEventListener('storage', (e) => {
    if (e.key === 'salesRecordsLocal') {
      refresh();
    }
  });
}

// Init
initMonthPicker();
refresh();


