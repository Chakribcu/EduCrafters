/**
 * Course Progress Tracker Component
 * Created by Chakridhar - April 2025
 * 
 * This component provides a detailed visual representation of a student's progress
 * through a course, showing completed and remaining lessons by section.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';
import { getEnrollment } from '../services/enrollmentService';

const CourseProgressTracker = ({ 
  courseId, 
  lessons = [], 
  enrollment = null,
  showDetailedView = false,
  onRefresh = null
}) => {
  const { isAuthenticated, userRole } = useClerkAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [courseEnrollment, setCourseEnrollment] = useState(enrollment);
  const [completedLessons, setCompletedLessons] = useState([]);
  
  // Fetch enrollment data if not provided
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!isAuthenticated || userRole !== 'student' || !courseId) {
        return;
      }
      
      if (enrollment) {
        setCourseEnrollment(enrollment);
        setCompletedLessons(enrollment.completedLessons || []);
        return;
      }
      
      try {
        setLoading(true);
        const enrollmentData = await getEnrollment(courseId);
        
        if (enrollmentData) {
          setCourseEnrollment(enrollmentData);
          setCompletedLessons(enrollmentData.completedLessons || []);
        }
      } catch (error) {
        console.error('Error fetching enrollment:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your course progress',
          variant: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnrollmentData();
  }, [courseId, enrollment, isAuthenticated, userRole, toast]);
  
  // Update when enrollment changes externally
  useEffect(() => {
    if (enrollment) {
      setCourseEnrollment(enrollment);
      setCompletedLessons(enrollment.completedLessons || []);
    }
  }, [enrollment]);
  
  // Calculate progress metrics
  const totalLessons = lessons.length;
  const completedCount = completedLessons.length;
  const progressPercentage = totalLessons > 0 
    ? Math.round((completedCount / totalLessons) * 100) 
    : 0;
  const remainingCount = totalLessons - completedCount;
  
  // Group lessons by section
  const lessonsBySection = lessons.reduce((acc, lesson) => {
    const section = lesson.section || 'Main Content';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(lesson);
    return acc;
  }, {});
  
  // Calculate section progress
  const sectionProgress = Object.keys(lessonsBySection).map(section => {
    const sectionLessons = lessonsBySection[section];
    const completedInSection = sectionLessons.filter(lesson => 
      completedLessons.includes(lesson.id.toString())
    ).length;
    
    return {
      name: section,
      total: sectionLessons.length,
      completed: completedInSection,
      percentage: Math.round((completedInSection / sectionLessons.length) * 100)
    };
  });
  
  // Handle "Continue Learning" action
  const handleContinueLearning = () => {
    if (!courseId) return;
    
    // Find the first incomplete lesson
    let nextLessonId = null;
    
    // First look through lessons in order
    for (const lesson of lessons) {
      if (!completedLessons.includes(lesson.id.toString())) {
        nextLessonId = lesson.id;
        break;
      }
    }
    
    // If all lessons are completed, go to the first lesson
    if (!nextLessonId && lessons.length > 0) {
      nextLessonId = lessons[0].id;
    }
    
    if (nextLessonId) {
      setLocation(`/learn/${courseId}/${nextLessonId}`);
    } else {
      // Fallback if no lessons found
      setLocation(`/courses/${courseId}`);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading progress...</span>
        </div>
      </div>
    );
  }
  
  // Render compact view (for dashboard cards)
  if (!showDetailedView) {
    return (
      <div className="course-progress mb-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="text-sm font-semibold">
            Progress: {progressPercentage}%
          </span>
          <span className="text-sm text-muted">
            {completedCount}/{totalLessons} lessons
          </span>
        </div>
        <div className="progress" style={{ height: '8px' }}>
          <div 
            className="progress-bar bg-success" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar" 
            aria-valuenow={progressPercentage} 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    );
  }
  
  // Render detailed view
  return (
    <div className="course-progress-detailed">
      {/* Overall Progress Summary */}
      <div className="card mb-4">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Course Progress</h5>
          <span className="badge bg-primary">{progressPercentage}% Complete</span>
        </div>
        <div className="card-body">
          <div className="progress mb-3" style={{ height: '12px' }}>
            <div 
              className="progress-bar bg-success" 
              style={{ width: `${progressPercentage}%` }}
              role="progressbar" 
              aria-valuenow={progressPercentage} 
              aria-valuemin="0" 
              aria-valuemax="100"
            ></div>
          </div>
          
          <div className="row text-center">
            <div className="col-4">
              <div className="h3 mb-0">{completedCount}</div>
              <div className="text-muted">Completed</div>
            </div>
            <div className="col-4">
              <div className="h3 mb-0">{remainingCount}</div>
              <div className="text-muted">Remaining</div>
            </div>
            <div className="col-4">
              <div className="h3 mb-0">{totalLessons}</div>
              <div className="text-muted">Total Lessons</div>
            </div>
          </div>
          
          <div className="d-grid gap-2 mt-4">
            <button 
              className="btn btn-primary"
              onClick={handleContinueLearning}
            >
              <i className="bi bi-play-circle me-2"></i>
              Continue Learning
            </button>
          </div>
        </div>
      </div>
      
      {/* Section-by-Section Progress */}
      <div className="card">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Progress by Section</h5>
        </div>
        <div className="card-body p-0">
          <ul className="list-group list-group-flush">
            {sectionProgress.map((section, index) => (
              <li key={index} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-semibold">{section.name}</span>
                  <span className="badge bg-secondary">
                    {section.completed}/{section.total} lessons
                  </span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div 
                    className={`progress-bar ${section.percentage === 100 ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${section.percentage}%` }}
                    role="progressbar" 
                    aria-valuenow={section.percentage} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Lesson Checklist (expanded view) */}
      <div className="card mt-4">
        <div className="card-header bg-light">
          <h5 className="card-title mb-0">Lesson Checklist</h5>
        </div>
        <div className="card-body p-0">
          <div className="accordion accordion-flush" id="lessonProgressAccordion">
            {Object.keys(lessonsBySection).map((section, sectionIdx) => (
              <div className="accordion-item" key={sectionIdx}>
                <h2 className="accordion-header">
                  <button 
                    className="accordion-button collapsed" 
                    type="button" 
                    data-bs-toggle="collapse"
                    data-bs-target={`#section-${sectionIdx}`}
                  >
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <span>{section}</span>
                      <span className="badge bg-secondary">
                        {lessonsBySection[section].filter(lesson => 
                          completedLessons.includes(lesson.id.toString())
                        ).length}/{lessonsBySection[section].length} completed
                      </span>
                    </div>
                  </button>
                </h2>
                <div 
                  id={`section-${sectionIdx}`} 
                  className="accordion-collapse collapse"
                  data-bs-parent="#lessonProgressAccordion"
                >
                  <div className="accordion-body p-0">
                    <ul className="list-group list-group-flush">
                      {lessonsBySection[section].map((lesson, lessonIdx) => {
                        const isCompleted = completedLessons.includes(lesson.id.toString());
                        
                        return (
                          <li 
                            key={`${sectionIdx}-${lessonIdx}`} 
                            className="list-group-item d-flex align-items-center"
                          >
                            <div className="me-3">
                              {isCompleted ? (
                                <i className="bi bi-check-circle-fill text-success fs-5"></i>
                              ) : (
                                <i className="bi bi-circle text-muted fs-5"></i>
                              )}
                            </div>
                            <div className="flex-grow-1">
                              <div className={isCompleted ? 'text-decoration-line-through text-muted' : ''}>
                                {lesson.title}
                              </div>
                              {lesson.duration && (
                                <small className="text-muted">Duration: {lesson.duration} min</small>
                              )}
                            </div>
                            <Link href={`/learn/${courseId}/${lesson.id}`}>
                              <button className="btn btn-sm btn-outline-primary">
                                {isCompleted ? 'Review' : 'Start'}
                              </button>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseProgressTracker;