// Firebase Authentication Logic
document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth.js loaded");
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error("Firebase is not defined! Make sure Firebase SDK is loaded before this script.");
        return;
    }
    
    console.log("Firebase version:", firebase.SDK_VERSION);
    
    try {
        // Check Firebase Auth
        console.log("Firebase Auth available:", !!firebase.auth);
        
        // Check Firestore
        console.log("Firebase Firestore available:", !!firebase.firestore);
    } catch (error) {
        console.error("Error checking Firebase modules:", error);
    }

    // Auth state observer
    firebase.auth().onAuthStateChanged(function(user) {
        console.log("Auth state changed. User logged in:", !!user);
        if (user) {
            console.log("User info:", user.email, user.displayName);
        }
        updateUIForAuthState(user);
    });

    // Login form submission
    const loginForm = document.querySelector('#login form');
    if (loginForm) {
        console.log("Login form found");
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Login form submitted");
            
            // Clear previous errors
            const errorElement = document.getElementById('loginError');
            errorElement.classList.add('d-none');
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            console.log("Attempting to login with email:", email);
            
            // Sign in with email and password
            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // User signed in
                    const user = userCredential.user;
                    console.log('User logged in successfully:', user.email);
                    
                    // Show success alert
                    alert('You are logged in successfully!');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (modal) modal.hide();
                })
                .catch((error) => {
                    // Show error message
                    console.error('Login error code:', error.code);
                    console.error('Login error message:', error.message);
                    errorElement.textContent = error.message;
                    errorElement.classList.remove('d-none');
                });
        });
    } else {
        console.log("Login form not found");
    }
    
    // Google Sign In
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    if (googleSignInBtn) {
        console.log("Google sign in button found");
        googleSignInBtn.addEventListener('click', function() {
            console.log("Google sign in button clicked");
            const provider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    // User signed in with Google
                    const user = result.user;
                    console.log("Google sign in successful:", user.email);
                    
                    // Check if this is a new user
                    const isNewUser = result.additionalUserInfo.isNewUser;
                    console.log("Is new user:", isNewUser);
                    
                    if (isNewUser) {
                        // Save user data to Firestore
                        return firebase.firestore().collection('users').doc(user.uid).set({
                            name: user.displayName,
                            email: user.email,
                            phone: user.phoneNumber || '',
                            photoURL: user.photoURL || '',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } else {
                        // Update last login
                        return firebase.firestore().collection('users').doc(user.uid).update({
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                })
                .then(() => {
                    console.log('Google sign-in data saved to Firestore');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (modal) modal.hide();
                })
                .catch((error) => {
                    console.error('Google Sign-in Error code:', error.code);
                    console.error('Google Sign-in Error message:', error.message);
                    alert('Google Sign-in Error: ' + error.message);
                });
        });
    } else {
        console.log("Google sign in button not found");
    }
    
    // Sign up form submission
    const signupForm = document.querySelector('#signup form');
    if (signupForm) {
        console.log("Signup form found");
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Signup form submitted");
            
            // Clear previous errors
            const errorElement = document.getElementById('signupError');
            errorElement.classList.add('d-none');
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const phone = document.getElementById('signupPhone').value;
            const password = document.getElementById('signupPassword').value;
            
            console.log("Attempting to create user with email:", email);
            
            // Create user with email and password
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // User created
                    const user = userCredential.user;
                    console.log("User created successfully:", user.uid);
                    
                    // Update profile with name
                    return user.updateProfile({
                        displayName: name
                    }).then(() => {
                        console.log("User profile updated with name:", name);
                        // Add user profile data to Firestore
                        return firebase.firestore().collection('users').doc(user.uid).set({
                            name: name,
                            email: email,
                            phone: phone,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                })
                .then(() => {
                    console.log('User registered successfully and data saved to Firestore');
                    
                    // Show success alert
                    alert('You are signed up successfully!');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    if (modal) modal.hide();
                })
                .catch((error) => {
                    // Show error message
                    console.error('Signup error code:', error.code);
                    console.error('Signup error message:', error.message);
                    errorElement.textContent = error.message;
                    errorElement.classList.remove('d-none');
                });
        });
    } else {
        console.log("Signup form not found");
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        console.log("Logout button found");
        logoutBtn.addEventListener('click', function() {
            console.log("Logout button clicked");
            firebase.auth().signOut()
                .then(() => {
                    console.log('User signed out successfully');
                    alert('You have been logged out');
                })
                .catch((error) => {
                    console.error('Sign out Error:', error);
                });
        });
    } else {
        console.log("Logout button not found");
    }
});

// Update UI based on authentication state
function updateUIForAuthState(user) {
    const navbarNav = document.getElementById('navbarNav');
    
    if (!navbarNav) return;
    
    if (user) {
        // User is signed in
        // Update the navbar to show profile info and logout option
        const authLinks = navbarNav.querySelector('.navbar-nav');
        const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
        
        if (loginBtn) {
            // Replace login button with user info and logout button
            const userElement = document.createElement('li');
            userElement.className = 'nav-item dropdown';
            userElement.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown">
                    <i class="fas fa-user-circle me-1"></i> ${user.displayName || user.email}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#">My Profile</a></li>
                    <li><a class="dropdown-item" href="#">My Rides</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
                </ul>
            `;
            
            loginBtn.parentNode.replaceWith(userElement);
            
            // Add logout event listener
            document.getElementById('logoutBtn').addEventListener('click', function() {
                firebase.auth().signOut();
            });
            
            // Setup dropdown toggle
            const dropdownToggle = new bootstrap.Dropdown(document.getElementById('userDropdown'));
        }
    } else {
        // User is signed out
        // Make sure the login button is visible if it's not
        const userDropdown = navbarNav.querySelector('.dropdown');
        const loginBtn = document.querySelector('[data-bs-target="#loginModal"]');
        
        if (userDropdown && !loginBtn) {
            // Replace user dropdown with login button
            const loginElement = document.createElement('li');
            loginElement.className = 'nav-item';
            loginElement.innerHTML = `
                <a class="btn btn-primary ms-lg-3" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Login / Sign up</a>
            `;
            
            userDropdown.replaceWith(loginElement);
        }
    }
} 