import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

// Initialize Stripe with your public key
const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ courseId, price, courseTitle }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useClerkAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  
  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!user) return;
      
      try {
        const token = await user.getToken();
        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ courseId, amount: price }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error creating payment');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast({
          title: 'Payment Error',
          description: error.message || 'Error initializing payment',
          variant: 'destructive'
        });
      }
    };
    
    if (courseId && price && user) {
      createPaymentIntent();
    }
  }, [courseId, price, user, toast]);
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    
    setLoading(true);
    
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: user.fullName || user.name || 'Unknown',
            email: user.email,
          },
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Payment successful, enroll the user in the course
        const token = await user.getToken();
        const enrollResponse = await fetch(`/api/courses/${courseId}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
        
        if (!enrollResponse.ok) {
          const enrollError = await enrollResponse.json();
          throw new Error(enrollError.message || 'Error enrolling in course');
        }
        
        toast({
          title: 'Payment Successful',
          description: 'You have been enrolled in the course!',
          variant: 'success'
        });
        
        // Redirect to the course
        navigate(`/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Error processing payment',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
      <div className="mb-4">
        <h5 className="mb-3">Payment Information</h5>
        <div className="border rounded p-3 bg-light">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>
      
      <hr className="my-4" />
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h6 className="mb-1">Amount to Pay:</h6>
          <h4 className="mb-0 text-primary">£{price.toFixed(2)}</h4>
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={!stripe || loading || !clientSecret}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
      
      <div className="text-center text-muted small">
        <p className="mb-1">
          <i className="bi bi-shield-lock me-1"></i>
          Secure payment processed by Stripe
        </p>
        <p className="mb-0">
          By proceeding with the payment, you agree to our terms and conditions.
        </p>
      </div>
    </form>
  );
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useClerkAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Extract course ID from query params
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get('courseId');
  
  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        navigate('/');
        return;
      }
      
      try {
        const response = await fetch(`/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error('Course not found');
        }
        
        const courseData = await response.json();
        setCourse(courseData);
      } catch (error) {
        console.error('Error fetching course:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourse();
  }, [courseId, navigate]);
  
  // Redirect if user is not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate(`/auth?redirect=/checkout?courseId=${courseId}`);
    }
  }, [user, loading, navigate, courseId]);
  
  if (loading || !course) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Preparing checkout...</p>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Checkout</h1>
            <Link to={`/courses/${course.id}`} className="btn btn-outline-secondary">
              Back to Course
            </Link>
          </div>
          
          <div className="row">
            <div className="col-md-7">
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  courseId={course.id}
                  price={course.price}
                  courseTitle={course.title}
                />
              </Elements>
            </div>
            
            <div className="col-md-5">
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h4 className="mb-0">Order Summary</h4>
                </div>
                <div className="card-body">
                  <div className="d-flex mb-3">
                    {course.imageUrl ? (
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="img-thumbnail me-3"
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="bg-secondary me-3 d-flex align-items-center justify-content-center"
                        style={{ width: '80px', height: '80px' }}
                      >
                        <i className="bi bi-mortarboard text-white fs-3"></i>
                      </div>
                    )}
                    <div>
                      <h5 className="mb-1">{course.title}</h5>
                      <div className="badge bg-secondary">{course.category.replace('-', ' ')}</div>
                      <div className="small text-muted mt-1">{course.level}</div>
                    </div>
                  </div>
                  
                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Original Price:</span>
                      <span>£{course.price.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold">
                      <span>Total:</span>
                      <span className="text-primary">£{course.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header bg-light">
                  <h4 className="mb-0">What You'll Get</h4>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Full access to all course materials
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      {course.duration} minutes of content
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Certificate of completion
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      Lifetime access to updates
                    </li>
                    <li>
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      24/7 support
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;