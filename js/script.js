document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navbarLinks = document.querySelector('.navbar-links');
    const authButtons = document.querySelector('.auth-buttons');

    // Toggle mobile menu
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        hamburger.classList.toggle('active');
        navbarLinks.classList.toggle('active');
        authButtons.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const isClickInside = navbarLinks.contains(e.target) || 
                              authButtons.contains(e.target) || 
                              hamburger.contains(e.target);
        
        if (!isClickInside && navbarLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navbarLinks.classList.remove('active');
            authButtons.classList.remove('active');
        }
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.navbar-links a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navbarLinks.classList.remove('active');
            authButtons.classList.remove('active');
        });
    });

    // Check if user is logged in and update nav buttons
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, update auth buttons
                updateNavForLoggedInUser(user);
            } else {
                // No user is signed in, keep default buttons
                updateNavForLoggedOutUser();
            }
        });
    }

    function updateNavForLoggedInUser(user) {
        const authButtonsDiv = document.querySelector('.auth-buttons');
        if (authButtonsDiv) {
            authButtonsDiv.innerHTML = `
                <div class="user-menu">
                    <button class="user-btn">
                        <span class="user-name">${user.displayName || 'User'}</span>
                        <i class="fas fa-user-circle"></i>
                    </button>
                    <div class="user-dropdown">
                        <a href="profile.html"><i class="fas fa-user"></i> My Profile</a>
                        <a href="rides.html"><i class="fas fa-car"></i> My Rides</a>
                        <a href="settings.html"><i class="fas fa-cog"></i> Settings</a>
                        <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
                    </div>
                </div>
            `;

            // Toggle user dropdown
            const userBtn = document.querySelector('.user-btn');
            if (userBtn) {
                userBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent event from bubbling up
                    document.querySelector('.user-dropdown').classList.toggle('active');
                });

                // Close dropdown when clicking outside
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.user-menu')) {
                        document.querySelector('.user-dropdown')?.classList.remove('active');
                    }
                });
            }

            // Handle logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    firebase.auth().signOut().then(() => {
                        // Sign-out successful
                        window.location.reload();
                    }).catch((error) => {
                        // An error happened
                        console.error('Logout error:', error);
                    });
                });
            }
        }
    }

    function updateNavForLoggedOutUser() {
        const authButtonsDiv = document.querySelector('.auth-buttons');
        if (authButtonsDiv) {
            authButtonsDiv.innerHTML = `
                <button class="login-btn" onclick="location.href='login.html'">Log In</button>
                <button class="signup-btn" onclick="location.href='signup.html'">Sign Up</button>
            `;
        }
    }

    // Login and signup buttons (for pages where they're directly in the navbar)
    const loginBtn = document.querySelector('.login-btn:not([onclick])');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    const signupBtn = document.querySelector('.signup-btn:not([onclick])');
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    }

    // Add shadow to navbar on scroll
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 10) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}); 