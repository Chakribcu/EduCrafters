/**
 * User Profile Page Functionality
 * Created by Chakridhar - April 2025
 * 
 * This script handles user profile management including:
 * - Viewing profile information
 * - Updating profile details
 * - Changing password
 * - Deleting account
 *
 * Note: The core functionality has been moved to common.js for better
 * code organization and to resolve the issue with renderProfilePage
 * not being defined.
 */

// This file is kept for reference, but all functionality now exists in common.js
  
  // Get the root element to render the page
  const rootElement = document.getElementById('root');
  
  try {
    // Render main profile page structure
    rootElement.innerHTML = `
      <header>
        <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
          <div class="container">
            <a class="navbar-brand fw-bold" href="/" onclick="routeToPage('/'); return false;">
              <span class="text-primary">EduCrafters</span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
              <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
              <ul class="navbar-nav me-auto">
                <li class="nav-item">
                  <a class="nav-link" href="/" onclick="routeToPage('/'); return false;">Home</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="/courses" onclick="routeToPage('/courses'); return false;">Courses</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="${currentUser.role === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'}" 
                     onclick="routeToPage('${currentUser.role === 'instructor' ? '/instructor/dashboard' : '/student/dashboard'}'); return false;">
                    Dashboard
                  </a>
                </li>
              </ul>
              <div id="authButtons" class="d-flex">
                <!-- Auth buttons will be dynamically inserted here -->
              </div>
            </div>
          </div>
        </nav>
      </header>
      
      <main class="my-5">
        <div class="container">
          <div class="row">
            <div class="col-md-3">
              <!-- Profile Sidebar -->
              <div class="list-group shadow-sm mb-4">
                <button class="list-group-item list-group-item-action active" id="profile-info-tab">
                  <i class="bi bi-person-circle me-2"></i>Profile Information
                </button>
                <button class="list-group-item list-group-item-action" id="change-password-tab">
                  <i class="bi bi-shield-lock me-2"></i>Change Password
                </button>
                <button class="list-group-item list-group-item-action" id="notification-settings-tab">
                  <i class="bi bi-bell me-2"></i>Notification Settings
                </button>
                <button class="list-group-item list-group-item-action" id="account-settings-tab">
                  <i class="bi bi-gear me-2"></i>Account Settings
                </button>
              </div>
              
              <div class="card shadow-sm">
                <div class="card-body">
                  <h6 class="card-title">Account Type</h6>
                  <p class="card-text mb-0">
                    <span class="badge bg-${currentUser.role === 'instructor' ? 'success' : 'primary'}">
                      <i class="bi bi-${currentUser.role === 'instructor' ? 'person-workspace' : 'mortarboard'} me-1"></i>
                      ${capitalize(currentUser.role)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-md-9">
              <!-- Profile Information Tab Content -->
              <div id="profile-info-content" class="tab-content active">
                <div class="card shadow-sm">
                  <div class="card-header bg-white">
                    <h4 class="mb-0">Profile Information</h4>
                  </div>
                  <div class="card-body">
                    <form id="profile-form">
                      <div class="mb-3">
                        <label for="name" class="form-label">Full Name</label>
                        <input type="text" class="form-control" id="name" value="${currentUser.name || ''}" required>
                      </div>
                      
                      <div class="mb-3">
                        <label for="email" class="form-label">Email Address</label>
                        <input type="email" class="form-control" id="email" value="${currentUser.email || ''}" required>
                      </div>
                      
                      <div class="mb-3">
                        <label for="bio" class="form-label">Bio</label>
                        <textarea class="form-control" id="bio" rows="3">${currentUser.bio || ''}</textarea>
                        <div class="form-text">Tell others a little about yourself</div>
                      </div>
                      
                      <div class="mb-3">
                        <label for="website" class="form-label">Website</label>
                        <input type="url" class="form-control" id="website" value="${currentUser.website || ''}">
                      </div>
                      
                      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" class="btn btn-primary" id="save-profile-btn">
                          <i class="bi bi-save me-2"></i>Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <!-- Change Password Tab Content -->
              <div id="change-password-content" class="tab-content">
                <div class="card shadow-sm">
                  <div class="card-header bg-white">
                    <h4 class="mb-0">Change Password</h4>
                  </div>
                  <div class="card-body">
                    <form id="password-form">
                      <div class="mb-3">
                        <label for="current-password" class="form-label">Current Password</label>
                        <input type="password" class="form-control" id="current-password" required>
                      </div>
                      
                      <div class="mb-3">
                        <label for="new-password" class="form-label">New Password</label>
                        <input type="password" class="form-control" id="new-password" required>
                        <div class="form-text">Password must be at least 8 characters long</div>
                      </div>
                      
                      <div class="mb-3">
                        <label for="confirm-password" class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control" id="confirm-password" required>
                      </div>
                      
                      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" class="btn btn-primary" id="change-password-btn">
                          <i class="bi bi-shield-lock me-2"></i>Update Password
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <!-- Notification Settings Tab Content -->
              <div id="notification-settings-content" class="tab-content">
                <div class="card shadow-sm">
                  <div class="card-header bg-white">
                    <h4 class="mb-0">Notification Settings</h4>
                  </div>
                  <div class="card-body">
                    <form id="notification-form">
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="email-notifications" ${currentUser.notifications?.email ? 'checked' : ''}>
                        <label class="form-check-label" for="email-notifications">Email Notifications</label>
                        <div class="form-text">Receive important updates and announcements via email</div>
                      </div>
                      
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="course-updates" ${currentUser.notifications?.courseUpdates ? 'checked' : ''}>
                        <label class="form-check-label" for="course-updates">Course Updates</label>
                        <div class="form-text">Get notified when courses you're enrolled in are updated</div>
                      </div>
                      
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="new-courses" ${currentUser.notifications?.newCourses ? 'checked' : ''}>
                        <label class="form-check-label" for="new-courses">New Course Announcements</label>
                        <div class="form-text">Be the first to know when new courses are available</div>
                      </div>
                      
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="marketing-emails" ${currentUser.notifications?.marketing ? 'checked' : ''}>
                        <label class="form-check-label" for="marketing-emails">Marketing Emails</label>
                        <div class="form-text">Receive special offers and promotions</div>
                      </div>
                      
                      <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                        <button type="submit" class="btn btn-primary" id="save-notifications-btn">
                          <i class="bi bi-save me-2"></i>Save Preferences
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
              
              <!-- Account Settings Tab Content -->
              <div id="account-settings-content" class="tab-content">
                <div class="card shadow-sm">
                  <div class="card-header bg-white">
                    <h4 class="mb-0">Account Settings</h4>
                  </div>
                  <div class="card-body">
                    <div class="mb-4">
                      <h5>Account Information</h5>
                      <p class="mb-1"><strong>Username:</strong> ${currentUser.username || currentUser.email}</p>
                      <p class="mb-1"><strong>Account Type:</strong> ${capitalize(currentUser.role)}</p>
                      <p class="mb-0"><strong>Member Since:</strong> ${new Date(currentUser.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="mb-4">
                      <h5>Privacy Settings</h5>
                      <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="profile-visibility" ${currentUser.settings?.publicProfile ? 'checked' : ''}>
                        <label class="form-check-label" for="profile-visibility">Public Profile</label>
                        <div class="form-text">Allow other users to view your profile information</div>
                      </div>
                    </div>
                    
                    <hr>
                    
                    <div class="mb-0">
                      <h5 class="text-danger">Danger Zone</h5>
                      <p class="text-muted">These actions are irreversible</p>
                      
                      <button class="btn btn-outline-danger" id="export-data-btn">
                        <i class="bi bi-file-earmark-arrow-down me-2"></i>Export My Data
                      </button>
                      
                      <button class="btn btn-outline-danger" id="delete-account-btn">
                        <i class="bi bi-trash me-2"></i>Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>
      
      <!-- Footer -->
      <footer class="bg-dark text-white py-4 mt-5">
        <div class="container">
          <div class="row">
            <div class="col-md-6">
              <h5>EduCrafters</h5>
              <p class="small">Empowering learners worldwide with quality education</p>
            </div>
            <div class="col-md-3">
              <h6>Quick Links</h6>
              <ul class="list-unstyled">
                <li><a href="/" class="text-white-50" onclick="routeToPage('/'); return false;">Home</a></li>
                <li><a href="/courses" class="text-white-50" onclick="routeToPage('/courses'); return false;">Courses</a></li>
              </ul>
            </div>
            <div class="col-md-3">
              <h6>Contact</h6>
              <ul class="list-unstyled text-white-50">
                <li>Email: support@educrafters.com</li>
                <li>Phone: +1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <hr class="my-2 border-secondary">
          <p class="mb-0">&copy; 2025 EduCrafters. All rights reserved.</p>
        </div>
      </footer>
      
      <!-- Delete Account Confirmation Modal -->
      <div class="modal fade" id="deleteAccountModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Delete Account</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p class="text-danger">Warning: This action cannot be undone.</p>
              <p>Are you sure you want to permanently delete your account? All your data, enrollments, and progress will be lost.</p>
              
              <div class="mb-3">
                <label for="delete-confirmation" class="form-label">Type "DELETE" to confirm</label>
                <input type="text" class="form-control" id="delete-confirmation">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirm-delete-btn" disabled>Delete Permanently</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Update auth buttons
    updateAuthButtons();
    
    // Setup event listeners for profile functionality
    setupProfileEventListeners();
    
  } catch (error) {
    console.error('Error rendering profile page:', error);
    rootElement.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          Error loading profile: ${error.message}
        </div>
        <a href="/" class="btn btn-primary" onclick="routeToPage('/'); return false;">
          <i class="bi bi-house me-2"></i>Return to Home
        </a>
      </div>
    `;
  }
}

