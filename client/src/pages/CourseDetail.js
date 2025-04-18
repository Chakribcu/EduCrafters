// Course Detail Page
// Created by Chakridhar - Shows course information and enrollment options

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';
import { enrollInCourse, getEnrollment } from '../services/enrollmentService';
import LessonItem from '../components/LessonItem';

// Helper function to format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(price);
};

// Format duration from minutes to hours and minutes
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Get total duration of all lessons
const calculateTotalDuration = (lessons) => {
  return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
};

// Get label for course level
const getLevelLabel = (level) => {
  const labels = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced'
  };
  return labels[level] || 'All Levels';
};

// Get label for course category
const getCategoryLabel = (category) => {
  const labels = {
    'development': 'Web Development',
    'design': 'Design',
    'business': 'Business',
    'marketing': 'Marketing',
    'photography': 'Photography',
    'music': 'Music'
  };
  return labels[category] || 'General';
};

// Group lessons by section
const groupLessonsBySection = (lessons) => {
  return lessons.reduce((groups, lesson) => {
    const section = lesson.section || 'Main Content';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(lesson);
    return groups;
  }, {});
};

const CourseDetail = () => {
  const { id } = useParams();
  const { userData, isAuthenticated, userRole } = useClerkAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isStudent = userRole === 'student';
  
  // State variables
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const response = await fetch(`/api/courses/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const courseData = await response.json();
        setCourse(courseData);
        
        // Fetch lessons for this course
        const lessonsResponse = await fetch(`/api/courses/${id}/lessons`);
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [id]);
  
  // Check if user is enrolled
  useEffect(() => {
    const checkEnrollment = async () => {
      if (isAuthenticated && isStudent && course) {
        try {
          const enrollmentData = await getEnrollment(id);
          setIsEnrolled(!!enrollmentData);
          setEnrollment(enrollmentData);
        } catch (err) {
          console.error('Error checking enrollment:', err);
        }
      }
    };
    
    checkEnrollment();
  }, [id, isAuthenticated, isStudent, course]);
  
  // Handle enrollment button click
  const handleEnroll = async () => {
    // Check if user is logged in
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to enroll in this course',
        variant: 'warning'
      });
      setLocation('/auth/sign-in');
      return;
    }
    
    // Check if user is a student
    if (!isStudent) {
      toast({
        title: 'Student Account Required',
        description: 'Only students can enroll in courses',
        variant: 'error'
      });
      return;
    }
    
    setEnrolling(true);
    
    try {
      console.log(`Attempting to enroll in course: ${id}`);
      
      if (course.price > 0) {
        // Redirect to checkout for paid courses
        console.log('Redirecting to checkout for paid course');
        setLocation(`/checkout?courseId=${id}`);
      } else {
        // Process enrollment directly for free courses
        await enrollInCourse(id);
        
        setIsEnrolled(true);
        toast({
          title: 'Enrollment Successful',
          description: `You are now enrolled in ${course.title}`,
          variant: 'success'
        });
        
        // Refresh enrollment status
        const enrollmentData = await getEnrollment(id);
        setEnrollment(enrollmentData);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      toast({
        title: 'Enrollment Failed',
        description: err.message || 'There was an error enrolling in this course',
        variant: 'error'
      });
    } finally {
      setEnrolling(false);
    }
  };
  
  // Start learning button handler
  const handleStartLearning = () => {
    setLocation(`/learn/${id}`);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading course details...</p>
      </div>
    );
  }
  
  // Error state
  if (error || !course) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error!</h4>
          <p>{error || 'Could not find this course'}</p>
          <hr />
          <button className="btn btn-primary" onClick={() => setLocation('/courses')}>
            Browse Other Courses
          </button>
        </div>
      </div>
    );
  }
  
  // Organize lessons by section
  const lessonsBySection = groupLessonsBySection(lessons);
  const totalLessons = lessons.length;
  const totalDuration = calculateTotalDuration(lessons);
  
  return (
    <div className="container py-5">
      <div className="row">
        {/* Course Information (Left Side) */}
        <div className="col-lg-8">
          <h1 className="mb-3">{course.title}</h1>
          
          <p className="lead mb-4">{course.description}</p>
          
          <div className="d-flex align-items-center mb-4 flex-wrap">
            <span className="badge bg-primary me-2">{getLevelLabel(course.level)}</span>
            <span className="badge bg-secondary me-3">{getCategoryLabel(course.category)}</span>
            <span className="me-3">
              <i className="bi bi-book me-1"></i> {totalLessons} lessons
            </span>
            <span className="me-3">
              <i className="bi bi-clock me-1"></i> {formatDuration(totalDuration)}
            </span>
            {course.rating && (
              <span className="me-3">
                <i className="bi bi-star-fill text-warning me-1"></i>
                {course.rating.toFixed(1)} ({course.reviewCount || 0} reviews)
              </span>
            )}
          </div>
          
          <p>
            <strong>Instructor:</strong> {course.instructor?.name || 'JAKKULA CHAKRIDHAR'}
          </p>
          
          {/* Introduction Video - Only shown if available */}
          {course.introVideoUrl && (
            <div className="card mb-4">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h3 className="mb-0">Course Preview</h3>
                {!isEnrolled && (
                  <span className="badge bg-success">Free Preview</span>
                )}
              </div>
              <div className="card-body p-0">
                <div className="ratio ratio-16x9">
                  <iframe
                    src={course.introVideoUrl}
                    title="Course Introduction"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
              </div>
            </div>
          )}
          
          {/* Course Content */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h3 className="mb-0">Course Content</h3>
            </div>
            <div className="card-body">
              <p className="mb-3">
                <strong>{totalLessons} lessons</strong> • Total: {formatDuration(totalDuration)}
              </p>
              
              {!isEnrolled && (
                <div className="alert alert-info mb-3">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                    <div>
                      <strong>Access to Course Content</strong>
                      <p className="mb-0">Only preview lessons and course information are available before enrollment. Enroll now to unlock all lessons!</p>
                    </div>
                  </div>
                </div>
              )}
              
              {Object.keys(lessonsBySection).length > 0 ? (
                <div className="accordion" id="courseContent">
                  {Object.keys(lessonsBySection).map((section, index) => (
                    <div className="accordion-item" key={index}>
                      <h2 className="accordion-header">
                        <button 
                          className="accordion-button" 
                          type="button" 
                          data-bs-toggle="collapse"
                          data-bs-target={`#section${index}`}
                          aria-expanded={index === 0 ? "true" : "false"}
                          aria-controls={`section${index}`}
                        >
                          {section}
                          <span className="ms-auto">
                            {lessonsBySection[section].length} lessons • 
                            {formatDuration(lessonsBySection[section].reduce((sum, lesson) => sum + (lesson.duration || 0), 0))}
                          </span>
                        </button>
                      </h2>
                      <div 
                        id={`section${index}`} 
                        className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`}
                        data-bs-parent="#courseContent"
                      >
                        <div className="accordion-body p-0">
                          <ul className="list-group list-group-flush">
                            {lessonsBySection[section].map((lesson, i) => (
                              <li 
                                className={`list-group-item d-flex justify-content-between align-items-center ${!isEnrolled && !lesson.isPreview ? 'text-muted' : ''}`} 
                                key={i}
                              >
                                <div>
                                  <span className="me-2">{i+1}.</span>
                                  {lesson.title}
                                  {lesson.isPreview && <span className="badge bg-info ms-2">Preview</span>}
                                  {!isEnrolled && !lesson.isPreview && 
                                    <i className="bi bi-lock-fill ms-2" title="Enroll to unlock this lesson"></i>
                                  }
                                </div>
                                <span className="text-muted">
                                  {formatDuration(lesson.duration)}
                                  {!isEnrolled && !lesson.isPreview && 
                                    <i className="bi bi-lock ms-2" title="Enroll to unlock this lesson"></i>
                                  }
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="alert alert-info">
                  No lessons available yet for this course.
                </div>
              )}
            </div>
          </div>
          
          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <div className="mb-4">
              <h3>Requirements</h3>
              <ul>
                {course.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Learning Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <div className="mb-4">
              <h3>What You'll Learn</h3>
              <ul>
                {course.objectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Course Actions (Right Side) */}
        <div className="col-lg-4">
          <div className="card shadow-sm sticky-top" style={{ top: '20px' }}>
            {course.imageUrl && (
              <img 
                src={course.imageUrl} 
                className="card-img-top" 
                alt={course.title}
                style={{ height: '200px', objectFit: 'cover' }}
              />
            )}
            
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="card-title mb-0">{formatPrice(course.price)}</h4>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-decoration-line-through text-muted">
                    {formatPrice(course.originalPrice)}
                  </span>
                )}
              </div>
              
              {isEnrolled ? (
                <button 
                  className="btn btn-success w-100 mb-3" 
                  onClick={handleStartLearning}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  Continue Learning
                </button>
              ) : (
                <button 
                  className="btn btn-primary w-100 mb-3" 
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus me-2"></i>
                      Enroll Now
                    </>
                  )}
                </button>
              )}
              
              <p className="card-text text-center mb-0">
                <small className="text-muted">30-Day Money-Back Guarantee</small>
              </p>
              
              <hr />
              
              <h5>This Course Includes:</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <i className="bi bi-play-circle me-2"></i>
                  {formatDuration(totalDuration)} of on-demand video
                </li>
                <li className="mb-2">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {totalLessons} lessons
                </li>
                <li className="mb-2">
                  <i className="bi bi-infinity me-2"></i>
                  Full lifetime access
                </li>
                <li className="mb-2">
                  <i className="bi bi-phone me-2"></i>
                  Access on mobile and TV
                </li>
                <li className="mb-2">
                  <i className="bi bi-award me-2"></i>
                  Certificate of completion
                </li>
              </ul>
              
              <div className="d-flex justify-content-between mt-4">
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-share me-1"></i> Share
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-gift me-1"></i> Gift
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <i className="bi bi-question-circle me-1"></i> Help
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;