import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { db } from './firebase-config.js';

// UI Elements
const tabExpense = document.getElementById('tab-expense');
const tabSale = document.getElementById('tab-sale');
const formTitle = document.getElementById('form-title');
const form = document.getElementById('record-form');
const addCategoryBtn = document.getElementById('add-category');
const deleteCategoryBtn = document.getElementById('delete-category');
const expenseItemsContainer = document.getElementById('expense-items');
const addLineBtn = document.getElementById('add-line');
const paymentEl = document.getElementById('payment');
const dateEl = document.getElementById('date');
const notesEl = document.getElementById('notes');
const tbody = document.getElementById('records-tbody');
const loadingOverlay = document.getElementById('loading-overlay');
const totalSalesEl = document.getElementById('total-sales');
const totalExpensesEl = document.getElementById('total-expenses');
const netProfitEl = document.getElementById('net-profit');
const recordCountEl = document.getElementById('record-count');

// Chart (removed)

// State
let activeType = 'Expense'; // 'Expense' | 'Sale'
let unsubscribe = null;
let records = [];
let categories = []; // { id, name, type }
let unsubscribeCats = null;

function getCategorySelects() {
  return Array.from(expenseItemsContainer.querySelectorAll('.category-select'));
}

function getAmountInputs() {
  return Array.from(expenseItemsContainer.querySelectorAll('.amount-input'));
}

function populateCategoriesIntoSelect(selectEl) {
  const filtered = categories.filter(c => c.type === activeType);
  const options = filtered.length ? filtered : (
    activeType === 'Sale' ? [
      { name: 'Retail', type: 'Sale' },
      { name: 'Services', type: 'Sale' }
    ] : [
      { name: 'Food', type: 'Expense' },
      { name: 'Beverage', type: 'Expense' },
      { name: 'Supplies', type: 'Expense' },
      { name: 'Rent', type: 'Expense' },
      { name: 'Misc', type: 'Expense' }
    ]
  );
  selectEl.innerHTML = '';
  for (const c of options) {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    selectEl.appendChild(opt);
  }
}

function populateCategoriesAll() {
  for (const sel of getCategorySelects()) populateCategoriesIntoSelect(sel);
}

function createExpenseLine({ showRemove } = { showRemove: false }) {
  const row = document.createElement('div');
  row.className = 'expense-item grid grid-cols-1 sm:grid-cols-2 gap-2';
  row.innerHTML = `
    <div>
      <label class="block text-xs text-gray-500 mb-1">Category</label>
      <select class="category-select w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"></select>
    </div>
    <div>
      <label class="block text-xs text-gray-500 mb-1">Amount</label>
      <div class="flex items-center gap-2">
        <input class="amount-input w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500" type="number" min="0" step="0.01" placeholder="0.00" required>
        <button type="button" class="remove-line px-2 py-2 rounded-lg bg-white border border-gray-300 text-gray-500 hover:bg-gray-50" title="Remove line">−</button>
      </div>
    </div>
  `;
  expenseItemsContainer.appendChild(row);
  const sel = row.querySelector('.category-select');
  const rm = row.querySelector('.remove-line');
  populateCategoriesIntoSelect(sel);
  rm.classList.toggle('hidden', !showRemove);
  rm.addEventListener('click', () => {
    row.remove();
    updateAddLineState();
  });
  return row;
}

function updateAddLineState() {
  const count = expenseItemsContainer.querySelectorAll('.expense-item').length;
  addLineBtn.disabled = count >= 4;
  // Show remove buttons for rows after the first
  const items = Array.from(expenseItemsContainer.querySelectorAll('.expense-item'));
  items.forEach((item, idx) => {
    const btn = item.querySelector('.remove-line');
    if (!btn) return;
    btn.classList.toggle('hidden', idx === 0);
  });
}

function setTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateEl.value = `${yyyy}-${mm}-${dd}`;
}

function setActiveTab(type) {
  activeType = type;
  const isExpense = type === 'Expense';
  tabExpense.setAttribute('data-active', String(isExpense));
  tabSale.setAttribute('data-active', String(!isExpense));
  formTitle.textContent = isExpense ? 'Add Expense' : 'Add Sale';
  populateCategoriesAll();
}

tabExpense.addEventListener('click', () => setActiveTab('Expense'));
tabSale.addEventListener('click', () => setActiveTab('Sale'));

function showLoading(show) {
  if (!loadingOverlay) return;
  loadingOverlay.classList.toggle('hidden', !show);
  loadingOverlay.classList.toggle('flex', show);
  if (show) {
    // Safety: never block UI for long; auto-hide shortly
    window.clearTimeout(showLoading._t);
    showLoading._t = window.setTimeout(() => {
      loadingOverlay.classList.add('hidden');
      loadingOverlay.classList.remove('flex');
    }, 1200);
  }
}

