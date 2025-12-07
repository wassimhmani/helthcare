// Expense management module
// Exposes expense utilities globally for use across the app
(function(){
  // State
  var storedExpenses = [];
  var editingExpenseId = null;

  function loadExpenses(){
    try {
      storedExpenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
    } catch (e) {
      console.error('Error loading expenses:', e);
      storedExpenses = [];
    }
  }

  function saveExpenses(){
    localStorage.setItem('healthcareExpenses', JSON.stringify(storedExpenses));
  }
  function formatDateForStorage(date){
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Get total expenses for a specific date
  function getExpensesForDate(date){
    try {
      const dateStr = formatDateForStorage(date);
      const expenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
      const expensesForDate = expenses.filter(expense => {
        const raw = expense.date || expense.createdAt;
        if (!raw) return false;
        const onlyDate = String(raw).split('T')[0];
        return onlyDate === dateStr;
      });
      const total = expensesForDate.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
      return total;
    } catch {
      return 0;
    }
  }

  // Get total expenses within a date range [startDate, endDate]
  function getExpensesForPeriod(startDate, endDate){
    try {
      const expenses = JSON.parse(localStorage.getItem('healthcareExpenses') || '[]');
      const inRange = expenses.filter(exp => {
        const raw = exp.date || exp.createdAt;
        if (!raw) return false;
        const d = new Date(raw);
        return d >= startDate && d <= endDate;
      });
      const total = inRange.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      return { list: inRange, total };
    } catch {
      return { list: [], total: 0 };
    }
  }

  // Convenience: calculate today's expenses
  function calculateTodayExpenses(){
    loadExpenses();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const todayExpenses = storedExpenses.filter(exp => {
      const expenseDate = exp.date ? String(exp.date).split('T')[0] : '';
      return expenseDate === todayStr;
    });
    return todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount)||0), 0);
  }

  // Sync a single expense to backend database via expense_sync.php
  function syncExpenseToDatabase(expense){
    try {
      if (!expense || !expense.id) return;
      const rawDate = expense.date || expense.createdAt || new Date().toISOString();
      const expenseDate = String(rawDate).split('T')[0];
      const payload = {
        id: expense.id,
        expenseDate: expenseDate,
        category: expense.category || 'General',
        description: expense.description || '',
        amount: Number(expense.amount) || 0,
        createdAt: expense.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      fetch('api/expense_sync.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async res => {
          let data;
          try { data = await res.json(); } catch (_) { data = null; }
          if (!res.ok) {
            console.error('Expense sync failed:', res.status, data || await res.text());
            return;
          }
          console.log('Expense sync success:', data);
        })
        .catch(err => {
          console.error('Expense sync error:', err);
        });
    } catch (e) {
      console.error('Expense sync exception:', e);
    }
  }

  // UI helpers
  function updateExpensesDisplay(){
    const totalExpenses = calculateTodayExpenses();
    const allExpenseDisplays = document.querySelectorAll('#cabinetCashDisplay .font-semibold.text-gray-800');
    if (allExpenseDisplays.length >= 2) {
      allExpenseDisplays[1].textContent = totalExpenses.toFixed(2) + ' TND';
    }
  }

  function loadExpensesList(){
    const expenseList = document.getElementById('expenseList');
    if (!expenseList) return;

    // Show loading state
    expenseList.innerHTML = '<p class="text-gray-500 text-center py-8" data-translate="loading_expenses">Loading expenses...</p>';

    fetch('api/get_expenses.php')
      .then(async res => {
        let data;
        try { data = await res.json(); } catch (_) { data = null; }
        if (!res.ok || !data || data.status !== 'ok') {
          console.error('Failed to load expenses from API:', res.status, data);
          throw new Error('API error');
        }

        // Normalize API data into storedExpenses structure used by UI/edit/delete
        const apiExpenses = Array.isArray(data.expenses) ? data.expenses : [];
        storedExpenses = apiExpenses.map(e => ({
          id: e.id,
          description: e.description || '',
          amount: e.amount != null ? Number(e.amount) : 0,
          date: e.expenseDate || e.createdAt || new Date().toISOString(),
          createdAt: e.createdAt || null,
          updatedAt: e.updatedAt || null,
          category: e.category || 'General'
        }));

        if (storedExpenses.length === 0) {
          expenseList.innerHTML = '<p class="text-gray-500 text-center py-8" data-translate="no_expenses_found">No expenses found.</p>';
          return;
        }

        const sorted = [...storedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        expenseList.innerHTML = sorted.map(expense => `
      <div class="card p-4 mb-3 expense-item" data-expense-id="${expense.id}">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-semibold text-gray-900 mb-1">${expense.description}</div>
            <div class="text-sm text-gray-600">${new Date(expense.date).toLocaleDateString()}</div>
          </div>
          <div class="text-right ml-4">
            <div class="text-lg font-bold text-gray-900">${Number(expense.amount).toFixed(2)} TND</div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-sm btn-outline" onclick="editExpense('${expense.id}')" data-translate="edit">${window.t ? window.t('edit','Edit') : 'Edit'}</button>
          <button class="btn btn-sm btn-outline text-red-600" onclick="deleteExpense('${expense.id}')" data-translate="delete">${window.t ? window.t('delete','Delete') : 'Delete'}</button>
        </div>
      </div>
    `).join('');

        // Apply translations if available
        if (window.I18n && window.I18n.walkAndTranslate) {
          window.I18n.walkAndTranslate();
        }
      })
      .catch(err => {
        console.error('Error loading expenses from API, falling back to localStorage:', err);
        // Fallback: use existing localStorage-based data
        loadExpenses();
        if (storedExpenses.length === 0) {
          expenseList.innerHTML = '<p class="text-gray-500 text-center py-8" data-translate="no_expenses_found">No expenses found.</p>';
          return;
        }
        const sorted = [...storedExpenses].sort((a, b) => new Date(a.date) - new Date(b.date));
        expenseList.innerHTML = sorted.map(expense => `
      <div class="card p-4 mb-3 expense-item" data-expense-id="${expense.id}">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-semibold text-gray-900 mb-1">${expense.description}</div>
            <div class="text-sm text-gray-600">${new Date(expense.date).toLocaleDateString()}</div>
          </div>
          <div class="text-right ml-4">
            <div class="text-lg font-bold text-gray-900">${Number(expense.amount).toFixed(2)} TND</div>
          </div>
        </div>
        <div class="flex gap-2 mt-3">
          <button class="btn btn-sm btn-outline" onclick="editExpense('${expense.id}')" data-translate="edit">${window.t ? window.t('edit','Edit') : 'Edit'}</button>
          <button class="btn btn-sm btn-outline text-red-600" onclick="deleteExpense('${expense.id}')" data-translate="delete">${window.t ? window.t('delete','Delete') : 'Delete'}</button>
        </div>
      </div>
    `).join('');
      });
  }

  // Modal handlers
  function showExpensesModal(){
    const modal = document.getElementById('expensesModal');
    if (!modal) return;
    loadExpenses();
    switchExpenseTab('add');
    modal.classList.add('active');
    try { window.updateModalTranslations && window.updateModalTranslations(); } catch(e){}
  }

  function closeExpensesModal(){
    const modal = document.getElementById('expensesModal');
    if (!modal) return;
    modal.classList.remove('active');
    const form = document.getElementById('expenseForm');
    if (form) form.reset();
    editingExpenseId = null;
    const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
    if (submitBtn) submitBtn.textContent = window.t ? window.t('add_expense','Add Expense') : 'Add Expense';
  }

  function switchExpenseTab(tab){
    const addContent = document.getElementById('addExpenseContent');
    const viewContent = document.getElementById('viewExpensesContent');
    const addTab = document.getElementById('addExpenseTab');
    const viewTab = document.getElementById('viewExpensesTab');
    if (!addContent || !viewContent || !addTab || !viewTab) return;
    if (tab === 'add'){
      addContent.style.display = 'block';
      viewContent.style.display = 'none';
      addTab.className = 'btn btn-primary';
      viewTab.className = 'btn btn-secondary';
    } else {
      addContent.style.display = 'none';
      viewContent.style.display = 'block';
      addTab.className = 'btn btn-secondary';
      viewTab.className = 'btn btn-primary';
      loadExpensesList();
    }
  }

  // CRUD helpers exposed globally for buttons
  function editExpense(expenseId){
    const expense = storedExpenses.find(e => e.id === expenseId);
    if (!expense) return;
    editingExpenseId = expenseId;
    const form = document.getElementById('expenseForm');
    if (!form) return;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    switchExpenseTab('add');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = window.t ? window.t('save_changes','Save Changes') : 'Save Changes';
  }

  function deleteExpense(expenseId){
    if (!window.showTranslatedConfirm || !showTranslatedConfirm('confirm_delete_expense')) return;
    // Optimistically remove from local state / localStorage
    storedExpenses = storedExpenses.filter(e => e.id !== expenseId);
    saveExpenses();

    // Call backend to delete from database
    try {
      fetch('api/delete_expense.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expenseId })
      })
        .then(async res => {
          let data;
          try { data = await res.json(); } catch (_) { data = null; }
          if (!res.ok || !data || data.status !== 'ok') {
            console.error('Failed to delete expense from database:', res.status, data || await res.text());
          } else {
            console.log('Expense deleted from database:', data);
          }
        })
        .catch(err => {
          console.error('Error calling delete_expense API:', err);
        });
    } catch (e) {
      console.error('Exception while deleting expense from database:', e);
    }

    // Reload expenses in UI
    loadExpenses();
    loadExpensesList();
    updateExpensesDisplay();
    try { window.updateCabinetCashDisplay && window.updateCabinetCashDisplay(); } catch(e){}
    // Force refresh of daily agenda to update badges
    if (typeof window.renderDailyAgenda === 'function') {
      setTimeout(() => {
        window.renderDailyAgenda();
      }, 0);
    }
    if (typeof window.showTranslatedAlert === 'function') showTranslatedAlert('expense_deleted');
  }

  function filterExpenses(){
    const searchTerm = (document.getElementById('expenseSearch')?.value || '').toLowerCase();
    document.querySelectorAll('.expense-item').forEach(item => {
      const description = item.querySelector('.font-semibold')?.textContent.toLowerCase() || '';
      item.style.display = description.includes(searchTerm) ? 'block' : 'none';
    });
  }

  // Form submit listener
  document.addEventListener('DOMContentLoaded', function(){
    const expenseForm = document.getElementById('expenseForm');
    if (!expenseForm) return;
    expenseForm.addEventListener('submit', function(e){
      e.preventDefault();
      const description = document.getElementById('expenseDescription').value.trim();
      const amount = parseFloat(document.getElementById('expenseAmount').value);
      if (!description || !amount || amount <= 0) {
        alert('Please fill in all fields with valid values.');
        return;
      }
      if (editingExpenseId){
        const idx = storedExpenses.findIndex(e => e.id === editingExpenseId);
        if (idx !== -1){
          storedExpenses[idx].description = description;
          storedExpenses[idx].amount = amount;
          storedExpenses[idx].updatedAt = new Date().toISOString();
          // Sync updated expense to backend
          syncExpenseToDatabase(storedExpenses[idx]);
          // Prevent loadExpenses() from overwriting storedExpenses before syncExpenseToDatabase is called
          setTimeout(() => {
            loadExpenses();
          }, 0);
          saveExpenses();
          window.showTranslatedAlert && showTranslatedAlert('expense_updated');
        }
        editingExpenseId = null;
      } else {
        const now = new Date();
        const newExpense = {
          id: 'EXP-' + Date.now(),
          description,
          amount,
          // Store local date in YYYY-MM-DD format so it matches agenda's selected date
          date: formatDateForStorage(now),
          createdAt: now.toISOString()
        };
        storedExpenses.push(newExpense);
        // Sync new expense to backend
        syncExpenseToDatabase(newExpense);
        saveExpenses();
        window.showTranslatedAlert && showTranslatedAlert('expense_added');
      }
      expenseForm.reset();
      const submitBtn = expenseForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = window.t ? window.t('add_expense','Add Expense') : 'Add Expense';
      // Reload expenses to ensure fresh data
      loadExpenses();
      loadExpensesList();
      updateExpensesDisplay();
      try { window.updateCabinetCashDisplay && window.updateCabinetCashDisplay(); } catch(e){}
      // Force refresh of daily agenda to update badges
      if (typeof window.renderDailyAgenda === 'function') {
        // Use setTimeout to ensure localStorage write is complete
        setTimeout(() => {
          window.renderDailyAgenda();
        }, 0);
      }
      switchExpenseTab('view');
    });
    // Initialize
    loadExpenses();
  });

  // Expose globally
  window.getExpensesForDate = getExpensesForDate;
  window.getExpensesForPeriod = getExpensesForPeriod;
  window.calculateTodayExpenses = calculateTodayExpenses;
  window.updateExpensesDisplay = updateExpensesDisplay;
  window.loadExpensesList = loadExpensesList;
  window.showExpensesModal = showExpensesModal;
  window.closeExpensesModal = closeExpensesModal;
  window.switchExpenseTab = switchExpenseTab;
  window.editExpense = editExpense;
  window.deleteExpense = deleteExpense;
  window.filterExpenses = filterExpenses;
})();
