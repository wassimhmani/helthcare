// Synchronize partial payments with cabinet cash display
// This script hooks into the existing Payment API (from payement.js)
// and triggers an update of the cabinet cash widget whenever a
// consultation payment amount/status is changed.

(function () {
    function safeUpdateCabinetCashDisplay() {
        try {
            if (typeof window.updateCabinetCashDisplay === 'function') {
                window.updateCabinetCashDisplay();
            } else {
                console.warn('updateCabinetCashDisplay is not available when trying to refresh cabinet cash.');
            }

            // Also refresh the daily agenda so the top summary badges (including
            // "Cash Entry" / "Entrée de caisse") immediately reflect the
            // updated payment amounts for the currently selected date.
            if (typeof window.renderDailyAgenda === 'function') {
                window.renderDailyAgenda();
            }
        } catch (e) {
            console.error('Error updating cabinet cash display after partial payment:', e);
        }
    }

    function wrapPaymentFunction(fnName) {
        if (!window.Payment) {
            return;
        }

        var original = window.Payment[fnName];
        if (typeof original !== 'function') {
            return;
        }

        window.Payment[fnName] = function () {
            var result;
            try {
                result = original.apply(this, arguments);
            } catch (e) {
                console.error('Error in Payment.' + fnName + '():', e);
                // Even on error, attempt to refresh cash so UI does not get stuck
                safeUpdateCabinetCashDisplay();
                throw e;
            }

            // If the original returns a Promise (async function), refresh after it settles
            if (result && typeof result.then === 'function') {
                result
                    .then(function () {
                        safeUpdateCabinetCashDisplay();
                    })
                    .catch(function (err) {
                        console.error('Async error in Payment.' + fnName + '():', err);
                        // Still refresh cabinet cash to keep UI consistent
                        safeUpdateCabinetCashDisplay();
                    });
            } else {
                // Synchronous path
                safeUpdateCabinetCashDisplay();
            }

            return result;
        };
    }

    function initPartialPaymentCashSync() {
        if (!window.Payment) {
            // Payment API not ready yet; retry shortly
            setTimeout(initPartialPaymentCashSync, 200);
            return;
        }

        // When user adds or changes payment amounts/status, we want
        // the cabinet cash widget to reflect the new values.
        wrapPaymentFunction('addPartialPayment');
        wrapPaymentFunction('updateConsultationPaymentStatus');
        wrapPaymentFunction('handleConsultationPaymentStatusChange');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPartialPaymentCashSync);
    } else {
        initPartialPaymentCashSync();
    }
})();

