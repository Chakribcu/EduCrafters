/**
 * Common utility functions for the EduCrafters application
 * Created by: Chakridhar
 */

// Initialize global state
window.appState = window.appState || { isAuthenticated: false };

/**
 * Updates the global authentication state
 * @param {string} token - JWT token
 * @param {Object} user - User object
 * @param {boolean} isAuthenticated - Whether the user is authenticated
 */
function updateAuthState(token, user, isAuthenticated) {
  console.log("Updating auth state:", {
    hasToken: !!token,
    hasUser: !!user,
    isAuthenticated: isAuthenticated,
  });

  // Update global variables (attaching to window for global scope)
  window.authToken = token;
  window.currentUser = user;
  window.appState.isAuthenticated = isAuthenticated;

  // Store in localStorage for persistence
  if (token && user) {
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));
  } else {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }
}

/**
 * Safely parses JSON avoiding errors
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} - Parsed object or fallback value
 */
function safeJSONParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

/**
 * Checks authentication state from localStorage on page load
 * Returns true if valid credentials were found
 */
function checkAuthFromStorage() {
  try {
    const storedToken = localStorage.getItem("authToken");
    const storedUserJSON = localStorage.getItem("user");

    if (!storedToken || !storedUserJSON) {
      console.log("No stored authentication found");
      return false;
    }

    // Try to parse the stored user JSON
    const storedUser = safeJSONParse(storedUserJSON);
    if (!storedUser) {
      console.log("Invalid stored user data");
      return false;
    }

    // Temporarily update auth state from storage (will validate with server next)
    updateAuthState(storedToken, storedUser, true);

    // Schedule a background verification of the token
    setTimeout(() => {
      verifyStoredAuth();
    }, 100);

    return true;
  } catch (error) {
    console.error("Error checking auth from storage:", error);
    return false;
  }
}

/**
 * Verifies the stored authentication with the server
 */
async function verifyStoredAuth() {
  // Skip verification if no token is stored
  if (!localStorage.getItem("authToken")) {
    return false;
  }

  try {
    const token = localStorage.getItem("authToken");
    console.log("Verifying stored auth token...");

    const response = await fetch("/api/auth/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.ok) {
      const userData = await response.json();
      console.log("Auth token verified successfully");

      // Update auth state with the fresh user data
      updateAuthState(token, userData, true);
      updateAuthButtons();
      return true;
    } else {
      console.log("Auth token invalid or expired, clearing auth state");

      // Clear auth state if token is invalid
      updateAuthState(null, null, false);
      updateAuthButtons();
      return false;
    }
  } catch (error) {
    console.error("Authentication error:", error);

    // Keep the user logged in on network errors to prevent logout on temp issues
    // But log the error for debugging
    return false;
  }
}

// Add a global event listener to check auth when the page loads
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, checking authentication");
  checkAuthFromStorage();
});
