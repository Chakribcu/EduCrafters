import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { formatDuration } from '../utils/courseHelpers';
import { getUserEnrollments } from '../services/enrollmentService'; 
import CourseProgressTracker from '../components/CourseProgressTracker';

const StudentDashboard = () => {
  const { user } = useClerkAuth();
  const [activeTab, setActiveTab] = useState('in-progress');
  const navigate = useNavigate();
  
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['/api/user/enrollments'],
    enabled: !!user, // Only fetch if user is authenticated
    refetchOnWindowFocus: false,
    staleTime: 30000, // 30 seconds
    onError: (error) => {
      console.error("Error fetching enrollments:", error);
    }
  });

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: "60vh"}}>
          <div className="spinner-border text-primary mb-3" style={{width: "3rem", height: "3rem"}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="mb-2">Loading your courses...</h4>
          <p className="text-muted">This may take a moment</p>
        </div>
      </div>
    );
  }

  // Filter enrollments by progress
  const inProgressCourses = enrollments?.filter(
    (enrollment) => !enrollment.completed && enrollment.paymentStatus === 'completed'
  ) || [];
  
  const completedCourses = enrollments?.filter(
    (enrollment) => enrollment.completed && enrollment.paymentStatus === 'completed'
  ) || [];

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Learning Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.firstName || "Student"}! Track your learning progress here.</p>
        </div>
        <div>
          <Link to="/profile" className="btn btn-outline-secondary me-2">
            <i className="bi bi-person-circle me-1"></i>
            My Profile
          </Link>
          <Link to="/courses" className="btn btn-primary">
            <i className="bi bi-book me-1"></i>
            Browse Courses
          </Link>
        </div>
      </div>
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-3 mb-4">
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <img 
                  src="https://randomuser.me/api/portraits/men/41.jpg" 
                  alt="Student" 
                  className="rounded-circle me-3"
                  width="60" height="60"
                />
                <div>
                  <h5 className="mb-0">{user?.firstName || "Student"}</h5>
                  <span className="badge bg-secondary">Student</span>
                </div>
              </div>
              <div className="card border-primary mb-3">
                <div className="card-body py-2">
                  <small className="text-muted">Enrolled Courses</small>
                  <h3 className="mb-0">{enrollments?.length || 0}</h3>
                </div>
              </div>
              <div className="list-group mb-4">
                <button 
                  onClick={() => setActiveTab('in-progress')}
                  className={`list-group-item list-group-item-action ${activeTab === 'in-progress' ? 'active' : ''}`}
                >
                  <i className="bi bi-play-circle me-2"></i>
                  My Courses
                </button>
                <button 
                  onClick={() => setActiveTab('completed')}
                  className={`list-group-item list-group-item-action ${activeTab === 'completed' ? 'active' : ''}`}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Completed
                </button>
                <Link to="/profile" className="list-group-item list-group-item-action">
                  <i className="bi bi-person me-2"></i>
                  Profile Settings
                </Link>
                <Link to="/profile?tab=billing" className="list-group-item list-group-item-action">
                  <i className="bi bi-receipt me-2"></i>
                  Purchase History
                </Link>
                <Link to="/profile?tab=settings" className="list-group-item list-group-item-action">
                  <i className="bi bi-gear me-2"></i>
                  Account Settings
                </Link>
              </div>
            </div>
          </div>
          
          <div className="card bg-light border">
            <div className="card-body">
              <h5 className="card-title"><i className="bi bi-question-circle text-primary me-2"></i>Need Help?</h5>
              <p className="card-text small">Our support team is here to help with any questions you may have.</p>
              <a href="#" className="btn btn-outline-primary btn-sm w-100">Contact Support</a>
            </div>
          </div>
        </div>
          
        {/* Main Content */}
        <div className="col-md-9">
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h4 className="mb-0">{activeTab === 'in-progress' ? 'Courses In Progress' : 'Completed Courses'}</h4>
            </div>
            <div className="card-body">
              {/* In Progress Courses */}
              {activeTab === 'in-progress' && (
                <>
                  {inProgressCourses.length > 0 ? (
                    <div className="row">
                      {inProgressCourses.map((enrollment) => (
                        <div key={enrollment.id} className="col-md-6 mb-4">
                          <div className="card h-100 border">
                            <div className="row g-0">
                              <div className="col-md-4">
                                <img 
                                  src={enrollment.course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"} 
                                  alt={enrollment.course.title} 
                                  className="img-fluid rounded-start h-100"
                                  style={{objectFit: "cover"}}
                                />
                              </div>
                              <div className="col-md-8">
                                <div className="card-body">
                                  <h5 className="card-title">{enrollment.course.title}</h5>
                                  <div className="small text-muted mb-2">
                                    <i className="bi bi-person me-1"></i>
                                    {enrollment.course.instructor?.name || 'Instructor'}
                                  </div>
                                  <div className="mb-3">
                                    <div className="small text-muted mb-1">Progress: {enrollment.progress}%</div>
                                    <div className="progress">
                                      <div 
                                        className="progress-bar" 
                                        role="progressbar" 
                                        style={{width: `${enrollment.progress}%`}}
                                        aria-valuenow={enrollment.progress}
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                      ></div>
                                    </div>
                                  </div>
                                  <Link to={`/courses/${enrollment.courseId}`} className="btn btn-sm btn-primary">
                                    <i className="bi bi-play-fill me-1"></i>
                                    Continue Learning
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-journal-x fs-1 text-muted"></i>
                      <h4 className="mt-3">No courses in progress</h4>
                      <p className="text-muted mb-4">You haven't enrolled in any courses yet.</p>
                      <Link to="/courses" className="btn btn-primary">
                        <i className="bi bi-search me-1"></i>
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </>
              )}
              
              {/* Completed Courses */}
              {activeTab === 'completed' && (
                <>
                  {completedCourses.length > 0 ? (
                    <div className="row">
                      {completedCourses.map((enrollment) => (
                        <div key={enrollment.id} className="col-md-6 mb-4">
                          <div className="card h-100 border">
                            <div className="row g-0">
                              <div className="col-md-4">
                                <img 
                                  src={enrollment.course.imageUrl || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"} 
                                  alt={enrollment.course.title} 
                                  className="img-fluid rounded-start h-100"
                                  style={{objectFit: "cover"}}
                                />
                              </div>
                              <div className="col-md-8">
                                <div className="card-body">
                                  <div className="d-flex justify-content-between">
                                    <h5 className="card-title">{enrollment.course.title}</h5>
                                    <span className="badge bg-success">Completed</span>
                                  </div>
                                  <div className="small text-muted mb-2">
                                    <i className="bi bi-person me-1"></i>
                                    {enrollment.course.instructor?.name || 'Instructor'}
                                  </div>
                                  <div className="mb-3">
                                    <div className="small text-muted mb-1">Progress: 100%</div>
                                    <div className="progress">
                                      <div 
                                        className="progress-bar bg-success" 
                                        role="progressbar" 
                                        style={{width: "100%"}}
                                        aria-valuenow="100"
                                        aria-valuemin="0" 
                                        aria-valuemax="100"
                                      ></div>
                                    </div>
                                  </div>
                                  <div className="d-flex">
                                    <a href="#" className="btn btn-sm btn-outline-primary me-2">
                                      <i className="bi bi-file-earmark-check me-1"></i>
                                      Certificate
                                    </a>
                                    <a href="#" className="btn btn-sm btn-outline-secondary">
                                      <i className="bi bi-star me-1"></i>
                                      Review
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="bi bi-trophy fs-1 text-muted"></i>
                      <h4 className="mt-3">No completed courses yet</h4>
                      <p className="text-muted mb-4">Complete your enrolled courses to see them here.</p>
                      {inProgressCourses.length > 0 ? (
                        <button 
                          onClick={() => setActiveTab('in-progress')}
                          className="btn btn-primary"
                        >
                          <i className="bi bi-arrow-left me-1"></i>
                          Back to My Courses
                        </button>
                      ) : (
                        <Link to="/courses" className="btn btn-primary">
                          <i className="bi bi-search me-1"></i>
                          Browse Courses
                        </Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Recommended Courses Section */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h4 className="mb-0">Recommended For You</h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border shadow-sm">
                    <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97" className="card-img-top" alt="Web Development" height="140" style={{objectFit: "cover"}} />
                    <div className="card-body">
                      <span className="badge bg-info mb-2">Development</span>
                      <h5 className="card-title">Complete Web Development Bootcamp</h5>
                      <p className="card-text small text-muted">Learn HTML, CSS, JavaScript, React, Node.js and MongoDB in this comprehensive course.</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">£99.99</span>
                        <div className="text-warning">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <span className="text-muted ms-1">(4.8)</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white">
                      <Link to="/courses/1" className="btn btn-outline-primary w-100">View Course</Link>
                    </div>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="card h-100 border shadow-sm">
                    <img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713" className="card-img-top" alt="Data Science" height="140" style={{objectFit: "cover"}} />
                    <div className="card-body">
                      <span className="badge bg-success mb-2">Data Science</span>
                      <h5 className="card-title">Python for Data Analysis and Visualization</h5>
                      <p className="card-text small text-muted">Master Python libraries like Pandas, NumPy, and Matplotlib for data science and analytics.</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold">£89.99</span>
                        <div className="text-warning">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-half"></i>
                          <span className="text-muted ms-1">(4.5)</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer bg-white">
                      <Link to="/courses/2" className="btn btn-outline-primary w-100">View Course</Link>
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

export default StudentDashboard;