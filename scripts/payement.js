// Payment handling functions for Billing Management modal
// This file is responsible for the payment section logic in the Ready/Done Bills modal.

(function () {
    function getBillsFromStorage() {
        try {
            const raw = localStorage.getItem('healthcareBills') || '[]';
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error('Error parsing healthcareBills from localStorage:', e);
            return [];
        }
    }

    function saveBillsToStorage(bills) {
        try {
            localStorage.setItem('healthcareBills', JSON.stringify(bills || []));
        } catch (e) {
            console.error('Error saving healthcareBills to localStorage:', e);
        }
    }

    // Select a bill from the Done Bills list to populate the payment section
    function selectBillForPayment(billId) {
        if (!billId) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('bill_not_selected');
            }
            return;
        }

        const bills = getBillsFromStorage();
        const bill = bills.find(function (b) { return b && b.id === billId; });

        if (!bill) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('bill_not_found');
            } else {
                alert('Bill not found.');
            }
            return;
        }

        // Ensure the Payment tab is visible when a bill is selected
        if (typeof window.switchBillsTab === 'function') {
            window.switchBillsTab('payment');
        }

        const paymentSummaryMessage = document.getElementById('paymentSummaryMessage');
        const paymentDetails = document.getElementById('paymentDetails');
        const patientNameEl = document.getElementById('paymentPatientName');
        const billIdEl = document.getElementById('paymentBillId');
        const totalAmountEl = document.getElementById('paymentTotalAmount');
        const statusEl = document.getElementById('paymentStatus');

        if (paymentSummaryMessage) paymentSummaryMessage.classList.add('hidden');
        if (paymentDetails) paymentDetails.classList.remove('hidden');
        if (patientNameEl) patientNameEl.textContent = bill.patientName || '';
        if (billIdEl) billIdEl.textContent = bill.id || '';

        var totalNumber = typeof bill.total === 'number' ? bill.total : Number(bill.total || 0);
        if (totalAmountEl && !isNaN(totalNumber)) {
            totalAmountEl.textContent = totalNumber.toFixed(2) + ' TND';
        }
        if (statusEl) statusEl.textContent = bill.status || '';

        var paymentSection = document.getElementById('billingPaymentSection');
        if (paymentSection) {
            paymentSection.setAttribute('data-selected-bill-id', bill.id);
        }
    }

    // Mark the currently selected bill in the payment section as Paid
    function markBillAsPaid() {
        var paymentSection = document.getElementById('billingPaymentSection');
        if (!paymentSection) {
            return;
        }

        var billId = paymentSection.getAttribute('data-selected-bill-id');
        if (!billId) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('bill_not_selected');
            }
            return;
        }

        var bills = getBillsFromStorage();
        var index = bills.findIndex(function (b) { return b && b.id === billId; });
        if (index === -1) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('bill_not_found');
            }
            return;
        }

        try {
            bills[index].status = 'Paid';
            bills[index].updatedAt = new Date().toISOString();
            saveBillsToStorage(bills);

            if (typeof window.syncBillToDatabase === 'function') {
                window.syncBillToDatabase(bills[index]);
            }

            if (typeof window.renderDoneBills === 'function') {
                window.renderDoneBills();
            }

            // Refresh payment panel with updated status
            selectBillForPayment(billId);

            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('bill_marked_paid');
            }
        } catch (e) {
            console.error('Error marking bill as paid:', e);
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('error_marking_bill_paid');
            } else {
                alert('Error marking bill as paid.');
            }
        }
    }

    function handleConsultationPaymentStatusChange(selectEl, consultationId, previousStatus) {
        if (!selectEl || !consultationId) return;

        const newStatus = selectEl.value;
        if (!newStatus || newStatus === previousStatus) {
            return;
        }

        if (newStatus === 'partial') {
            const message = window.t
                ? window.t('enter_partial_payment_amount', 'Enter first payment amount (TND):')
                : 'Enter first payment amount (TND):';

            const input = window.prompt(message, '');

            if (input === null) {
                selectEl.value = previousStatus;
                return;
            }

            const normalizedInput = String(input).replace(',', '.').trim();
            const amount = Number(normalizedInput);

            if (isNaN(amount) || amount <= 0) {
                if (typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('invalid_partial_payment_amount');
                } else {
                    alert('Please enter a valid amount greater than 0.');
                }
                selectEl.value = previousStatus;
                return;
            }

            // Store the first partial payment amount together with the partial status
            updateConsultationPaymentStatus(consultationId, newStatus, { partialPaymentAmount: amount });
            return;
        }

        updateConsultationPaymentStatus(consultationId, newStatus);
    }

    // Update consultation payment status (Paid / Partial / Unpaid) in database
    async function updateConsultationPaymentStatus(consultationId, newStatus, options) {
        if (!consultationId || !newStatus) {
            return;
        }

        options = options || {};
        const skipAlerts = !!options.skipAlerts;
        const skipRefresh = !!options.skipRefresh;
        const hasPartialAmount = Object.prototype.hasOwnProperty.call(options, 'partialPaymentAmount');
        const partialPaymentAmount = hasPartialAmount ? options.partialPaymentAmount : undefined;

        try {
            const payload = {
                id: consultationId,
                paymentStatus: newStatus
            };

            if (hasPartialAmount) {
                payload.partialPaymentAmount = partialPaymentAmount;
            }

            const response = await fetch('api/update_consultation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error('Failed to update consultation payment status:', response.status);
                if (!skipAlerts && typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('error_updating_payment_status');
                }
                return;
            }

            let data = null;
            try {
                data = await response.json();
            } catch (_) { }

            if (!data || data.status !== 'ok') {
                console.error('Error response updating consultation payment status:', data);
                if (!skipAlerts && typeof window.showTranslatedAlert === 'function') {
                    window.showTranslatedAlert('error_updating_payment_status');
                }
                return;
            }

            // Sync local consultations cache so cash entry / cabinet cash reflect the new payment
            try {
                const rawConsultations = localStorage.getItem('consultations') || '[]';
                const consultations = JSON.parse(rawConsultations);
                if (Array.isArray(consultations)) {
                    const idx = consultations.findIndex(function (c) {
                        return c && String(c.id) === String(consultationId);
                    });
                    if (idx !== -1) {
                        const updated = Object.assign({}, consultations[idx]);
                        updated.paymentStatus = newStatus;
                        if (hasPartialAmount) {
                            updated.partialPaymentAmount = partialPaymentAmount;
                        }
                        updated.updatedAt = new Date().toISOString();
                        consultations[idx] = updated;
                        localStorage.setItem('consultations', JSON.stringify(consultations));
                    }
                }
            } catch (syncErr) {
                console.error('Error syncing local consultations after payment update:', syncErr);
            }

            // After local data is in sync, refresh cabinet cash and the daily agenda
            // so that the top "Cash Entry" badge reflects the new payment immediately.
            try {
                if (typeof window.updateCabinetCashDisplay === 'function') {
                    window.updateCabinetCashDisplay();
                }
                if (typeof window.renderDailyAgenda === 'function') {
                    window.renderDailyAgenda();
                }
            } catch (uiErr) {
                console.error('Error refreshing cash entry after payment update:', uiErr);
            }

            if (!skipAlerts && typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('payment_status_updated');
            }

            // Refresh list to reflect new status (unless explicitly suppressed)
            if (!skipRefresh) {
                renderPaymentConsultations();
            }
        } catch (e) {
            console.error('Exception updating consultation payment status:', e);
            if (!skipAlerts && typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('error_updating_payment_status');
            }
        }
    }

    // Add an additional partial payment for a consultation and update progress
    function addPartialPayment(consultationId, totalAmount, currentPartialAmount) {
        totalAmount = Number(totalAmount) || 0;
        currentPartialAmount = Number(currentPartialAmount) || 0;

        if (!consultationId || totalAmount <= 0) {
            return;
        }

        const message = window.t
            ? window.t('enter_additional_partial_payment_amount', 'Enter additional payment amount (TND):')
            : 'Enter additional payment amount (TND):';

        const input = window.prompt(message, '');
        if (input === null) {
            return;
        }

        const normalizedInput = String(input).replace(',', '.').trim();
        const additionalAmount = Number(normalizedInput);

        if (isNaN(additionalAmount) || additionalAmount <= 0) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('invalid_partial_payment_amount');
            } else {
                alert('Please enter a valid amount greater than 0.');
            }
            return;
        }

        const newTotal = currentPartialAmount + additionalAmount;

        if (newTotal > totalAmount) {
            if (typeof window.showTranslatedAlert === 'function') {
                window.showTranslatedAlert('partial_payment_exceeds_total');
            } else {
                alert('Partial payment cannot exceed the total consultation amount.');
            }
            return;
        }

        const newStatus = newTotal >= totalAmount ? 'paid' : 'partial';

        updateConsultationPaymentStatus(consultationId, newStatus, { partialPaymentAmount: newTotal });
    }

    // Render saved consultations in the Payment tab (all consultations done)
    async function renderPaymentConsultations() {
        const container = document.getElementById('paymentConsultationsContainer');
        if (!container) return;

        // Loading state
        container.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    <span data-translate="loading_ready_bills">Loading consultations...</span>
                </div>
            `;

        // Load consultations ONLY from database (via API), not from localStorage
        let consultations = [];
        try {
            const response = await fetch('api/get_consultations.php?all=1');
            if (!response.ok) {
                throw new Error('Failed to fetch consultations from database for payment tab: ' + response.status);
            }

            const data = await response.json();
            if (data && data.status === 'ok' && Array.isArray(data.consultations)) {
                consultations = data.consultations;
            } else {
                console.error('Invalid consultations API response for payment tab:', data);
                consultations = [];
            }
        } catch (err) {
            console.error('Error loading consultations from database for payment tab:', err);
            consultations = [];
        }

        // Track which consultations have already been auto-marked as paid (no act / free)
        window._paymentAutoPaidSynced = window._paymentAutoPaidSynced || {};
        const autoPaidSynced = window._paymentAutoPaidSynced;

        // Ensure patients list is loaded so we can resolve patient names
        const havePatientsInMemory = Array.isArray(window.storedPatients) && window.storedPatients.length > 0;
        const alreadyTriedFetch = !!window._paymentPatientsTriedFetch;

        // Try fetching patients from API at most once to avoid infinite loops
        if (!havePatientsInMemory && typeof window.fetchPatientsFromAPI === 'function'
            && !window._paymentPatientsLoading && !alreadyTriedFetch) {
            window._paymentPatientsLoading = true;
            window._paymentPatientsTriedFetch = true;

            window.fetchPatientsFromAPI()
                .then(function () {
                    window._paymentPatientsLoading = false;
                    // Re-render now that patients should be available (will NOT refetch due to flag)
                    renderPaymentConsultations();
                })
                .catch(function (e) {
                    console.error('Error fetching patients for payment tab:', e);
                    window._paymentPatientsLoading = false;
                });
            // Show loading state until patients are loaded
            return;
        }

        const patients = Array.isArray(window.storedPatients) ? window.storedPatients : (typeof window.getPatients === 'function' ? window.getPatients() : []);

        const sorted = consultations.slice().sort(function (a, b) {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateB - dateA;
        });

        if (sorted.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-6" data-translate="no_consultations">No consultations recorded yet.</p>';
            return;
        }

        container.innerHTML = sorted.map(function (c) {
            const patient = patients.find(function (p) {
                if (!p) return false;
                // Compare IDs as strings to avoid type mismatch issues
                return String(p.id) === String(c.patientId);
            });

            // Try multiple sources for patient name
            let patientName = c.patientName || c.patientFullName || '';
            if (!patientName && patient) {
                patientName = patient.fullName || patient.name || '';
            }
            if (!patientName && c.patient && typeof c.patient === 'object') {
                patientName = c.patient.fullName || c.patient.name || '';
            }
            if (!patientName) {
                patientName = 'Unknown Patient';
            }

            // Normalize payment status into paid / partial / unpaid for UI
            const rawStatus = (c.paymentStatus || '').toLowerCase();
            const hasAct = !!(c.consultationAct && String(c.consultationAct).trim());
            let normalizedStatus = 'unpaid';

            // If consultation has no act, treat it as free and paid by default in UI
            if (!hasAct) {
                normalizedStatus = 'paid';
            } else if (rawStatus === 'paid') {
                normalizedStatus = 'paid';
            } else if (rawStatus === 'partial' || rawStatus === 'partially_paid') {
                normalizedStatus = 'partial';
            }

            // Persist the default paid status to the database for free consultations
            if (!hasAct && rawStatus !== 'paid' && c.id && !autoPaidSynced[c.id]) {
                autoPaidSynced[c.id] = true;
                // Background update without alerts or re-render to avoid loops
                updateConsultationPaymentStatus(c.id, 'paid', { skipAlerts: true, skipRefresh: true });
            }

            const paymentStatusLabel = (function () {
                if (normalizedStatus === 'paid') {
                    return window.t ? window.t('paid_status', 'Paid') : 'Paid';
                }
                if (normalizedStatus === 'partial') {
                    return window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid';
                }
                return window.t ? window.t('unpaid_status', 'Unpaid') : 'Unpaid';
            })();

            const paymentStatusClass = normalizedStatus === 'paid'
                ? 'bg-green-100 text-green-800'
                : (normalizedStatus === 'partial'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800');

            const created = new Date(c.createdAt || c.date);
            const dateStr = isNaN(created) ? '' : created.toLocaleString();

            // Compute consultation amount from consultationAct using bill descriptions (tariffs)
            let consultationAmountLabel = '-';
            let numericAmount = null;
            try {
                const rawActs = c.consultationAct || '';
                const actNames = rawActs
                    ? rawActs.split('|').map(function (s) { return s.trim(); }).filter(function (v) { return v; })
                    : [];
                const hasActs = actNames.length > 0;
                let amount = null;

                if (hasActs && typeof window.getBillDescriptions === 'function') {
                    const descriptions = window.getBillDescriptions();
                    if (Array.isArray(descriptions)) {
                        actNames.forEach(function (actName) {
                            const match = descriptions.find(function (d) {
                                return d && d.name === actName;
                            });
                            if (match) {
                                const price = typeof match.price === 'number' ? match.price : Number(match.price || 0);
                                if (!isNaN(price)) {
                                    if (amount === null) amount = 0;
                                    amount += price;
                                }
                            }
                        });
                    }
                }

                // Fallback: use any amount stored directly on consultation
                if (amount === null && typeof c.consultationAmount === 'number' && !isNaN(c.consultationAmount)) {
                    amount = c.consultationAmount;
                }

                // If no act and no explicit amount, treat consultation as free (0 TND)
                if (!hasActs && amount === null) {
                    amount = 0;
                }

                // Apply 8% tax to the consultation base amount (align with bill total)
                if (amount !== null) {
                    const taxRate = 0.08;
                    const totalWithTax = amount + (amount * taxRate);
                    numericAmount = totalWithTax;
                    consultationAmountLabel = totalWithTax.toFixed(2) + ' TND';
                }
            } catch (e) {
                console.error('Error computing consultation amount in payment tab:', e);
            }

            // Build partial payment progress bar if applicable
            let partialProgressHtml = '';
            let partialAmount = null;
            if (typeof c.partialPaymentAmount === 'number' && !isNaN(c.partialPaymentAmount)) {
                partialAmount = c.partialPaymentAmount;
            } else if (c.partialPaymentAmount !== undefined && c.partialPaymentAmount !== null && c.partialPaymentAmount !== '') {
                const parsedPartial = Number(c.partialPaymentAmount);
                if (!isNaN(parsedPartial)) {
                    partialAmount = parsedPartial;
                }
            }

            if (normalizedStatus === 'partial' && numericAmount !== null && numericAmount > 0 && partialAmount !== null && partialAmount >= 0) {
                const clampedPartial = Math.min(partialAmount, numericAmount);
                const progressPercent = Math.round((clampedPartial / numericAmount) * 100);
                const paidLabel = clampedPartial.toFixed(2) + ' / ' + numericAmount.toFixed(2) + ' TND';
                const progressLabel = window.t ? window.t('partial_payment_progress', 'Payment progress') : 'Payment progress';

                partialProgressHtml = `
                                <div class="mt-2">
                                    <div class="flex justify-between text-[11px] text-gray-500 mb-1">
                                        <span>${progressLabel}</span>
                                        <span>${paidLabel} (${progressPercent}%)</span>
                                    </div>
                                    <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div class="h-2 bg-green-500" style="width: ${progressPercent}%;"></div>
                                    </div>
                                </div>
                            `;
            }

            // Optional button to add further partial payments when consultation is already partially paid
            let addPartialPaymentButtonHtml = '';
            if (normalizedStatus === 'partial' && numericAmount !== null && numericAmount > 0) {
                const safePartialAmount = partialAmount !== null ? partialAmount : 0;
                const buttonLabel = window.t ? window.t('add_partial_payment', 'Add payment') : 'Add payment';
                addPartialPaymentButtonHtml = `
                                <button type="button"
                                        class="ml-2 px-2 py-1 text-xs rounded border border-green-500 text-green-700 hover:bg-green-50"
                                        onclick="if (window.Payment && Payment.addPartialPayment) { Payment.addPartialPayment('${c.id}', ${numericAmount}, ${safePartialAmount}); }">
                                    ${buttonLabel}
                                </button>
                            `;
            }

            // Only allow changing status when NOT already fully paid
            let statusControlsHtml = '';
            if (normalizedStatus !== 'paid') {
                // When partially paid, do not allow going back to unpaid
                if (normalizedStatus === 'partial') {
                    statusControlsHtml = `
                                <select class="form-select text-xs" onchange="if (window.Payment && Payment.handleConsultationPaymentStatusChange) { Payment.handleConsultationPaymentStatusChange(this, '${c.id}', '${normalizedStatus}'); }">
                                    <option value="partial" selected>${window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid'}</option>
                                    <option value="paid">${window.t ? window.t('paid_status', 'Paid') : 'Paid'}</option>
                                </select>
                                ${addPartialPaymentButtonHtml}
                    `;
                } else {
                    // Unpaid: allow switching to partial or paid
                    statusControlsHtml = `
                                <select class="form-select text-xs" onchange="if (window.Payment && Payment.handleConsultationPaymentStatusChange) { Payment.handleConsultationPaymentStatusChange(this, '${c.id}', '${normalizedStatus}'); }">
                                    <option value="unpaid" selected>${window.t ? window.t('unpaid_status', 'Unpaid') : 'Unpaid'}</option>
                                    <option value="partial">${window.t ? window.t('partially_paid_status', 'Partially Paid') : 'Partially Paid'}</option>
                                    <option value="paid">${window.t ? window.t('paid_status', 'Paid') : 'Paid'}</option>
                                </select>
                                ${addPartialPaymentButtonHtml}
                    `;
                }
            }

            return `
                    <div class="card p-4">
                        <div class="flex items-center justify-between">
                            <div>
                                <div class="font-semibold">${patientName}</div>
                                <div class="text-sm text-gray-600">Consultation • ${dateStr}</div>
                                <div class="text-xs text-gray-500">${window.t ? window.t('consultation_amount', 'Consultation Amount') : 'Consultation Amount'}: ${consultationAmountLabel}</div>
                                <div class="text-xs mt-1">
                                    <span class="font-medium">${window.t ? window.t('payment_status', 'Payment Status') : 'Payment Status'}:</span>
                                    <span class="ml-1 px-2 py-0.5 rounded-full ${paymentStatusClass}">${paymentStatusLabel}</span>
                                </div>
                                ${partialProgressHtml}
                            </div>
                            <div class="flex items-center gap-2">
                                ${statusControlsHtml}
                            </div>
                        </div>
                    </div>
                `;
        }).join('');

        if (window.I18n && window.I18n.walkAndTranslate) {
            window.I18n.walkAndTranslate();
        }

        // After re-rendering the payment consultations list, also refresh
        // the cabinet cash widget and the daily agenda so that the top
        // "Cash Entry" badge reflects the latest payments without reload.
        try {
            if (typeof window.updateCabinetCashDisplay === 'function') {
                window.updateCabinetCashDisplay();
            }
            if (typeof window.renderDailyAgenda === 'function') {
                window.renderDailyAgenda();
            }
        } catch (e) {
            console.error('Error refreshing cash entry from payment tab:', e);
        }
    }

    // Expose public API on window
    window.Payment = window.Payment || {};
    window.Payment.selectBillForPayment = selectBillForPayment;
    window.Payment.markBillAsPaid = markBillAsPaid;
    window.Payment.updateConsultationPaymentStatus = updateConsultationPaymentStatus;
    window.Payment.handleConsultationPaymentStatusChange = handleConsultationPaymentStatusChange;
    window.Payment.addPartialPayment = addPartialPayment;
    window.renderPaymentConsultations = renderPaymentConsultations;
})();

