// Lesson View Page
// Created by Chakridhar

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';
import { getEnrollment, markLessonComplete } from '../services/enrollmentService';

const VideoPlayer = ({ src, type = 'url', title = 'Video' }) => {
  // Handle different video sources
  let playerContent;
  
  if (!src) {
    return (
      <div className="ratio ratio-16x9 bg-dark d-flex align-items-center justify-content-center">
        <div className="text-white">No video available</div>
      </div>
    );
  }
  
  // YouTube
  if (src.includes('youtube.com') || src.includes('youtu.be')) {
    // Convert any YouTube URL to embed format
    const videoId = src.includes('youtu.be') 
      ? src.split('youtu.be/')[1].split('?')[0]
      : src.split('v=')[1].split('&')[0];
    
    playerContent = (
      <iframe 
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        className="w-100 h-100"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  }
  // Vimeo
  else if (src.includes('vimeo.com')) {
    const vimeoId = src.split('vimeo.com/')[1].split('?')[0];
    
    playerContent = (
      <iframe 
        src={`https://player.vimeo.com/video/${vimeoId}`}
        title={title}
        className="w-100 h-100"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  }
  // Direct video URL or uploaded file
  else {
    playerContent = (
      <video 
        src={src} 
        controls 
        className="w-100 h-100" 
        controlsList="nodownload"
        poster="/path/to/poster.jpg"
      >
        Your browser does not support the video tag.
      </video>
    );
  }
  
  return (
    <div className="ratio ratio-16x9">
      {playerContent}
    </div>
  );
};

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const { user, isAuthenticated, isStudent } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  
  // Load course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const courseData = await courseResponse.json();
        setCourse(courseData);
        setCourseLoading(false);
        
        // Fetch all lessons for this course
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`);
        if (lessonsResponse.ok) {
          const lessonsData = await lessonsResponse.json();
          setLessons(lessonsData || []);
          
          // If lessonId is not provided, use the first lesson
          if (!lessonId && lessonsData.length > 0) {
            setLocation(`/learn/${courseId}/${lessonsData[0].id}`);
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course data',
          variant: 'error',
        });
        setCourseLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, lessonId, setLocation, toast]);
  
  // Load lesson data and check enrollment
  useEffect(() => {
    const fetchLessonAndEnrollment = async () => {
      if (!lessonId) return;
      
      try {
        // Fetch lesson details
        setLessonLoading(true);
        const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
        if (!lessonResponse.ok) {
          throw new Error('Failed to fetch lesson details');
        }
        
        const lessonData = await lessonResponse.json();
        setLesson(lessonData);
        
        // Check enrollment status
        if (isAuthenticated && isStudent) {
          const enrollmentData = await getEnrollment(courseId);
          setEnrollment(enrollmentData);
          
          // Set completed lessons
          if (enrollmentData && enrollmentData.completedLessons) {
            setCompletedLessons(enrollmentData.completedLessons);
          }
          
          // Determine if user has access to this lesson
          const canAccess = 
            enrollmentData || // Enrolled students have access to all lessons
            lessonData.isPreview; // Non-enrolled users can access preview lessons
            
          setHasAccess(canAccess);
        } else {
          // For non-authenticated users or non-students, only allow preview lessons
          setHasAccess(lessonData.isPreview);
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast({
          title: 'Error',
          description: 'Failed to load lesson data',
          variant: 'error',
        });
      } finally {
        setLessonLoading(false);
      }
    };
    
    fetchLessonAndEnrollment();
  }, [courseId, lessonId, isAuthenticated, isStudent, toast]);
  
  // Mark lesson as complete
  const handleMarkComplete = async () => {
    if (!isAuthenticated || !isStudent || !enrollment) {
      return;
    }
    
    try {
      await markLessonComplete(courseId, lessonId);
      
      // Update completed lessons locally
      if (!completedLessons.includes(lessonId)) {
        setCompletedLessons([...completedLessons, lessonId]);
      }
      
      toast({
        title: 'Progress Updated',
        description: 'Lesson marked as completed',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lesson progress',
        variant: 'error',
      });
    }
  };
  
  // Group lessons by section
  const lessonsBySection = lessons.reduce((acc, lesson) => {
    const section = lesson.section || 'Main Content';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(lesson);
    return acc;
  }, {});
  
  // Set initial active section
  useEffect(() => {
    if (lesson && lessons.length > 0) {
      const currentSection = lesson.section || 'Main Content';
      setActiveSection(currentSection);
    }
  }, [lesson, lessons]);
  
  // Loading state
  if (courseLoading || lessonLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading content...</p>
      </div>
    );
  }
  
  // Course not found
  if (!course) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Course Not Found</h4>
          <p>The course you are looking for does not exist or has been removed.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setLocation('/courses')}
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }
  
  // Lesson not found
  if (!lesson) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning">
          <h4 className="alert-heading">Lesson Not Found</h4>
          <p>The lesson you are looking for does not exist or has been removed.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setLocation(`/courses/${courseId}`)}
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }
  
  // No access to lesson
  if (!hasAccess) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">
          <h4 className="alert-heading">Access Restricted</h4>
          <p>You need to enroll in this course to access this lesson.</p>
          <div className="mt-3">
            <button 
              className="btn btn-primary me-2"
              onClick={() => setLocation(`/courses/${courseId}`)}
            >
              Enroll Now
            </button>
            <button 
              className="btn btn-outline-secondary"
              onClick={() => setLocation('/courses')}
            >
              Browse Other Courses
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Find next lesson for navigation
  const findNextLesson = () => {
    const allLessons = Object.values(lessonsBySection).flat();
    const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
    return currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  };
  
  // Find previous lesson for navigation
  const findPrevLesson = () => {
    const allLessons = Object.values(lessonsBySection).flat();
    const currentIndex = allLessons.findIndex(l => l.id === parseInt(lessonId));
    return currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  };
  
  const nextLesson = findNextLesson();
  const prevLesson = findPrevLesson();
  
  return (
    <div className="bg-light">
      <div className="container-fluid">
        <div className="row">
          {/* Sidebar - Lesson List */}
          <div className="col-lg-3 col-xl-2 bg-white border-end vh-100 overflow-auto position-fixed d-none d-lg-block p-0">
            <div className="p-3 border-bottom">
              <h5 className="mb-0">{course.title}</h5>
            </div>
            
            <div className="accordion accordion-flush" id="courseContent">
              {Object.keys(lessonsBySection).map((section, index) => (
                <div className="accordion-item" key={section}>
                  <h2 className="accordion-header">
                    <button 
                      className={`accordion-button ${section !== activeSection ? 'collapsed' : ''}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#section${index}`}
                      aria-expanded={section === activeSection}
                      aria-controls={`section${index}`}
                    >
                      {section}
                    </button>
                  </h2>
                  <div 
                    id={`section${index}`} 
                    className={`accordion-collapse collapse ${section === activeSection ? 'show' : ''}`}
                    data-bs-parent="#courseContent"
                  >
                    <div className="accordion-body p-0">
                      <ul className="list-group list-group-flush">
                        {lessonsBySection[section].map((sectionLesson, i) => (
                          <li 
                            key={sectionLesson.id} 
                            className={`list-group-item border-0 ${parseInt(lessonId) === sectionLesson.id ? 'bg-light' : ''}`}
                          >
                            <a 
                              href={`/learn/${courseId}/${sectionLesson.id}`}
                              className="d-flex align-items-start text-decoration-none text-dark py-2"
                              onClick={(e) => {
                                e.preventDefault();
                                setLocation(`/learn/${courseId}/${sectionLesson.id}`);
                              }}
                            >
                              <div className="flex-shrink-0 me-2">
                                {completedLessons.includes(sectionLesson.id.toString()) ? (
                                  <i className="bi bi-check-circle-fill text-success"></i>
                                ) : parseInt(lessonId) === sectionLesson.id ? (
                                  <i className="bi bi-play-circle-fill text-primary"></i>
                                ) : (
                                  <i className="bi bi-circle text-muted"></i>
                                )}
                              </div>
                              <div>
                                <div className={parseInt(lessonId) === sectionLesson.id ? 'fw-bold' : ''}>{sectionLesson.title}</div>
                                <small className="text-muted d-block">
                                  {sectionLesson.duration} min
                                  {sectionLesson.isPreview && <span className="badge bg-info ms-1">Preview</span>}
                                </small>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="col-lg-9 col-xl-10 ms-auto p-0">
            {/* Video Player Area */}
            <div className="bg-dark">
              <div className="container-fluid p-0">
                <VideoPlayer 
                  src={lesson.videoUrl} 
                  type={lesson.videoType} 
                  title={lesson.title}
                />
              </div>
            </div>
            
            {/* Lesson Content & Navigation */}
            <div className="container py-4">
              <div className="row">
                <div className="col-md-8">
                  <h2 className="mb-3">{lesson.title}</h2>
                  
                  {lesson.description && (
                    <div className="mb-4">
                      <p className="text-muted">{lesson.description}</p>
                    </div>
                  )}
                  
                  {/* Lesson Navigation */}
                  <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
                    {prevLesson ? (
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setLocation(`/learn/${courseId}/${prevLesson.id}`)}
                      >
                        <i className="bi bi-arrow-left me-1"></i> Previous Lesson
                      </button>
                    ) : (
                      <div></div> // Empty div to maintain flex spacing
                    )}
                    
                    {isAuthenticated && isStudent && enrollment && (
                      <button
                        className={`btn ${completedLessons.includes(lessonId.toString()) ? 'btn-success' : 'btn-primary'}`}
                        onClick={handleMarkComplete}
                      >
                        {completedLessons.includes(lessonId.toString()) ? (
                          <>
                            <i className="bi bi-check2-circle me-1"></i> Completed
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-1"></i> Mark as Complete
                          </>
                        )}
                      </button>
                    )}
                    
                    {nextLesson ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => setLocation(`/learn/${courseId}/${nextLesson.id}`)}
                      >
                        Next Lesson <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    ) : (
                      <button
                        className="btn btn-success"
                        onClick={() => setLocation(`/courses/${courseId}`)}
                      >
                        <i className="bi bi-trophy me-1"></i> Complete Course
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="col-md-4">
                  <div className="card mb-4">
                    <div className="card-header">
                      <h5 className="mb-0">Course Progress</h5>
                    </div>
                    <div className="card-body">
                      {isAuthenticated && isStudent && enrollment ? (
                        <>
                          <div className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span>Completion</span>
                              <span>
                                {completedLessons.length} / {lessons.length} lessons
                              </span>
                            </div>
                            <div className="progress">
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{
                                  width: `${(completedLessons.length / lessons.length) * 100}%`
                                }}
                                aria-valuenow={(completedLessons.length / lessons.length) * 100}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                          
                          <p className="card-text text-muted">
                            Keep going! You're making great progress.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="card-text">
                            {isAuthenticated ? (
                              'Enroll to track your progress'
                            ) : (
                              'Sign in and enroll to track your progress'
                            )}
                          </p>
                          <button
                            className="btn btn-primary w-100"
                            onClick={() => setLocation(`/courses/${courseId}`)}
                          >
                            Enroll Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile Lesson Navigation */}
                  <div className="d-lg-none">
                    <div className="card mb-4">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Course Content</h5>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          data-bs-toggle="collapse"
                          data-bs-target="#mobileLessonList"
                        >
                          Show/Hide
                        </button>
                      </div>
                      <div className="collapse" id="mobileLessonList">
                        <div className="list-group list-group-flush">
                          {lessons.map((sectionLesson) => (
                            <a
                              key={sectionLesson.id}
                              href={`/learn/${courseId}/${sectionLesson.id}`}
                              className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${parseInt(lessonId) === sectionLesson.id ? 'active' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setLocation(`/learn/${courseId}/${sectionLesson.id}`);
                              }}
                            >
                              <div>
                                <div>{sectionLesson.title}</div>
                                <small>{sectionLesson.duration} min</small>
                              </div>
                              {completedLessons.includes(sectionLesson.id.toString()) && (
                                <i className="bi bi-check-circle-fill text-success"></i>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonView;