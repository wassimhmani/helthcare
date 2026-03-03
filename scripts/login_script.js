const host ='http://127.0.0.1/helthcaresystem/';
const form = document.getElementById('medicalLoginForm');
const employeeIdInput = document.getElementById('employeeId');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submitButton');
const buttonText = document.getElementById('buttonText');
const loadingSpinner = document.getElementById('loadingSpinner');
const roleOptions = document.querySelectorAll('.role-option');

// Translation function fallback
function translate(key, fallback = '') {
    if (window.t) {
        return window.t(key, fallback);
    }
    return fallback || key;
}

// Get system users from localStorage
function getSystemUsers() {
    try {
        const stored = localStorage.getItem('system_users');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
    // Return default users if none exist
    return [
        { role: 'doctor', username: 'doctor', password: 'doctor123', name: 'Dr. John Smith', email: 'doctor@clinic.com', status: 'active', id: 'user_default_1' },
        { role: 'secretary', username: 'secretary', password: 'secretary123', name: 'Alice Johnson', email: 'secretary@clinic.com', status: 'active', id: 'user_default_2' }
    ];
}

let selectedRole = '';

// Role selection - ensure DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const roleOptions = document.querySelectorAll('.role-option');
    
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            roleOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedRole = option.dataset.role;
            
            // Ensure label/placeholder reflect current language
            const employeeLabel = document.querySelector('label[for="employeeId"]');
            if (window.t && employeeLabel) {
                // Keep the label as "Username or Email"
                if (translate('employeeId.label')) {
                    employeeLabel.textContent = translate('employeeId.label');
                }
                if (translate('employeeId.placeholder')) {
                    employeeIdInput.setAttribute('placeholder', translate('employeeId.placeholder'));
                }
            }
        });
    });
});

function validateUsername(username) {
    // Allow username or email format
    if (!username || username.length < 3) {
        return false;
    }
    return true;
}

function showError(input, errorElement, message) {
    input.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

function clearError(input, errorElement) {
    input.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('show');
}

function clearAllErrors() {
    const inputs = [employeeIdInput, passwordInput];
    const errors = [
        document.getElementById('employeeIdError'),
        document.getElementById('passwordError')
    ];
    
    inputs.forEach((input, index) => {
        clearError(input, errors[index]);
    });
}

function validateForm() {
    clearAllErrors();
    let isValid = true;

    // Validate role selection - allow doctor or secretary
    if (!selectedRole) {
        alert('Please select a role (Doctor or Secretary)');
        return false;
    }
    
    if (selectedRole !== 'doctor' && selectedRole !== 'secretary') {
        alert('Invalid role selected');
        return false;
    }

    // Validate username/email
    const username = employeeIdInput.value.trim();
    if (!username) {
        showError(employeeIdInput, document.getElementById('employeeIdError'), translate('errors.employeeId.required'));
        isValid = false;
    } else if (!validateUsername(username)) {
        showError(employeeIdInput, document.getElementById('employeeIdError'), 'Username must be at least 3 characters');
        isValid = false;
    }

    // Validate password
    const password = passwordInput.value;
    if (!password) {
        showError(passwordInput, document.getElementById('passwordError'), translate('errors.password.required'));
        isValid = false;
    }

    return isValid;
}

async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    // Show loading state
    submitButton.disabled = true;
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'block';

    try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const username = employeeIdInput.value.trim();
        const password = passwordInput.value;

        // Get system users from localStorage
        const systemUsers = getSystemUsers();
        console.log('Available users:', systemUsers);
        console.log('Login attempt:', { username, password, selectedRole });
        
        // Find user by username (or email) and password
        const user = systemUsers.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password &&
            u.role === selectedRole
        );

        console.log('Found user:', user);

        if (!user) {
            alert('❌ Invalid credentials. Please check your username, password, and role selection.');
            return;
        }

        // Check if user account is active
        if (user.status === 'inactive') {
            alert('❌ Account is inactive. Please contact the administrator.');
            return;
        }

        // Store session with user details and permissions
        const session = { 
            role: user.role, 
            userId: user.id,
            username: user.username,
            email: user.email,
            name: user.name, 
            permissions: user.permissions || {},
            loggedInAt: Date.now() 
        };
        
        try { 
            localStorage.setItem('medconnect_session', JSON.stringify(session)); 
        } catch (error) {
            console.error('Error saving session:', error);
        }

        // Redirect
        const roleName = user.role === 'doctor' ? 'Doctor' : 'Secretary';
        alert(`✅ Welcome ${user.name}!\nRole: ${roleName}`);
        window.location.href ='agenda.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('❌ Login failed. Please try again.');
    } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

