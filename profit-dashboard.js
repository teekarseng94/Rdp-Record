// Profit Dashboard JavaScript
// This module handles profit analysis by category

// UI Elements
const monthPicker = document.getElementById('month-picker');
const exportCsvBtn = document.getElementById('export-csv-profit');
const loadingOverlay = document.getElementById('loading-overlay');
const totalProfitEl = document.getElementById('total-profit');
const topProfitCategoryEl = document.getElementById('top-profit-category');
const lowProfitCategoryEl = document.getElementById('low-profit-category');
const profitMarginEl = document.getElementById('profit-margin');
const categoryCountEl = document.getElementById('category-count');
const profitTbody = document.getElementById('profit-tbody');

// Chart elements
const profitCategoryChartEl = document.getElementById('profit-category-chart');
const profitTrendChartEl = document.getElementById('profit-trend-chart');
const salesExpensesChartEl = document.getElementById('sales-expenses-chart');

// State
let salesData = [];
let expensesData = [];
let profitData = {};
let charts = {};

// Initialize
function init() {
  setCurrentMonth();
  loadData();
  setupEventListeners();
}

function setCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  monthPicker.value = `${year}-${month}`;
}

function setupEventListeners() {
  monthPicker.addEventListener('change', loadData);
  exportCsvBtn.addEventListener('click', exportToCsv);
}

function showLoading(show) {
  if (!loadingOverlay) return;
  loadingOverlay.classList.toggle('hidden', !show);
  loadingOverlay.classList.toggle('flex', show);
}

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value).replace('MYR', 'RM');
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function loadData() {
  showLoading(true);
  
  // Load sales data from localStorage (mirrored from main.js)
  try {
    const salesJson = localStorage.getItem('salesRecordsLocal');
    salesData = salesJson ? JSON.parse(salesJson) : [];
  } catch (e) {
    console.warn('Failed to load sales data', e);
    salesData = [];
  }

  // Load expenses data from localStorage (mirrored from main.js)
  try {
    const expensesJson = localStorage.getItem('expensesRecords');
    expensesData = expensesJson ? JSON.parse(expensesJson) : [];
  } catch (e) {
    console.warn('Failed to load expenses data', e);
    expensesData = [];
  }

  // Filter data by selected month
  const selectedMonth = monthPicker.value;
  if (selectedMonth) {
    salesData = filterDataByMonth(salesData, selectedMonth);
    expensesData = filterDataByMonth(expensesData, selectedMonth);
  }

  calculateProfitData();
  renderProfitTable();
  updateSummaryCards();
  renderCharts();
  
  showLoading(false);
}

function filterDataByMonth(data, month) {
  return data.filter(item => {
    const itemDate = new Date(item.date);
    const itemMonth = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
    return itemMonth === month;
  });
}

function calculateProfitData() {
  profitData = {};
  
  // Calculate sales by category
  const salesByCategory = {};
  salesData.forEach(sale => {
    const category = sale.category || 'Uncategorized';
    salesByCategory[category] = (salesByCategory[category] || 0) + (Number(sale.amount) || 0);
  });

  // Calculate expenses by category
  const expensesByCategory = {};
  expensesData.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + (Number(expense.amount) || 0);
  });

  // Get all unique categories
  const allCategories = new Set([
    ...Object.keys(salesByCategory),
    ...Object.keys(expensesByCategory)
  ]);

  // Calculate profit for each category
  allCategories.forEach(category => {
    const sales = salesByCategory[category] || 0;
    const expenses = expensesByCategory[category] || 0;
    const profit = sales - expenses;
    const profitMargin = sales > 0 ? (profit / sales) * 100 : 0;

    profitData[category] = {
      sales,
      expenses,
      profit,
      profitMargin
    };
  });
}

