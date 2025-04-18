/**
 * Payment Processing Functionality
 * Created by Chakridhar - April 2025
 * 
 * This script handles the payment processing for course enrollment
 */

// Function to render the payment page for a course
async function renderPaymentPage(courseId) {
  const rootElement = document.getElementById('root');
  
  // Check if user is authenticated
  if (!appState.isAuthenticated || !currentUser) {
    showInfoToast('Please login to enroll in paid courses');
    routeToPage('/courses');
    return;
  }
  
  try {
    // Get course details first
    const course = await fetchCourse(courseId);
    
    if (!course) {
      rootElement.innerHTML = '<div class="alert alert-danger">Course not found</div>';
      return;
    }
    
    // Check if user is already enrolled
    const enrollmentStatusResponse = await fetch(`/api/enrollment-status/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      credentials: 'include'
    });
    
    if (enrollmentStatusResponse.ok) {
      const enrollmentData = await enrollmentStatusResponse.json();
      
      if (enrollmentData.isEnrolled) {
        // User is already enrolled
        rootElement.innerHTML = `
          <div class="container mt-4 text-center">
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              You are already enrolled in this course
            </div>
            <div class="mt-4">
              <a href="/courses/${courseId}/lessons" onclick="routeToPage('/courses/${courseId}/lessons'); return false;" 
                 class="btn btn-primary">
                <i class="bi bi-play-circle me-2"></i>Go to Lessons
              </a>
            </div>
          </div>
        `;
        return;
      }
    }
    
    // Get Stripe public key
    const configResponse = await fetch('/api/stripe-config');
    if (!configResponse.ok) {
      throw new Error('Failed to get payment configuration');
    }
    
    const paymentConfig = await configResponse.json();
    const stripePublicKey = paymentConfig.publicKey;
    
    if (!stripePublicKey) {
      throw new Error('Stripe public key not available');
    }
    
    // Initialize Stripe
    const stripe = Stripe(stripePublicKey);
    
    // Render the payment page
    rootElement.innerHTML = `
      <div class="container mt-4">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="/" onclick="routeToPage('/'); return false;">Home</a></li>
            <li class="breadcrumb-item"><a href="/courses" onclick="routeToPage('/courses'); return false;">Courses</a></li>
            <li class="breadcrumb-item"><a href="/courses/${courseId}" onclick="routeToPage('/courses/${courseId}'); return false;">${course.title}</a></li>
            <li class="breadcrumb-item active">Payment</li>
          </ol>
        </nav>
        
        <div class="row">
          <div class="col-md-7">
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white">
                <h4 class="mb-0">Payment Information</h4>
              </div>
              <div class="card-body">
                <div id="payment-message" class="alert d-none mb-4"></div>
                
                <form id="payment-form">
                  <div class="mb-4">
                    <h5>Course Details</h5>
                    <div class="d-flex align-items-center mb-3">
                      <img src="${course.imageUrl}" alt="${course.title}" class="rounded me-3" style="width: 80px; height: 60px; object-fit: cover;">
                      <div>
                        <h6 class="mb-1">${course.title}</h6>
                        <div class="badge bg-${getBadgeColor(course.level)}">${capitalize(course.level)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <hr class="my-4">
                  
                  <div id="payment-element" class="mb-4">
                    <!-- Stripe payment elements will be inserted here -->
                    <div class="text-center py-4">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading payment form...</span>
                      </div>
                      <p class="mt-2">Loading payment form...</p>
                    </div>
                  </div>
                  
                  <div class="d-grid">
                    <button id="submit-button" class="btn btn-primary btn-lg">
                      <i class="bi bi-credit-card me-2"></i>Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(course.price)}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            <div class="card mb-4 shadow-sm">
              <div class="card-body">
                <h5 class="mb-3">Secure Payment</h5>
                <p class="text-muted small mb-0">
                  <i class="bi bi-shield-lock me-2"></i>
                  Your payment information is encrypted and secure. We use Stripe for secure payment processing.
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-md-5">
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white">
                <h4 class="mb-0">Order Summary</h4>
              </div>
              <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                  <span>Course Price</span>
                  <span>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(course.price)}</span>
                </div>
                
                <hr>
                
                <div class="d-flex justify-content-between mb-0 fw-bold">
                  <span>Total</span>
                  <span>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(course.price)}</span>
                </div>
              </div>
            </div>
            
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white">
                <h5 class="mb-0">What You'll Get</h5>
              </div>
              <ul class="list-group list-group-flush">
                <li class="list-group-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  Full lifetime access to the course
                </li>
                <li class="list-group-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  Access on mobile and desktop
                </li>
                <li class="list-group-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  Certificate of completion
                </li>
                <li class="list-group-item">
                  <i class="bi bi-check-circle-fill text-success me-2"></i>
                  30-day money-back guarantee
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
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
    
    // Setup Stripe payment elements
    setupStripeElements(stripe, course);
    
  } catch (error) {
    console.error('Error rendering payment page:', error);
    
    rootElement.innerHTML = `
      <div class="container mt-4">
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Error loading payment page: ${error.message}
        </div>
        <a href="/courses/${courseId}" class="btn btn-primary" onclick="routeToPage('/courses/${courseId}'); return false;">
          <i class="bi bi-arrow-left me-2"></i>Return to Course
        </a>
      </div>
    `;
  }
}

