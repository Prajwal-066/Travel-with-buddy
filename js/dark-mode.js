// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Check for saved user preference
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    // Set initial theme
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (document.getElementById('darkModeToggle')) {
            document.getElementById('darkModeToggle').checked = true;
        }
    }
    
    // Listen for toggle events
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode(this.checked);
        });
    }
    
    // Listen for navbar toggle button event
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', function() {
            const isDarkMode = document.body.classList.contains('dark-mode');
            toggleDarkMode(!isDarkMode);
            
            // Update toggle if it exists
            if (darkModeToggle) {
                darkModeToggle.checked = !isDarkMode;
            }
        });
    }
});

// Function to toggle dark mode
function toggleDarkMode(enableDark) {
    if (enableDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        
        // Update icon if it exists
        const darkModeIcon = document.getElementById('darkModeIcon');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
        }
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        
        // Update icon if it exists
        const darkModeIcon = document.getElementById('darkModeIcon');
        if (darkModeIcon) {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
        }
    }
} 