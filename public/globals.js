/**
 * Global Navbar Profile Picture Handler
 * This script manages the dynamic profile picture in the navbar across all pages
 */

// Global variable to store user's profile picture
let userProfilePicture = null;

/**
 * Fetches the current user's profile picture from the API
 * @returns {Promise<string|null>} Profile picture URL or null
 */
async function fetchUserProfilePicture() {
  try {
    const profileRes = await fetch('/me/profile-picture', { 
      credentials: 'include' 
    });
    
    if (profileRes.ok) {
      const profileData = await profileRes.json();
      return profileData.profilePicture || '/assets/images/defaultPFP.png';
    } else {
      console.warn('Failed to fetch profile picture, using default');
      return '/assets/images/defaultPFP.png';
    }
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return '/assets/images/defaultPFP.png';
  }
}

/**
 * Updates all profile picture elements in the navbar
 * @param {string} profilePictureUrl - URL of the profile picture
 */
function updateNavbarProfilePicture(profilePictureUrl) {
  // Common selectors for profile pictures in navbar
  const selectors = [
    '.profile-icon img',           // Most common pattern
    '.profile-icon a img',         // Wrapped in anchor tag
    '#navbar-profile-pic',         // ID-based selector
    '.navbar-profile-picture',     // Class-based selector
    'nav img[alt*="Profile"]',     // Alt text based
    'nav img[alt*="profile"]',     // Alt text based (lowercase)
    'a[href="account.html"] img',  // Account page link
    'a[href="/account.html"] img', // Account page link with slash
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(img => {
      // Only update if it looks like a profile picture
      const altText = img.alt?.toLowerCase() || '';
      const srcText = img.src?.toLowerCase() || '';
      
      if (altText.includes('profile') || 
          srcText.includes('pfp') || 
          srcText.includes('profile') ||
          img.classList.contains('profile-pic') ||
          img.closest('.profile-icon')) {
        
        img.src = profilePictureUrl;
        img.onerror = function() {
          this.src = '/assets/images/defaultPFP.png';
        };
        
        // Ensure proper styling for profile pictures
        if (!img.classList.contains('rounded-full')) {
          img.classList.add('rounded-full', 'object-cover');
        }
      }
    });
  });
}

/**
 * Initializes the profile picture in the navbar
 * Should be called when the page loads
 */
async function initializeNavbarProfilePicture() {
  try {
    // Check if user is authenticated first
    const meRes = await fetch('/me', { credentials: 'include' });
    if (!meRes.ok) {
      // User not authenticated, keep default images
      console.log('User not authenticated, keeping default profile pictures');
      return;
    }

    // Fetch and set profile picture
    userProfilePicture = await fetchUserProfilePicture();
    updateNavbarProfilePicture(userProfilePicture);
    
  } catch (error) {
    console.error('Error initializing navbar profile picture:', error);
    // Fallback to default
    updateNavbarProfilePicture('/assets/images/defaultPFP.png');
  }
}

async function refreshNavbarProfilePicture() {
  userProfilePicture = await fetchUserProfilePicture();
  updateNavbarProfilePicture(userProfilePicture);
}

// Auto-initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavbarProfilePicture);
} else {
  // DOM already loaded
  initializeNavbarProfilePicture();
}