// Function to setup Stripe payment elements
async function setupStripeElements(stripe, course) {
  try {
    // Create a payment intent on the server
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        courseId: course.id,
        amount: course.price
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Something went wrong with the payment');
    }
    
    const paymentData = await response.json();
    const clientSecret = paymentData.clientSecret;
    const paymentIntentId = paymentData.paymentIntentId;
    
    // Create payment elements
    const elements = stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#0d6efd',
          colorBackground: '#ffffff',
          colorText: '#30313d',
          colorDanger: '#df1b41',
          fontFamily: 'Roboto, Open Sans, Segoe UI, sans-serif',
          borderRadius: '4px'
        }
      }
    });
    
    // Create and mount the Payment Element
    const paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
    
    // Handle form submission
    const form = document.getElementById('payment-form');
    const submitButton = document.getElementById('submit-button');
    const paymentMessage = document.getElementById('payment-message');
    
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Disable the submit button to prevent repeated clicks
      submitButton.disabled = true;
      submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing Payment...';
      
      // Show processing message
      paymentMessage.classList.remove('d-none', 'alert-danger', 'alert-success');
      paymentMessage.classList.add('alert-info');
      paymentMessage.innerHTML = '<i class="bi bi-info-circle me-2"></i>Processing your payment. Please do not close this page...';
      
      // Confirm payment with stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
        redirect: 'if_required'
      });
      
      if (error) {
        // Show error message
        paymentMessage.classList.remove('alert-info', 'alert-success');
        paymentMessage.classList.add('alert-danger');
        paymentMessage.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i>${error.message}`;
        
        // Re-enable the submit button
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="bi bi-credit-card me-2"></i>Pay ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'GBP' }).format(course.price)}`;
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, process enrollment
        try {
          // Process the payment on the server
          const processResponse = await fetch('/api/process-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId,
              courseId: course.id
            })
          });
          
          if (!processResponse.ok) {
            const errorData = await processResponse.json();
            throw new Error(errorData.error || 'Failed to process enrollment');
          }
          
          // Get enrollment data
          const enrollmentData = await processResponse.json();
          
          // Show success message
          paymentMessage.classList.remove('alert-info', 'alert-danger');
          paymentMessage.classList.add('alert-success');
          paymentMessage.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            <strong>Payment Successful!</strong> You have been enrolled in ${course.title}.
            <div class="mt-3">
              <a href="/courses/${course.id}/lessons" class="btn btn-primary" onclick="routeToPage('/courses/${course.id}/lessons'); return false;">
                <i class="bi bi-play-circle me-2"></i>Start Learning
              </a>
            </div>
          `;
          
          // Update button
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="bi bi-check-circle me-2"></i>Payment Completed';
          
          // Show success toast
          showSuccessToast('Payment successful! You are now enrolled in the course.');
          
        } catch (error) {
          console.error('Error processing enrollment after payment:', error);
          
          // Show error message
          paymentMessage.classList.remove('alert-info', 'alert-success');
          paymentMessage.classList.add('alert-danger');
          paymentMessage.innerHTML = `
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Payment Successful, but Enrollment Failed</strong>
            <p class="mb-0 mt-2">Your payment was successful, but there was an error enrolling you in the course. Please contact support with your payment ID: ${paymentIntentId}</p>
          `;
          
          // Re-enable the submit button
          submitButton.disabled = false;
          submitButton.innerHTML = `<i class="bi bi-arrow-clockwise me-2"></i>Retry Enrollment`;
        }
      }
    });
  } catch (error) {
    console.error('Error setting up payment elements:', error);
    
    const paymentElement = document.getElementById('payment-element');
    if (paymentElement) {
      paymentElement.innerHTML = `
        <div class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          Failed to load payment form: ${error.message}
        </div>
      `;
    }
    
    const submitButton = document.getElementById('submit-button');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="bi bi-x-circle me-2"></i>Payment Unavailable';
    }
  }
}