function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(value).replace('MYR', 'RM');
}

function renderTable(data) {
  tbody.innerHTML = '';
  for (const rec of data) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="px-4 py-3 whitespace-nowrap text-gray-700">${rec.date}</td>
      <td class="px-4 py-3 whitespace-nowrap">
        <span class="px-2 py-1 rounded-full text-xs font-medium ${rec.type === 'Sale' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${rec.type}</span>
      </td>
      <td class="px-4 py-3 whitespace-nowrap text-gray-700">${rec.category}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right font-medium ${rec.type === 'Sale' ? 'text-green-600' : 'text-red-600'}">${formatCurrency(rec.amount)}</td>
      <td class="px-4 py-3 whitespace-nowrap text-gray-700">${rec.payment}</td>
      <td class="px-4 py-3 text-gray-600">${rec.notes ? rec.notes : ''}</td>
      <td class="px-4 py-3 whitespace-nowrap text-right">
        <button data-id="${rec.id}" class="delete-record text-sm text-red-600 hover:text-red-700">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  recordCountEl.textContent = `${data.length} ${data.length === 1 ? 'record' : 'records'}`;

  // Wire delete buttons
  tbody.querySelectorAll('.delete-record').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (!id) return;
      try {
        await deleteDoc(doc(collection(db, 'records'), id));
      } catch (err) {
        console.error('Failed to delete record', err);
        alert('Failed to delete record. Check console for details.');
      }
    });
  });
}

function computeSummary(data) {
  let sales = 0;
  let expenses = 0;
  for (const r of data) {
    if (r.type === 'Sale') sales += Number(r.amount) || 0;
    else expenses += Number(r.amount) || 0;
  }
  const profit = sales - expenses;
  totalSalesEl.textContent = formatCurrency(sales);
  totalExpensesEl.textContent = formatCurrency(expenses);
  netProfitEl.textContent = formatCurrency(profit);
  netProfitEl.classList.toggle('text-green-600', profit >= 0);
  netProfitEl.classList.toggle('text-red-600', profit < 0);
}

// Chart helpers removed

function upsertFromSnapshot(snapshot) {
  const list = [];
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    list.push({ id: docSnap.id, ...data });
  });
  // Sort by createdAt desc, fallback to date desc
  list.sort((a, b) => {
    const aa = a.createdAt ?? new Date(a.date).getTime();
    const bb = b.createdAt ?? new Date(b.date).getTime();
    return bb - aa;
  });
  records = list;
  renderTable(records);
  computeSummary(records);
  // Mirror Sale records to localStorage for sales-dashboard
  try {
    const sales = records
      .filter(r => r.type === 'Sale')
      .map(r => ({
        category: r.category,
        amount: Number(r.amount) || 0,
        date: r.date,
        payment: r.payment || ''
      }));
    localStorage.setItem('salesRecordsLocal', JSON.stringify(sales));
    // Notify other tabs/pages
    window.dispatchEvent(new StorageEvent('storage', { key: 'salesRecordsLocal', newValue: JSON.stringify(sales) }));
  } catch (e) {
    console.warn('Failed to mirror sales to localStorage', e);
  }
  // Mirror Expense records to localStorage for expense-dashboard
  try {
    const expenses = records
      .filter(r => r.type === 'Expense')
      .map(r => ({
        category: r.category,
        amount: Number(r.amount) || 0,
        date: r.date,
        notes: r.notes || ''
      }));
    localStorage.setItem('expensesRecords', JSON.stringify(expenses));
    window.dispatchEvent(new StorageEvent('storage', { key: 'expensesRecords', newValue: JSON.stringify(expenses) }));
  } catch (e) {
    console.warn('Failed to mirror expenses to localStorage', e);
  }
}

function initRealtime() {
  const col = collection(db, 'records');
  const q = query(col, orderBy('createdAt', 'desc'));
  unsubscribe = onSnapshot(q, (snapshot) => {
    showLoading(false);
    upsertFromSnapshot(snapshot);
  }, (err) => {
    showLoading(false);
    console.error('Realtime error', err);
    // Fallback: try without ordering
    try {
      const fallbackUnsub = onSnapshot(col, (snap2) => {
        upsertFromSnapshot(snap2);
      }, (err2) => console.error('Realtime fallback error', err2));
      unsubscribe = fallbackUnsub;
    } catch (e) {
      console.error('Failed to attach fallback listener', e);
    }
  });
}

function initCategoriesRealtime() {
  const col = collection(db, 'categories');
  unsubscribeCats = onSnapshot(col, (snapshot) => {
    const list = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      list.push({ id: docSnap.id, ...data });
    });
    // sort alpha
    list.sort((a, b) => a.name.localeCompare(b.name));
    categories = list;
    populateCategories();
  }, (err) => console.error('Categories realtime error', err));
}