function renderProfitTable() {
  profitTbody.innerHTML = '';
  
  const categories = Object.keys(profitData).sort((a, b) => {
    return profitData[b].profit - profitData[a].profit;
  });

  categories.forEach(category => {
    const data = profitData[category];
    const tr = document.createElement('tr');
    
    const profitClass = data.profit >= 0 ? 'text-green-600' : 'text-red-600';
    const marginClass = data.profitMargin >= 0 ? 'text-green-600' : 'text-red-600';
    
    tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">${category}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-gray-700">${formatCurrency(data.sales)}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right text-red-600">${formatCurrency(data.expenses)}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right font-medium ${profitClass}">${formatCurrency(data.profit)}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right font-medium ${marginClass}">${formatPercentage(data.profitMargin)}</td>
    `;
    profitTbody.appendChild(tr);
  });

  categoryCountEl.textContent = `${categories.length} ${categories.length === 1 ? 'category' : 'categories'}`;
}

function updateSummaryCards() {
  const categories = Object.keys(profitData);
  
  if (categories.length === 0) {
    totalProfitEl.textContent = 'RM 0.00';
    topProfitCategoryEl.textContent = '—';
    lowProfitCategoryEl.textContent = '—';
    profitMarginEl.textContent = '0%';
    return;
  }

  // Calculate total profit
  const totalProfit = categories.reduce((sum, category) => sum + profitData[category].profit, 0);
  totalProfitEl.textContent = formatCurrency(totalProfit);
  totalProfitEl.className = `text-2xl sm:text-3xl font-semibold mt-1 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`;

  // Find most and least profitable categories
  const sortedByProfit = categories.sort((a, b) => profitData[b].profit - profitData[a].profit);
  const topCategory = sortedByProfit[0];
  const lowCategory = sortedByProfit[sortedByProfit.length - 1];

  topProfitCategoryEl.textContent = topCategory ? `${topCategory} (${formatCurrency(profitData[topCategory].profit)})` : '—';
  lowProfitCategoryEl.textContent = lowCategory ? `${lowCategory} (${formatCurrency(profitData[lowCategory].profit)})` : '—';

  // Calculate overall profit margin
  const totalSales = categories.reduce((sum, category) => sum + profitData[category].sales, 0);
  const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  profitMarginEl.textContent = formatPercentage(overallMargin);
  profitMarginEl.className = `text-2xl sm:text-3xl font-semibold mt-1 ${overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`;
}

function renderCharts() {
  renderProfitCategoryChart();
  renderProfitTrendChart();
  renderSalesExpensesChart();
}

function renderProfitCategoryChart() {
  if (charts.profitCategory) {
    charts.profitCategory.destroy();
  }

  const categories = Object.keys(profitData);
  const profits = categories.map(cat => profitData[cat].profit);

  const ctx = profitCategoryChartEl.getContext('2d');
  charts.profitCategory = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Net Profit',
        data: profits,
        backgroundColor: profits.map(profit => profit >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
        borderColor: profits.map(profit => profit >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function renderProfitTrendChart() {
  if (charts.profitTrend) {
    charts.profitTrend.destroy();
  }

  // Calculate monthly profit for the last 6 months
  const months = [];
  const monthlyProfits = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Calculate profit for this month
    const monthSales = filterDataByMonth(JSON.parse(localStorage.getItem('salesRecordsLocal') || '[]'), monthStr);
    const monthExpenses = filterDataByMonth(JSON.parse(localStorage.getItem('expensesRecords') || '[]'), monthStr);
    
    const totalSales = monthSales.reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    monthlyProfits.push(totalSales - totalExpenses);
  }

  const ctx = profitTrendChartEl.getContext('2d');
  charts.profitTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Profit',
        data: monthlyProfits,
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function renderSalesExpensesChart() {
  if (charts.salesExpenses) {
    charts.salesExpenses.destroy();
  }

  const categories = Object.keys(profitData);
  const sales = categories.map(cat => profitData[cat].sales);
  const expenses = categories.map(cat => profitData[cat].expenses);

  const ctx = salesExpensesChartEl.getContext('2d');
  charts.salesExpenses = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [
        {
          label: 'Sales',
          data: sales,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

function exportToCsv() {
  const categories = Object.keys(profitData);
  if (categories.length === 0) {
    alert('No data to export');
    return;
  }

  const selectedMonth = monthPicker.value;
  const monthName = selectedMonth ? new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'All Time';

  let csv = `Profit Analysis - ${monthName}\n\n`;
  csv += 'Category,Sales,Expenses,Net Profit,Profit Margin\n';
  
  categories.forEach(category => {
    const data = profitData[category];
    csv += `${category},${data.sales},${data.expenses},${data.profit},${data.profitMargin.toFixed(1)}%\n`;
  });

  // Add summary
  const totalSales = categories.reduce((sum, cat) => sum + profitData[cat].sales, 0);
  const totalExpenses = categories.reduce((sum, cat) => sum + profitData[cat].expenses, 0);
  const totalProfit = totalSales - totalExpenses;
  const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

  csv += `\nTOTAL,${totalSales},${totalExpenses},${totalProfit},${overallMargin.toFixed(1)}%\n`;

  // Download CSV
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `profit-analysis-${selectedMonth || 'all-time'}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Listen for storage events to update data when other tabs make changes
window.addEventListener('storage', (e) => {
  if (e.key === 'salesRecordsLocal' || e.key === 'expensesRecords') {
    loadData();
  }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
