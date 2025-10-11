// Data source: localStorage or sample fallback
const LS_KEY = 'expensesRecords';

function getSampleData(year, monthIndex) {
  const yyyy = year;
  const mm = String(monthIndex + 1).padStart(2, '0');
  return [
    { category: 'Rent', amount: 1200, date: `${yyyy}-${mm}-01` },
    { category: 'Food', amount: 45.5, date: `${yyyy}-${mm}-01` },
    { category: 'Utilities', amount: 150, date: `${yyyy}-${mm}-03` },
    { category: 'Food', amount: 38.2, date: `${yyyy}-${mm}-04` },
    { category: 'Supplies', amount: 86.9, date: `${yyyy}-${mm}-05` },
    { category: 'Misc', amount: 22.0, date: `${yyyy}-${mm}-05` },
    { category: 'Food', amount: 60.1, date: `${yyyy}-${mm}-08` },
    { category: 'Rent', amount: 1200, date: `${yyyy}-${mm}-15` },
    { category: 'Utilities', amount: 152, date: `${yyyy}-${mm}-17` },
    { category: 'Supplies', amount: 34.7, date: `${yyyy}-${mm}-19` }
  ];
}

function loadExpenses(year, monthIndex) {
  const raw = localStorage.getItem(LS_KEY);
  let list = [];
  try {
    if (raw) list = JSON.parse(raw);
  } catch {}
  if (!Array.isArray(list) || list.length === 0) {
    list = getSampleData(year, monthIndex);
  }
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
  return list
    .map(r => ({ ...r, amount: Number(r.amount) || 0, dateObj: new Date(r.date) }))
    .filter(r => r.dateObj >= start && r.dateObj <= end);
}

function formatRM(value) {
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })
    .format(Number(value) || 0)
    .replace('MYR', 'RM');
}

function getMonthBounds(year, monthIndex) {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  const daysInMonth = end.getDate();
  return { start, end, daysInMonth };
}

function compute(expenses, year, monthIndex) {
  const { daysInMonth } = getMonthBounds(year, monthIndex);
  const byDay = new Array(daysInMonth).fill(0);
  const byCategory = new Map();
  let total = 0;
  const daysWithExpense = new Set();

  for (const r of expenses) {
    const day = r.dateObj.getDate();
    byDay[day - 1] += r.amount;
    total += r.amount;
    daysWithExpense.add(day);
    const prev = byCategory.get(r.category) || 0;
    byCategory.set(r.category, prev + r.amount);
  }

  const avg = daysWithExpense.size ? total / daysWithExpense.size : 0;
  let topCategory = '—';
  if (byCategory.size) topCategory = [...byCategory.entries()].sort((a,b) => b[1]-a[1])[0][0];
  return { total, avg, topCategory, byDay, byCategory };
}

function renderSummary({ total, avg, topCategory }) {
  document.getElementById('sum-monthly').textContent = formatRM(total);
  document.getElementById('avg-daily').textContent = formatRM(avg);
  document.getElementById('top-category').textContent = topCategory;
}

function renderTrend(labels, data) {
  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Expenses (RM)',
        data,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true }, x: { grid: { display: false } } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderCategory(byCategory) {
  const labels = [...byCategory.keys()];
  const data = [...byCategory.values()];
  const colors = ['#ef4444','#f59e0b','#06b6d4','#10b981','#8b5cf6','#84cc16','#f97316'];
  const ctx = document.getElementById('category-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: labels.map((_,i)=>colors[i%colors.length]) }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (c) => `${c.label}: ${formatRM(c.parsed)}` } }
      }
    }
  });
}

function exportCSV(rows) {
  if (!rows || !rows.length) return;
  const headers = ['category','amount','date','notes'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = [r.category, r.amount, r.date, r.notes ? `"${String(r.notes).replace(/"/g,'""')}"` : ''];
    lines.push(vals.join(','));
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expenses.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const m = now.getMonth();
  const mmStr = String(m + 1).padStart(2, '0');
  const monthPicker = document.getElementById('month-picker');
  monthPicker.value = `${yyyy}-${mmStr}`;

  const loadAndRender = () => {
    const [yy, mm] = monthPicker.value.split('-');
    const year = Number(yy);
    const monthIndex = Number(mm) - 1;
    const expenses = loadExpenses(year, monthIndex);
    renderSummary(compute(expenses, year, monthIndex));
    const { daysInMonth } = getMonthBounds(year, monthIndex);
    const comp = compute(expenses, year, monthIndex);
    const labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
    renderTrend(labels, comp.byDay);
    renderCategory(comp.byCategory);
    document.getElementById('export-csv').onclick = () => exportCSV(expenses);
  };

  monthPicker.addEventListener('change', loadAndRender);
  // Refresh when the main page updates localStorage
  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) loadAndRender();
  });
  loadAndRender();
}

init();