function populateCategories() { /* legacy no-op */ }

addCategoryBtn.addEventListener('click', async () => {
  const name = prompt(`Add ${activeType} Category`);
  if (!name) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  // prevent duplicates (case-insensitive) for this type
  const exists = categories.some(c => c.type === activeType && c.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    alert('Category already exists.');
    return;
  }
  try {
    await addDoc(collection(db, 'categories'), {
      name: trimmed,
      type: activeType,
      createdAt: Date.now()
    });
    // select new category in the first line item
    const firstSelect = getCategorySelects()[0];
    if (firstSelect) {
      populateCategoriesIntoSelect(firstSelect);
      firstSelect.value = trimmed;
    }
    // also update others
    populateCategoriesAll();
  } catch (err) {
    console.error('Failed to add category', err);
    alert('Failed to add category. Check console for details.');
  }
});

deleteCategoryBtn.addEventListener('click', async () => {
  const firstSelect = getCategorySelects()[0];
  const selected = firstSelect ? firstSelect.value : '';
  if (!selected) return;
  const isDefault = ['Food','Beverage','Supplies','Rent','Misc','Retail','Services'].includes(selected);
  const proceed = confirm(`Delete category "${selected}" for ${activeType}?${isDefault ? '\n(Note: default sample categories are not stored in Firestore.)' : ''}`);
  if (!proceed) return;

  // find matching category doc by name+type
  const match = categories.find(c => c.type === activeType && c.name === selected);
  if (!match) {
    // If it's a default (not persisted), just remove from UI for now
    populateCategoriesAll();
    return;
  }
  try {
    await deleteDoc(doc(collection(db, 'categories'), match.id));
  } catch (err) {
    console.error('Failed to delete category', err);
    alert('Failed to delete category. Check console for details.');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const amountInputs = getAmountInputs();
  const categorySelects = getCategorySelects();
  const lineItems = amountInputs.map((inp, idx) => ({
    amount: parseFloat(inp.value),
    category: categorySelects[idx] ? categorySelects[idx].value : ''
  })).filter(li => !Number.isNaN(li.amount) && li.amount > 0);

  if (activeType === 'Expense') {
    if (lineItems.length === 0) {
      alert('Please enter at least one expense line with amount > 0');
      return;
    }
    if (lineItems.length > 4) {
      alert('Maximum 4 expense lines per submission');
      return;
    }
    try {
      const colRef = collection(db, 'records');
      await Promise.all(lineItems.map(li => addDoc(colRef, {
        type: 'Expense',
        category: li.category,
        amount: li.amount,
        payment: paymentEl.value,
        date: dateEl.value,
        notes: notesEl.value.trim(),
        createdAt: Date.now()
      })));
      // reset amounts only; keep date/payment/notes
      for (const inp of amountInputs) inp.value = '';
      if (amountInputs[0]) amountInputs[0].focus();
    } catch (err) {
      console.error('Failed to add expense records', err);
      alert('Failed to add expense records. Check console for details.');
    }
  } else {
    // Sale: support multiple line items (3-4 sales per record)
    if (lineItems.length === 0) {
      alert('Please enter at least one sale line with amount > 0');
      return;
    }
    if (lineItems.length > 4) {
      alert('Maximum 4 sale lines per submission');
      return;
    }
    try {
      const colRef = collection(db, 'records');
      await Promise.all(lineItems.map(li => addDoc(colRef, {
        type: 'Sale',
        category: li.category,
        amount: li.amount,
        payment: paymentEl.value,
        date: dateEl.value,
        notes: notesEl.value.trim(),
        createdAt: Date.now()
      })));
      // reset amounts only; keep date/payment/notes
      for (const inp of amountInputs) inp.value = '';
      if (amountInputs[0]) amountInputs[0].focus();
    } catch (err) {
      console.error('Failed to add sale records', err);
      alert('Failed to add sale records. Check console for details.');
    }
  }
});

// Initialize
setTodayDate();
setActiveTab('Expense');
// Do not block UI on start; data will stream in when ready
showLoading(false);
initRealtime();
initCategoriesRealtime();
// Ensure there is at least one expense line item on load
if (expenseItemsContainer && expenseItemsContainer.querySelectorAll('.expense-item').length === 0) {
  createExpenseLine({ showRemove: false });
  updateAddLineState();
}
populateCategoriesAll();

// Add-line handler
if (addLineBtn) {
  addLineBtn.addEventListener('click', () => {
    const count = expenseItemsContainer.querySelectorAll('.expense-item').length;
    if (count >= 4) return;
    createExpenseLine({ showRemove: true });
    updateAddLineState();
  });
}


