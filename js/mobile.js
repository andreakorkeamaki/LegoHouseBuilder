// Mobile-specific functionality

// Function to handle the mobile UI toggle
export function initMobileUI() {
    const mobileToggleBtn = document.getElementById('mobileToggle');
    const infoPanel = document.getElementById('info');
    
    // Hide the toggle button on desktop
    if (window.innerWidth > 768) {
        mobileToggleBtn.style.display = 'none';
    }
    
    // Toggle the collapsed state of the info panel
    mobileToggleBtn.addEventListener('click', () => {
        infoPanel.classList.toggle('collapsed');
        
        // Change the button text based on state
        if (infoPanel.classList.contains('collapsed')) {
            mobileToggleBtn.textContent = '≡'; // Hamburger icon when collapsed
        } else {
            mobileToggleBtn.textContent = '×'; // X icon when expanded
        }
    });
    
    // Handle orientation changes
    window.addEventListener('orientationchange', adjustForOrientation);
    window.addEventListener('resize', adjustForOrientation);
    
    // Initial adjustment
    adjustForOrientation();
}

// Adjust UI based on orientation
function adjustForOrientation() {
    const infoPanel = document.getElementById('info');
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth <= 768;
    
    // Reset any inline styles that might interfere
    infoPanel.style.height = '';
    
    // Apply specific adjustments for mobile landscape
    if (isMobile && isLandscape) {
        // Additional landscape-specific adjustments can be added here
        // Most styling is handled by CSS media queries
    }
    
    // For very small screens, ensure the panel isn't too tall
    if (window.innerHeight < 500) {
        infoPanel.style.maxHeight = '50vh';
    }
}

// Handle touch events for better mobile experience
export function initTouchInteractions() {
    // Prevent pinch zoom on the canvas
    document.getElementById('container').addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Add touch-specific event handling if needed
    // This can be expanded based on specific mobile interaction requirements
}

// Detect if the device is a mobile device
export function isMobileDevice() {
    return (window.innerWidth <= 768) || 
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}
