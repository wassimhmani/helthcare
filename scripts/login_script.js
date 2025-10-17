const host ='http://127.0.0.1/helthcaresystem/';
const form = document.getElementById('medicalLoginForm');
const employeeIdInput = document.getElementById('employeeId');
const passwordInput = document.getElementById('password');
const submitButton = document.getElementById('submitButton');
const buttonText = document.getElementById('buttonText');
const loadingSpinner = document.getElementById('loadingSpinner');
const roleOptions = document.querySelectorAll('.role-option');

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

// Role selection
roleOptions.forEach(option => {
    option.addEventListener('click', () => {
        roleOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedRole = option.dataset.role;
        
        // Ensure label/placeholder reflect current language
        const employeeLabel = document.querySelector('label[for="employeeId"]');
        if (window.t && employeeLabel) {
            // Keep the label as "Username or Email"
            if (t('employeeId.label')) {
                employeeLabel.textContent = t('employeeId.label');
            }
            if (t('employeeId.placeholder')) {
                employeeIdInput.setAttribute('placeholder', t('employeeId.placeholder'));
            }
        }
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

    // Validate role selection - allow doctor, secretary, or admin
    if (!selectedRole) {
        alert(t('alerts.selectRole'));
        return false;
    }
    
    if (selectedRole !== 'doctor' && selectedRole !== 'secretary') {
        alert(t('alerts.roleNotAllowed'));
        return false;
    }

    // Validate username/email
    const username = employeeIdInput.value.trim();
    if (!username) {
        showError(employeeIdInput, document.getElementById('employeeIdError'), t('errors.employeeId.required'));
        isValid = false;
    } else if (!validateUsername(username)) {
        showError(employeeIdInput, document.getElementById('employeeIdError'), 'Username must be at least 3 characters');
        isValid = false;
    }

    // Validate password
    const password = passwordInput.value;
    if (!password) {
        showError(passwordInput, document.getElementById('passwordError'), t('errors.password.required'));
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
        
        // Find user by username (or email) and password
        const user = systemUsers.find(u => 
            (u.username === username || u.email === username) && 
            u.password === password &&
            u.role === selectedRole
        );

        if (!user) {
            alert('❌ ' + t('alerts.invalidCredentials'));
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
        const roleName = user.role === 'doctor' ? t('role.doctor') : t('role.secretary');
        alert(`✅ ${t('alerts.welcomePrefix')} ${user.name}!\n${t('alerts.roleLabel')}: ${roleName}`);
        window.location.href ='agenda.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('❌ ' + t('alerts.loginFailed'));
    } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }
}

// Event listeners
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
document.getElementById('forgotPassword').addEventListener('click', (e) => {
    e.preventDefault();
    alert('🔐 ' + t('forgot.dialog'));
});

const supportLink = document.getElementById('supportLink');
if (supportLink) {
    supportLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert('📞 ' + t('support.dialog'));
    });
}