// Event listeners - ensure DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Clear errors on input
    employeeIdInput.addEventListener('input', () => {
        if (document.getElementById('employeeIdError').classList.contains('show')) {
            clearError(employeeIdInput, document.getElementById('employeeIdError'));
        }
    });

    passwordInput.addEventListener('input', () => {
        if (document.getElementById('passwordError').classList.contains('show')) {
            clearError(passwordInput, document.getElementById('passwordError'));
        }
    });

    // Footer link handlers
    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }

    const supportLink = document.getElementById('supportLink');
    if (supportLink) {
        supportLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('📞 For technical support, please contact your system administrator.');
        });
    }

    // Forgot password modal handlers
    setupForgotPasswordModal();
});

// Forgot Password Modal Functions
let resetSelectedRole = '';
let verifiedUser = null;

function setupForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    const closeModal = document.getElementById('closeModal');
    const verifyUserBtn = document.getElementById('verifyUserBtn');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const backToLoginBtn = document.getElementById('backToLoginBtn');
    const resetRoleOptions = document.querySelectorAll('#forgotPasswordModal .role-option');

    // Close modal
    if (closeModal) {
        closeModal.addEventListener('click', hideForgotPasswordModal);
    }

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideForgotPasswordModal();
        });
    }

    // Role selection in modal
    resetRoleOptions.forEach(option => {
        option.addEventListener('click', () => {
            resetRoleOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            resetSelectedRole = option.dataset.role;
        });
    });

    // Verify user button
    if (verifyUserBtn) {
        verifyUserBtn.addEventListener('click', verifyUserForReset);
    }

    // Reset password button
    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', performPasswordReset);
    }

    // Back to login button
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', hideForgotPasswordModal);
    }
}

function showForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        document.getElementById('step1').style.display = 'block';
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'none';
        document.getElementById('resetUsername').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        resetSelectedRole = '';
        verifiedUser = null;
        
        // Clear role selections
        document.querySelectorAll('#forgotPasswordModal .role-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Clear errors
        document.getElementById('resetUsernameError').textContent = '';
        document.getElementById('resetUsernameError').classList.remove('show');
    }
}

function hideForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function verifyUserForReset() {
    const username = document.getElementById('resetUsername').value.trim();
    const errorEl = document.getElementById('resetUsernameError');

    // Validate
    if (!username) {
        errorEl.textContent = 'Please enter your username or email';
        errorEl.classList.add('show');
        return;
    }

    if (!resetSelectedRole) {
        errorEl.textContent = 'Please select your role (Doctor or Secretary)';
        errorEl.classList.add('show');
        return;
    }

    // Check if user exists
    const systemUsers = getSystemUsers();
    const user = systemUsers.find(u => 
        (u.username === username || u.email === username) && 
        u.role === resetSelectedRole
    );

    if (!user) {
        errorEl.textContent = 'User not found. Please check your username/email and role.';
        errorEl.classList.add('show');
        return;
    }

    if (user.status === 'inactive') {
        errorEl.textContent = 'Account is inactive. Please contact administrator.';
        errorEl.classList.add('show');
        return;
    }

    // User verified - proceed to step 2
    verifiedUser = user;
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
}

async function performPasswordReset() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const newPasswordError = document.getElementById('newPasswordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');

    // Clear errors
    newPasswordError.textContent = '';
    newPasswordError.classList.remove('show');
    confirmPasswordError.textContent = '';
    confirmPasswordError.classList.remove('show');

    // Validate password
    if (!newPassword) {
        newPasswordError.textContent = 'Please enter a new password';
        newPasswordError.classList.add('show');
        return;
    }

    if (newPassword.length < 6) {
        newPasswordError.textContent = 'Password must be at least 6 characters';
        newPasswordError.classList.add('show');
        return;
    }

    if (newPassword !== confirmPassword) {
        confirmPasswordError.textContent = 'Passwords do not match';
        confirmPasswordError.classList.add('show');
        return;
    }

    // Call API to reset password
    try {
        const response = await fetch(host + 'api/reset_password.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('resetUsername').value.trim(),
                role: resetSelectedRole,
                newPassword: newPassword
            })
        });

        const result = await response.json();

        if (!response.ok || result.status === 'error') {
            confirmPasswordError.textContent = result.message || 'Failed to reset password';
            confirmPasswordError.classList.add('show');
            return;
        }

        // Also update localStorage for consistency
        const systemUsers = getSystemUsers();
        const userIndex = systemUsers.findIndex(u => u.id === verifiedUser.id);
        if (userIndex !== -1) {
            systemUsers[userIndex].password = newPassword;
            localStorage.setItem('system_users', JSON.stringify(systemUsers));
        }

        // Show success
        document.getElementById('step2').style.display = 'none';
        document.getElementById('step3').style.display = 'block';
    } catch (error) {
        console.error('Error resetting password:', error);
        confirmPasswordError.textContent = 'Network error. Please try again.';
        confirmPasswordError.classList.add('show');
    }
}