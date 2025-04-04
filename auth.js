// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "travel-with-buddy.firebaseapp.com",
    projectId: "travel-with-buddy",
    storageBucket: "travel-with-buddy.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.auth-tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all tabs
            tabBtns.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            
            // Hide all forms
            document.querySelectorAll('.auth-form').forEach(form => {
                form.classList.remove('active');
            });
            
            // Show the target form
            const targetForm = document.getElementById(btn.dataset.target);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });
    
    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const passwordInput = toggle.parentElement.querySelector('input');
            const icon = toggle.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Password strength meter
    const signupPassword = document.getElementById('signup-password');
    if (signupPassword) {
        signupPassword.addEventListener('input', updatePasswordStrength);
    }
    
    function updatePasswordStrength() {
        const password = signupPassword.value;
        const strengthMeter = document.querySelector('.strength-meter span');
        const strengthText = document.querySelector('.strength-text span');
        
        // Calculate password strength
        let strength = 0;
        
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        // Update UI based on strength
        switch (strength) {
            case 0:
            case 1:
                strengthMeter.style.width = '20%';
                strengthMeter.style.backgroundColor = '#dc3545'; // red
                strengthText.textContent = 'Weak';
                break;
            case 2:
                strengthMeter.style.width = '40%';
                strengthMeter.style.backgroundColor = '#ffc107'; // yellow
                strengthText.textContent = 'Fair';
                break;
            case 3:
                strengthMeter.style.width = '60%';
                strengthMeter.style.backgroundColor = '#fd7e14'; // orange
                strengthText.textContent = 'Good';
                break;
            case 4:
                strengthMeter.style.width = '80%';
                strengthMeter.style.backgroundColor = '#20c997'; // teal
                strengthText.textContent = 'Strong';
                break;
            case 5:
                strengthMeter.style.width = '100%';
                strengthMeter.style.backgroundColor = '#198754'; // green
                strengthText.textContent = 'Very Strong';
                break;
        }
    }
    
    // Email Login Form
    const emailLoginForm = document.getElementById('email-login-form');
    if (emailLoginForm) {
        emailLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;
            
            // Validate input
            if (!email || !password) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            
            // Set persistence
            const persistence = remember ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
            
            auth.setPersistence(persistence)
                .then(() => {
                    // Sign in user
                    return auth.signInWithEmailAndPassword(email, password);
                })
                .then((userCredential) => {
                    // Login successful
                    showAlert('Login successful!', 'success');
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                })
                .catch((error) => {
                    console.error(error);
                    showAlert(error.message, 'error');
                });
        });
    }
    
    // Email Signup Form
    const emailSignupForm = document.getElementById('email-signup-form');
    if (emailSignupForm) {
        emailSignupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsAccepted = document.getElementById('terms').checked;
            
            // Validate input
            if (!fullname || !email || !password || !confirmPassword) {
                showAlert('Please fill in all fields', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showAlert('Passwords do not match', 'error');
                return;
            }
            
            if (!termsAccepted) {
                showAlert('Please accept the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            // Create user
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Update user profile
                    return userCredential.user.updateProfile({
                        displayName: fullname
                    });
                })
                .then(() => {
                    // Send email verification
                    return auth.currentUser.sendEmailVerification();
                })
                .then(() => {
                    // Signup successful
                    showAlert('Account created successfully! Please check your email for verification.', 'success');
                    
                    // Redirect to login page
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                })
                .catch((error) => {
                    console.error(error);
                    showAlert(error.message, 'error');
                });
        });
    }
    
    // Phone Login
    const phoneLoginForm = document.getElementById('phone-login-form');
    const sendCodeBtn = document.getElementById('send-code-btn');
    const verifyCodeBtn = document.getElementById('verify-code-btn');
    let verificationId = null;
    
    if (phoneLoginForm && sendCodeBtn && verifyCodeBtn) {
        sendCodeBtn.addEventListener('click', () => {
            const phoneNumber = document.getElementById('country-code').value + document.getElementById('phone').value;
            
            // Validate phone number
            if (!phoneNumber || phoneNumber.length < 8) {
                showAlert('Please enter a valid phone number', 'error');
                return;
            }
            
            // Setup recaptcha verifier
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('send-code-btn', {
                    'size': 'invisible',
                    'callback': function(response) {
                        // reCAPTCHA solved, allow sending verification code
                    }
                });
            }
            
            // Send verification code
            auth.signInWithPhoneNumber(phoneNumber, window.recaptchaVerifier)
                .then((confirmationResult) => {
                    // SMS sent
                    verificationId = confirmationResult;
                    
                    // Show verification code input
                    document.querySelector('.verify-section').style.display = 'block';
                    sendCodeBtn.style.display = 'none';
                    verifyCodeBtn.style.display = 'block';
                    
                    showAlert('Verification code sent to your phone', 'success');
                })
                .catch((error) => {
                    console.error(error);
                    showAlert(error.message, 'error');
                });
        });
        
        verifyCodeBtn.addEventListener('click', () => {
            const verificationCode = document.getElementById('verification-code').value;
            
            // Validate code
            if (!verificationCode || verificationCode.length !== 6) {
                showAlert('Please enter a valid verification code', 'error');
                return;
            }
            
            // Verify code
            if (verificationId) {
                verificationId.confirm(verificationCode)
                    .then((result) => {
                        // User signed in successfully
                        showAlert('Phone verification successful!', 'success');
                        
                        // Redirect to home page
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    })
                    .catch((error) => {
                        console.error(error);
                        showAlert('Invalid verification code', 'error');
                    });
            }
        });
        
        // Resend code
        document.querySelector('.resend-code').addEventListener('click', () => {
            // Hide verification section
            document.querySelector('.verify-section').style.display = 'none';
            sendCodeBtn.style.display = 'block';
            verifyCodeBtn.style.display = 'none';
            
            // Reset recaptcha
            window.recaptchaVerifier.render().then(function(widgetId) {
                grecaptcha.reset(widgetId);
            });
        });
    }
    
    // Phone Signup
    const phoneSignupForm = document.getElementById('phone-signup-form');
    const signupSendCodeBtn = document.getElementById('signup-send-code-btn');
    const signupVerifyCodeBtn = document.getElementById('signup-verify-code-btn');
    let signupVerificationId = null;
    
    if (phoneSignupForm && signupSendCodeBtn && signupVerifyCodeBtn) {
        signupSendCodeBtn.addEventListener('click', () => {
            const fullname = document.getElementById('phone-fullname').value;
            const phoneNumber = document.getElementById('signup-country-code').value + document.getElementById('signup-phone').value;
            const termsAccepted = document.getElementById('phone-terms').checked;
            
            // Validate input
            if (!fullname || !phoneNumber || phoneNumber.length < 8) {
                showAlert('Please fill in all fields correctly', 'error');
                return;
            }
            
            if (!termsAccepted) {
                showAlert('Please accept the Terms of Service and Privacy Policy', 'error');
                return;
            }
            
            // Setup recaptcha verifier
            if (!window.signupRecaptchaVerifier) {
                window.signupRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('signup-send-code-btn', {
                    'size': 'invisible',
                    'callback': function(response) {
                        // reCAPTCHA solved, allow sending verification code
                    }
                });
            }
            
            // Send verification code
            auth.signInWithPhoneNumber(phoneNumber, window.signupRecaptchaVerifier)
                .then((confirmationResult) => {
                    // SMS sent
                    signupVerificationId = confirmationResult;
                    
                    // Show verification code input
                    document.querySelector('#phone-signup .verify-section').style.display = 'block';
                    signupSendCodeBtn.style.display = 'none';
                    signupVerifyCodeBtn.style.display = 'block';
                    
                    showAlert('Verification code sent to your phone', 'success');
                })
                .catch((error) => {
                    console.error(error);
                    showAlert(error.message, 'error');
                });
        });
        
        signupVerifyCodeBtn.addEventListener('click', () => {
            const verificationCode = document.getElementById('signup-verification-code').value;
            const fullname = document.getElementById('phone-fullname').value;
            
            // Validate code
            if (!verificationCode || verificationCode.length !== 6) {
                showAlert('Please enter a valid verification code', 'error');
                return;
            }
            
            // Verify code and create account
            if (signupVerificationId) {
                signupVerificationId.confirm(verificationCode)
                    .then((result) => {
                        // Update user profile
                        return result.user.updateProfile({
                            displayName: fullname
                        });
                    })
                    .then(() => {
                        // Account created successfully
                        showAlert('Account created successfully!', 'success');
                        
                        // Redirect to home page
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    })
                    .catch((error) => {
                        console.error(error);
                        showAlert('Invalid verification code', 'error');
                    });
            }
        });
    }
    
    // Google Login/Signup
    const googleBtns = document.querySelectorAll('.google-btn');
    
    googleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    // Google sign-in successful
                    showAlert('Google sign-in successful!', 'success');
                    
                    // Redirect to home page
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                })
                .catch((error) => {
                    console.error(error);
                    showAlert(error.message, 'error');
                });
        });
    });
    
    // Alert function
    function showAlert(message, type) {
        // Create alert element if it doesn't exist
        let alertElement = document.querySelector('.auth-alert');
        
        if (!alertElement) {
            alertElement = document.createElement('div');
            alertElement.className = 'auth-alert';
            document.querySelector('.auth-content').prepend(alertElement);
        }
        
        // Set alert content and style
        alertElement.textContent = message;
        alertElement.className = `auth-alert ${type}`;
        
        // Show alert
        alertElement.style.display = 'block';
        
        // Hide alert after 5 seconds
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    }
    
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                // Redirect to home page if already logged in
                window.location.href = 'index.html';
            }
        }
    });
}); 