// Setup profile page event listeners
function setupProfileEventListeners() {
  // Tab navigation
  const tabButtons = document.querySelectorAll('.list-group-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Show corresponding content
      const contentId = button.id.replace('-tab', '-content');
      document.getElementById(contentId).classList.add('active');
    });
  });
  
  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const updatedProfile = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        bio: document.getElementById('bio').value,
        website: document.getElementById('website').value
      };
      
      try {
        const response = await fetch('/api/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(updatedProfile)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        const data = await response.json();
        
        // Update current user data
        Object.assign(currentUser, data);
        
        // Show success message
        showSuccessToast('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
        showErrorToast(`Error updating profile: ${error.message}`);
      }
    });
  }
  
  // Password change form
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Validate passwords match
      if (newPassword !== confirmPassword) {
        showErrorToast('New passwords do not match');
        return;
      }
      
      // Validate password length
      if (newPassword.length < 8) {
        showErrorToast('Password must be at least 8 characters long');
        return;
      }
      
      try {
        const response = await fetch('/api/profile/password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update password');
        }
        
        // Reset form
        passwordForm.reset();
        
        // Show success message
        showSuccessToast('Password updated successfully');
      } catch (error) {
        console.error('Error updating password:', error);
        showErrorToast(`Error updating password: ${error.message}`);
      }
    });
  }
  
  // Notification settings form
  const notificationForm = document.getElementById('notification-form');
  if (notificationForm) {
    notificationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const notificationSettings = {
        email: document.getElementById('email-notifications').checked,
        courseUpdates: document.getElementById('course-updates').checked,
        newCourses: document.getElementById('new-courses').checked,
        marketing: document.getElementById('marketing-emails').checked
      };
      
      try {
        const response = await fetch('/api/profile/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ notifications: notificationSettings })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update notification settings');
        }
        
        // Update current user data
        if (!currentUser.notifications) {
          currentUser.notifications = {};
        }
        Object.assign(currentUser.notifications, notificationSettings);
        
        // Show success message
        showSuccessToast('Notification preferences saved');
      } catch (error) {
        console.error('Error updating notification settings:', error);
        showErrorToast(`Error saving preferences: ${error.message}`);
      }
    });
  }
  
  // Privacy settings
  const profileVisibilityToggle = document.getElementById('profile-visibility');
  if (profileVisibilityToggle) {
    profileVisibilityToggle.addEventListener('change', async (e) => {
      try {
        const response = await fetch('/api/profile/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            settings: {
              publicProfile: e.target.checked
            }
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update privacy settings');
        }
        
        // Update current user data
        if (!currentUser.settings) {
          currentUser.settings = {};
        }
        currentUser.settings.publicProfile = e.target.checked;
        
        // Show success message
        showSuccessToast('Privacy settings updated');
      } catch (error) {
        console.error('Error updating privacy settings:', error);
        showErrorToast(`Error updating settings: ${error.message}`);
        
        // Revert toggle state
        e.target.checked = !e.target.checked;
      }
    });
  }
  
  // Export data button
  const exportDataBtn = document.getElementById('export-data-btn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', async () => {
      try {
        showInfoToast('Preparing your data for export...');
        
        const response = await fetch('/api/profile/export', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to export data');
        }
        
        const data = await response.json();
        
        // Create a downloadable file
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `educrafters_data_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSuccessToast('Data exported successfully');
      } catch (error) {
        console.error('Error exporting data:', error);
        showErrorToast(`Error exporting data: ${error.message}`);
      }
    });
  }
  
  // Delete account button
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      // Show confirmation modal
      const deleteModal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
      deleteModal.show();
    });
  }
  
  // Delete confirmation input
  const deleteConfirmationInput = document.getElementById('delete-confirmation');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  
  if (deleteConfirmationInput && confirmDeleteBtn) {
    deleteConfirmationInput.addEventListener('input', (e) => {
      // Enable button only if input is "DELETE"
      confirmDeleteBtn.disabled = e.target.value !== 'DELETE';
    });
  }
  
  // Confirm delete account button
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/profile', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete account');
        }
        
        // Clear user data and auth token
        localStorage.removeItem('authToken');
        appState.isAuthenticated = false;
        currentUser = null;
        authToken = null;
        
        // Close modal
        const deleteModal = bootstrap.Modal.getInstance(document.getElementById('deleteAccountModal'));
        deleteModal.hide();
        
        // Show success message
        showSuccessToast('Your account has been deleted');
        
        // Redirect to home page
        setTimeout(() => {
          routeToPage('/');
        }, 1500);
      } catch (error) {
        console.error('Error deleting account:', error);
        showErrorToast(`Error deleting account: ${error.message}`);
      }
    });
  }
}