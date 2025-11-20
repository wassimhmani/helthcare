// Global logout handler moved from app_script.js
(function(){
  window.logout = function () {
    try {
      const ok = (typeof window.showTranslatedConfirm === 'function')
        ? showTranslatedConfirm('logout_confirm')
        : confirm('Are you sure you want to logout?');
      if (!ok) return;

      // Clear session data
      localStorage.removeItem('medconnect_session');

      // Redirect to login page (use replace to avoid back navigation into app)
      window.location.replace('loginForm.html');
    } catch (e) {
      console.error('Logout error:', e);
      // Fallback redirect
      window.location.href = 'loginForm.html';
    }
  };
})();
