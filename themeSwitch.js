function setTheme(theme) {
    console.log('Setting theme:', theme);
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.body.style.backgroundColor = '#121212';
        console.log('Dark theme applied');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.body.style.backgroundColor = '#FFFFFF';
        console.log('Light theme applied');
    } else {
        document.body.classList.remove('dark-theme', 'light-theme');
        document.body.style.backgroundColor = '';
        console.log('System theme applied');
    }
    localStorage.setItem('theme', theme);
    updateFallingCharsColor(theme);
    updateActiveButton(theme);
    console.log('Body background color:', document.body.style.backgroundColor);
}

function updateFallingCharsColor(theme) {
    if (typeof shapeColor !== 'undefined') {
        shapeColor = theme === 'dark' ? '#FFFFFF' : '#000000';
    }
}

function updateActiveButton(theme) {
    const buttons = document.querySelectorAll('.theme-buttons button');
    buttons.forEach(button => button.classList.remove('active'));
    
    if (theme === 'light') {
        document.getElementById('lightTheme').classList.add('active');
    } else if (theme === 'dark') {
        document.getElementById('darkTheme').classList.add('active');
    } else if (theme === 'system') {
        document.getElementById('systemTheme').classList.add('active');
    }
}

function applySystemTheme() {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDarkMode ? 'dark' : 'light');
    document.getElementById('systemTheme').classList.add('active');
}

function initThemeButtons() {
    const lightButton = document.getElementById('lightTheme');
    const darkButton = document.getElementById('darkTheme');
    const systemButton = document.getElementById('systemTheme');

    if (lightButton && darkButton && systemButton) {
        lightButton.addEventListener('click', () => setTheme('light'));
        darkButton.addEventListener('click', () => setTheme('dark'));
        systemButton.addEventListener('click', () => {
            setTheme('system');
            applySystemTheme();
        });
    } else {
        console.error('Theme buttons not found');
    }
}

// Apply saved theme or system preference on page load
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
    } else {
        setTheme('system');
        applySystemTheme();
    }
}

// Listen for system theme changes
function listenForSystemThemeChanges() {
    window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
        if (localStorage.getItem('theme') === 'system') {
            applySystemTheme();
        }
    });
}

// Initialize everything when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const isMainPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if (isMainPage) {
        // Create and append theme buttons only on the main page
        const themeButtonsContainer = document.createElement('div');
        themeButtonsContainer.className = 'theme-buttons';
        themeButtonsContainer.innerHTML = `
            <button id="lightTheme">Light</button>
            <button id="darkTheme">Dark</button>
            <button id="systemTheme">System</button>
        `;
        document.querySelector('.container').appendChild(themeButtonsContainer);
    }

    initThemeButtons();
    initTheme();
    listenForSystemThemeChanges();
});

document.addEventListener('keydown', function(e) {
    if (e.key.toLowerCase() === 'h') {
        // Toggle navigation and theme buttons
        const navContainer = document.querySelector('.nav-container');
        const themeButtons = document.querySelector('.theme-buttons');
        
        if (navContainer) {
            navContainer.style.display = navContainer.style.display === 'none' ? 'flex' : 'none';
        }
        
        if (themeButtons) {
            themeButtons.style.display = themeButtons.style.display === 'none' ? 'flex' : 'none';
        }

        // Toggle all lil-gui interfaces
        const guiElements = document.querySelectorAll('.lil-gui');
        guiElements.forEach(gui => {
            gui.style.display = gui.style.display === 'none' ? 'block' : 'none';
        });
    }
});