/**
 * Course Progress Page
 * Created by Chakridhar - April 2025
 * 
 * Displays detailed progress tracking for a specific course enrollment,
 * including section completion, lesson status, and time spent.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';
import CourseProgressTracker from '../components/CourseProgressTracker';
import { getEnrollment } from '../services/enrollmentService';

const CourseProgress = () => {
  const { courseId } = useParams();
  const { isAuthenticated, userRole } = useClerkAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState(null);
  
  // Fetch course and enrollment data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLocation('/auth/sign-in');
        return;
      }
      
      if (userRole !== 'student') {
        toast({
          title: 'Access Denied',
          description: 'Only students can access course progress tracking',
          variant: 'error'
        });
        setLocation('/');
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Fetch lessons for this course
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`);
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData || []);
        }
        
        // Get enrollment data
        const enrollmentData = await getEnrollment(courseId);
        if (!enrollmentData) {
          toast({
            title: 'Not Enrolled',
            description: 'You are not enrolled in this course',
            variant: 'warning'
          });
          setLocation(`/courses/${courseId}`);
          return;
        }
        
        setEnrollment(enrollmentData);
      } catch (err) {
        console.error('Error fetching course data:', err);
        setError(err.message);
        toast({
          title: 'Error',
          description: 'Failed to load course progress data',
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, isAuthenticated, userRole, setLocation, toast]);
  
  // Handle refreshing enrollment data
  const handleRefreshEnrollment = async () => {
    try {
      const enrollmentData = await getEnrollment(courseId);
      setEnrollment(enrollmentData);
      toast({
        title: 'Progress Updated',
        description: 'Your course progress has been refreshed',
        variant: 'success'
      });
    } catch (err) {
      console.error('Error refreshing enrollment:', err);
      toast({
        title: 'Error',
        description: 'Failed to refresh progress data',
        variant: 'error'
      });
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your progress...</p>
      </div>
    );
  }
  
  // Error state
  if (error || !course) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error!</h4>
          <p>{error || 'Could not find this course'}</p>
          <hr />
          <button 
            className="btn btn-primary" 
            onClick={() => setLocation('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          {/* Course Header */}
          <div className="d-flex align-items-center mb-4">
            <button 
              className="btn btn-outline-secondary me-3" 
              onClick={() => setLocation('/dashboard')}
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <div>
              <h1 className="mb-0">{course.title}</h1>
              <p className="text-muted mb-0">
                Progress Tracking
              </p>
            </div>
          </div>
          
          {/* Course Banner */}
          {course.imageUrl && (
            <div className="card mb-4 overflow-hidden">
              <img 
                src={course.imageUrl} 
                alt={course.title} 
                className="card-img-top"
                style={{ maxHeight: '200px', objectFit: 'cover' }}
              />
              <div className="card-img-overlay d-flex align-items-end">
                <div className="bg-dark bg-opacity-75 text-white p-3 rounded-top w-100">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h5 className="mb-0">{course.title}</h5>
                      <p className="mb-0">
                        <small>Instructor: {course.instructor?.name || 'JAKKULA CHAKRIDHAR'}</small>
                      </p>
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setLocation(`/courses/${courseId}`)}
                    >
                      View Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Tracker Component */}
          <CourseProgressTracker
            courseId={courseId}
            lessons={lessons}
            enrollment={enrollment}
            showDetailedView={true}
            onRefresh={handleRefreshEnrollment}
          />
          
          {/* Actions */}
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setLocation('/dashboard')}
            >
              Back to Dashboard
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                // Find the first incomplete lesson
                const incompleteLessons = lessons.filter(
                  lesson => !enrollment.completedLessons.includes(lesson.id.toString())
                );
                
                if (incompleteLessons.length > 0) {
                  setLocation(`/learn/${courseId}/${incompleteLessons[0].id}`);
                } else if (lessons.length > 0) {
                  // If all lessons completed, go to first lesson
                  setLocation(`/learn/${courseId}/${lessons[0].id}`);
                } else {
                  setLocation(`/courses/${courseId}`);
                }
              }}
            >
              Continue Learning
            </button>
          </div>
          
          {/* Estimated Completion */}
          {enrollment && enrollment.progress < 100 && (
            <div className="card mt-4">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Estimated Completion</h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0">Based on your current progress:</p>
                    <h3 className="text-primary">
                      {calculateEstimatedCompletion(lessons, enrollment)}
                    </h3>
                  </div>
                  <div className="text-center">
                    <div className="fs-1 text-primary">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <small className="text-muted d-block mt-1">Estimated completion</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate estimated time to completion
const calculateEstimatedCompletion = (lessons, enrollment) => {
  if (!lessons.length || !enrollment) {
    return 'N/A';
  }
  
  const completedLessons = enrollment.completedLessons || [];
  const remainingLessons = lessons.filter(lesson => !completedLessons.includes(lesson.id.toString()));
  
  // Calculate total remaining time in minutes
  const remainingTimeMinutes = remainingLessons.reduce((total, lesson) => {
    return total + (lesson.duration || 30); // Default to 30 min if duration not specified
  }, 0);
  
  // Assuming 45 minutes per day (average study time)
  const daysToComplete = Math.ceil(remainingTimeMinutes / 45);
  
  if (daysToComplete <= 1) {
    return 'Less than 1 day';
  } else if (daysToComplete < 7) {
    return `About ${daysToComplete} days`;
  } else if (daysToComplete < 30) {
    const weeks = Math.ceil(daysToComplete / 7);
    return `About ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  } else {
    const months = Math.ceil(daysToComplete / 30);
    return `About ${months} ${months === 1 ? 'month' : 'months'}`;
  }
};

export default CourseProgress;