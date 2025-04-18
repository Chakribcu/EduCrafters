/**
 * Lessons page functionality
 * Created by Chakridhar - April 2025
 * 
 * This script handles lesson viewing and management for courses
 * 
 * Note: The core functionality has been moved to common.js for better
 * code organization and to resolve the issue with renderLessonsManagementPage
 * not being defined.
 */

// This file is kept for reference, but all functionality now exists in common.js
    
    // Fetch lessons for this course
    const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`, {
      headers: {
        'Authorization': authToken ? `Bearer ${authToken}` : ''
      },
      credentials: 'include'
    });
    
    if (!lessonsResponse.ok) {
      const errorData = await lessonsResponse.json();
      throw new Error(errorData.message || 'Failed to fetch lessons');
    }
    
    const lessons = await lessonsResponse.json();
    
    // Check if user is authenticated
    const isAuthenticated = !!authToken && !!currentUser;
    
    // Check if user is enrolled in the course or is the instructor
    let isEnrolled = false;
    let isInstructor = false;
    
    if (isAuthenticated) {
      isInstructor = currentUser.role === 'instructor' && 
                     (course.instructorId == currentUser.id || course.instructor?.id == currentUser.id);
      
      // Check enrollment status
      const enrollmentResponse = await fetch(`/api/enrollment-status/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        credentials: 'include'
      });
      
      if (enrollmentResponse.ok) {
        const enrollmentData = await enrollmentResponse.json();
        isEnrolled = enrollmentData.isEnrolled;
      }
    }
    
    // Determine access - user can access if they're the instructor or enrolled
    const hasAccess = isInstructor || isEnrolled;
    
    // Render the page
    rootElement.innerHTML = `
      <div class="container mt-4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/" onclick="routeToPage('/'); return false;">Home</a></li>
            <li class="breadcrumb-item"><a href="/courses" onclick="routeToPage('/courses'); return false;">Courses</a></li>
            <li class="breadcrumb-item"><a href="/courses/${courseId}" onclick="routeToPage('/courses/${courseId}'); return false;">${course.title}</a></li>
            <li class="breadcrumb-item active">Lessons</li>
          </ol>
        </nav>
        
        <div class="row mb-4">
          <div class="col-md-8">
            <h1>${course.title} - Lessons</h1>
            <p class="lead">${course.description}</p>
          </div>
          <div class="col-md-4 text-md-end">
            ${isInstructor ? `
              <button id="addLessonBtn" class="btn btn-primary">
                <i class="bi bi-plus-circle me-2"></i>Add New Lesson
              </button>
            ` : ''}
            ${isAuthenticated && !hasAccess ? `
              <button id="enrollBtn" class="btn btn-primary" onclick="handleEnrollment(${courseId})">
                <i class="bi bi-journal-check me-2"></i>Enroll to Access Lessons
              </button>
            ` : ''}
          </div>
        </div>
        
        <div id="enrollmentMessage" class="alert alert-info d-none mb-4">
          <span id="enrollmentMessageText">Processing your enrollment...</span>
        </div>
        
        <div class="row">
          <div class="col-12">
            ${!isAuthenticated ? `
              <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Please <a href="#" onclick="showLoginModal(); return false;">log in</a> to access course lessons.
              </div>
            ` : !hasAccess ? `
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                You need to enroll in this course to access lessons.
              </div>
            ` : ''}
            
            ${hasAccess ? `
              <div class="card shadow-sm mb-4">
                <div class="card-header bg-white">
                  <h4 class="mb-0">Course Content</h4>
                </div>
                <div class="card-body">
                  ${lessons.length > 0 ? `
                    <div class="accordion" id="lessonsAccordion">
                      ${lessons.map((lesson, index) => `
                        <div class="accordion-item">
                          <h2 class="accordion-header">
                            <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" 
                                    data-bs-target="#lesson${lesson.id}Collapse" aria-expanded="${index === 0 ? 'true' : 'false'}" 
                                    aria-controls="lesson${lesson.id}Collapse">
                              <span class="me-2">Lesson ${index + 1}:</span> ${lesson.title}
                              ${isInstructor ? `
                                <span class="ms-auto me-3">
                                  <button class="btn btn-sm btn-outline-primary edit-lesson-btn" 
                                          data-lesson-id="${lesson.id}" onclick="event.stopPropagation();">
                                    <i class="bi bi-pencil"></i>
                                  </button>
                                  <button class="btn btn-sm btn-outline-danger delete-lesson-btn ms-2" 
                                          data-lesson-id="${lesson.id}" onclick="event.stopPropagation();">
                                    <i class="bi bi-trash"></i>
                                  </button>
                                </span>
                              ` : ''}
                            </button>
                          </h2>
                          <div id="lesson${lesson.id}Collapse" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                               data-bs-parent="#lessonsAccordion">
                            <div class="accordion-body">
                              <div class="row">
                                <div class="col-md-8">
                                  <p>${lesson.description || 'No description provided.'}</p>
                                </div>
                                <div class="col-md-4 text-md-end">
                                  <button class="btn btn-primary view-lesson-btn" data-lesson-id="${lesson.id}">
                                    <i class="bi bi-play-circle me-2"></i>Start Lesson
                                  </button>
                                </div>
                              </div>
                              ${lesson.videoUrl ? `
                                <div class="mt-3 lesson-preview">
                                  <h5>Lesson Preview:</h5>
                                  <div class="ratio ratio-16x9">
                                    <iframe src="${lesson.videoUrl.replace('watch?v=', 'embed/')}" 
                                            allowfullscreen title="${lesson.title}"></iframe>
                                  </div>
                                </div>
                              ` : ''}
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  ` : `
                    <div class="text-center py-5">
                      <div class="mb-3">
                        <i class="bi bi-journal-text" style="font-size: 3rem;"></i>
                      </div>
                      <h5>No lessons available yet</h5>
                      <p class="text-muted">
                        ${isInstructor ? 'Click the "Add New Lesson" button to create your first lesson.' : 
                          'The instructor has not added any lessons yet.'}
                      </p>
                    </div>
                  `}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Lesson View Modal -->
      <div class="modal fade" id="lessonViewModal" tabindex="-1" aria-labelledby="lessonViewModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="lessonViewModalLabel">Lesson Title</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="lessonViewModalBody">
              <!-- Lesson content will be loaded here -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary" id="markCompletedBtn">Mark as Completed</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add/Edit Lesson Modal -->
      ${isInstructor ? `
        <div class="modal fade" id="lessonFormModal" tabindex="-1" aria-labelledby="lessonFormModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="lessonFormModalLabel">Add New Lesson</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="lessonForm">
                  <input type="hidden" id="lessonId" name="lessonId" value="">
                  <input type="hidden" id="courseId" name="courseId" value="${courseId}">
                  
                  <div class="mb-3">
                    <label for="lessonTitle" class="form-label">Lesson Title *</label>
                    <input type="text" class="form-control" id="lessonTitle" name="title" required>
                  </div>
                  
                  <div class="mb-3">
                    <label for="lessonDescription" class="form-label">Description</label>
                    <textarea class="form-control" id="lessonDescription" name="description" rows="3"></textarea>
                  </div>
                  
                  <div class="mb-3">
                    <label for="lessonContent" class="form-label">Lesson Content</label>
                    <textarea class="form-control" id="lessonContent" name="content" rows="5"></textarea>
                  </div>
                  
                  <div class="mb-3">
                    <label for="videoUrl" class="form-label">Video URL (YouTube)</label>
                    <input type="url" class="form-control" id="videoUrl" name="videoUrl" 
                           placeholder="https://www.youtube.com/watch?v=...">
                    <div class="form-text">Enter a YouTube video URL for this lesson</div>
                  </div>
                  
                  <div class="mb-3">
                    <label for="lessonOrder" class="form-label">Order</label>
                    <input type="number" class="form-control" id="lessonOrder" name="order" min="1" value="${lessons.length + 1}">
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="saveLessonBtn">Save Lesson</button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Delete Lesson Confirmation Modal -->
        <div class="modal fade" id="deleteLessonModal" tabindex="-1" aria-labelledby="deleteLessonModalLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title" id="deleteLessonModalLabel">Confirm Deletion</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <p>Are you sure you want to delete this lesson? This action cannot be undone.</p>
                <input type="hidden" id="deleteLessonId" value="">
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-danger" id="confirmDeleteLessonBtn">Delete Lesson</button>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
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
                <li><a href="/" class="text-white-50">Home</a></li>
                <li><a href="/courses" class="text-white-50">Courses</a></li>
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
    `;
    
    // If user is instructor, set up lesson management functionality
    if (isInstructor) {
      // Add lesson button click handler
      document.getElementById('addLessonBtn').addEventListener('click', () => {
        document.getElementById('lessonFormModalLabel').textContent = 'Add New Lesson';
        document.getElementById('lessonForm').reset();
        document.getElementById('lessonId').value = '';
        document.getElementById('lessonOrder').value = lessons.length + 1;
        
        // Show the modal
        const lessonFormModal = new bootstrap.Modal(document.getElementById('lessonFormModal'));
        lessonFormModal.show();
      });
      
      // Edit lesson buttons click handlers
      document.querySelectorAll('.edit-lesson-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
          event.preventDefault();
          const lessonId = button.getAttribute('data-lesson-id');
          
          try {
            // Fetch lesson details
            const response = await fetch(`/api/lessons/${lessonId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch lesson details');
            }
            
            const lesson = await response.json();
            
            // Populate the form
            document.getElementById('lessonFormModalLabel').textContent = 'Edit Lesson';
            document.getElementById('lessonId').value = lesson.id;
            document.getElementById('lessonTitle').value = lesson.title || '';
            document.getElementById('lessonDescription').value = lesson.description || '';
            document.getElementById('lessonContent').value = lesson.content || '';
            document.getElementById('videoUrl').value = lesson.videoUrl || '';
            document.getElementById('lessonOrder').value = lesson.order || '';
            
            // Show the modal
            const lessonFormModal = new bootstrap.Modal(document.getElementById('lessonFormModal'));
            lessonFormModal.show();
          } catch (error) {
            console.error('Error fetching lesson details:', error);
            showErrorToast('Failed to fetch lesson details. Please try again.');
          }
        });
      });
      
      // Delete lesson buttons click handlers
      document.querySelectorAll('.delete-lesson-btn').forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const lessonId = button.getAttribute('data-lesson-id');
          document.getElementById('deleteLessonId').value = lessonId;
          
          // Show the delete confirmation modal
          const deleteLessonModal = new bootstrap.Modal(document.getElementById('deleteLessonModal'));
          deleteLessonModal.show();
        });
      });
      
      // Save lesson button click handler
      document.getElementById('saveLessonBtn').addEventListener('click', async () => {
        const form = document.getElementById('lessonForm');
        
        // Basic form validation
        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }
        
        // Collect form data
        const lessonId = document.getElementById('lessonId').value;
        const lessonData = {
          courseId: parseInt(document.getElementById('courseId').value),
          title: document.getElementById('lessonTitle').value,
          description: document.getElementById('lessonDescription').value,
          content: document.getElementById('lessonContent').value,
          videoUrl: document.getElementById('videoUrl').value,
          order: parseInt(document.getElementById('lessonOrder').value) || (lessons.length + 1)
        };
        
        try {
          let response;
          
          if (lessonId) {
            // Update existing lesson
            response = await fetch(`/api/lessons/${lessonId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(lessonData),
              credentials: 'include'
            });
          } else {
            // Create new lesson
            response = await fetch('/api/lessons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify(lessonData),
              credentials: 'include'
            });
          }
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save lesson');
          }
          
          // Success! Refresh the page to show the updated lessons
          showSuccessToast(lessonId ? 'Lesson updated successfully' : 'New lesson created successfully');
          
          // Hide the modal
          const lessonFormModal = bootstrap.Modal.getInstance(document.getElementById('lessonFormModal'));
          if (lessonFormModal) {
            lessonFormModal.hide();
          }
          
          // Reload the page after a brief delay
          setTimeout(() => {
            routeToPage(`/courses/${courseId}/lessons`);
          }, 1000);
        } catch (error) {
          console.error('Error saving lesson:', error);
          showErrorToast('Failed to save lesson. Please try again.');
        }
      });
      
      // Confirm delete lesson button click handler
      document.getElementById('confirmDeleteLessonBtn').addEventListener('click', async () => {
        const lessonId = document.getElementById('deleteLessonId').value;
        
        try {
          const response = await fetch(`/api/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete lesson');
          }
          
          // Success! Refresh the page to show the updated lessons
          showSuccessToast('Lesson deleted successfully');
          
          // Hide the modal
          const deleteLessonModal = bootstrap.Modal.getInstance(document.getElementById('deleteLessonModal'));
          if (deleteLessonModal) {
            deleteLessonModal.hide();
          }
          
          // Reload the page after a brief delay
          setTimeout(() => {
            routeToPage(`/courses/${courseId}/lessons`);
          }, 1000);
        } catch (error) {
          console.error('Error deleting lesson:', error);
          showErrorToast('Failed to delete lesson. Please try again.');
        }
      });
    }
    
    // Setup view lesson functionality for all users with access
    if (hasAccess) {
      document.querySelectorAll('.view-lesson-btn').forEach(button => {
        button.addEventListener('click', async () => {
          const lessonId = button.getAttribute('data-lesson-id');
          
          try {
            // Fetch lesson details
            const response = await fetch(`/api/lessons/${lessonId}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`
              },
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch lesson details');
            }
            
            const lesson = await response.json();
            
            // Update the modal
            document.getElementById('lessonViewModalLabel').textContent = lesson.title;
            
            // Format the lesson content
            let modalContent = `
              <div class="lesson-content mb-4">
                ${lesson.content ? `<div class="mb-4">${lesson.content}</div>` : ''}
                
                ${lesson.videoUrl ? `
                  <div class="lesson-video mb-4">
                    <div class="ratio ratio-16x9">
                      <iframe src="${lesson.videoUrl.replace('watch?v=', 'embed/')}" 
                              allowfullscreen title="${lesson.title}"></iframe>
                    </div>
                  </div>
                ` : ''}
              </div>
            `;
            
            document.getElementById('lessonViewModalBody').innerHTML = modalContent;
            
            // Handle 'Mark as Completed' button
            const markCompletedBtn = document.getElementById('markCompletedBtn');
            
            // Show the modal
            const lessonViewModal = new bootstrap.Modal(document.getElementById('lessonViewModal'));
            lessonViewModal.show();
            
            // Handle completion tracking
            markCompletedBtn.addEventListener('click', async function markLesson() {
              try {
                const response = await fetch(`/api/lessons/${lessonId}/complete`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${authToken}`
                  },
                  credentials: 'include'
                });
                
                if (!response.ok) {
                  throw new Error('Failed to mark lesson as completed');
                }
                
                showSuccessToast('Lesson marked as completed!');
                markCompletedBtn.disabled = true;
                markCompletedBtn.textContent = 'Completed ✓';
                
                // Remove the event listener to prevent multiple submissions
                markCompletedBtn.removeEventListener('click', markLesson);
              } catch (error) {
                console.error('Error marking lesson as completed:', error);
                showErrorToast('Failed to update progress. Please try again.');
              }
            });
            
          } catch (error) {
            console.error('Error fetching lesson details:', error);
            showErrorToast('Failed to fetch lesson details. Please try again.');
          }
        });
      });
    }
    
  } catch (error) {
    console.error('Error rendering lessons page:', error);
    rootElement.innerHTML = `
      <div class="container mt-4">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Error loading lessons: ${error.message || 'Unknown error occurred'}
        </div>
        <a href="/courses" class="btn btn-primary" onclick="routeToPage('/courses'); return false;">
          <i class="bi bi-arrow-left me-2"></i>Back to Courses
        </a>
      </div>
    `;
  }
}