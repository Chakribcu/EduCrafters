import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import AnalyticsCharts from '../components/AnalyticsCharts';

// This is the instructor analytics dashboard
// Shows stats and charts for all the instructor's courses
const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Fetch analytics data when component mounts
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Fetch analytics data for the instructor dashboard
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/analytics/instructor/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics data: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data for a specific course
  const fetchCourseAnalytics = async (courseId) => {
    try {
      setLoadingCourse(true);
      setError(null);

      // Get token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/analytics/instructor/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch course analytics: ${response.status}`);
      }

      const data = await response.json();
      setCourseAnalytics(data);
    } catch (err) {
      console.error('Error fetching course analytics:', err);
      setError(err.message);
    } finally {
      setLoadingCourse(false);
    }
  };

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setCourseAnalytics(null);
    fetchCourseAnalytics(course.id);
  };

  // Reset course selection to view all analytics
  const handleResetSelection = () => {
    setSelectedCourse(null);
    setCourseAnalytics(null);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error Loading Analytics</h4>
          <p>{error}</p>
          <hr />
          <p className="mb-0">
            <button 
              className="btn btn-outline-danger"
              onClick={fetchAnalyticsData}
            >
              Try Again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Render dashboard when no course is selected
  if (!selectedCourse) {
    return (
      <div className="container-fluid mt-4">
        <div className="row mb-4">
          <div className="col-md-12">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link href="/instructor/dashboard">Dashboard</Link></li>
                <li className="breadcrumb-item active" aria-current="page">Analytics</li>
              </ol>
            </nav>
            <h1 className="mb-4">Instructor Analytics Dashboard</h1>
          </div>
        </div>

        {analyticsData && (
          <>
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card shadow-sm">
                  <div className="card-body text-center">
                    <h5 className="card-title">Total Courses</h5>
                    <h2 className="card-text text-primary">{analyticsData.totalCourses}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm">
                  <div className="card-body text-center">
                    <h5 className="card-title">Total Students</h5>
                    <h2 className="card-text text-success">{analyticsData.totalStudents}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card shadow-sm">
                  <div className="card-body text-center">
                    <h5 className="card-title">Total Revenue</h5>
                    <h2 className="card-text text-info">£{analyticsData.totalRevenue}</h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white">
                <h4 className="mb-0">Course Performance Overview</h4>
              </div>
              <div className="card-body">
                <AnalyticsCharts data={analyticsData} />
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-header bg-white">
                <h4 className="mb-0">Course Details</h4>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Category</th>
                        <th>Level</th>
                        <th>Price</th>
                        <th>Enrollments</th>
                        <th>Revenue</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.courseStats.map((course) => (
                        <tr key={course.id}>
                          <td>{course.title}</td>
                          <td>
                            <span className="badge bg-secondary">{course.category}</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              course.level === 'beginner' ? 'bg-success' :
                              course.level === 'intermediate' ? 'bg-warning' : 'bg-danger'
                            }`}>
                              {course.level}
                            </span>
                          </td>
                          <td>£{course.price}</td>
                          <td>{course.enrollments}</td>
                          <td>£{course.revenue}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary"
                              onClick={() => handleCourseSelect(course)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Render course-specific analytics
  return (
    <div className="container-fluid mt-4">
      <div className="row mb-4">
        <div className="col-md-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/instructor/dashboard">Dashboard</Link></li>
              <li className="breadcrumb-item"><a href="#" onClick={handleResetSelection}>Analytics</a></li>
              <li className="breadcrumb-item active" aria-current="page">{selectedCourse.title}</li>
            </ol>
          </nav>
          <h1 className="mb-4">Course Analytics: {selectedCourse.title}</h1>
        </div>
      </div>

      {loadingCourse ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading course analytics...</p>
        </div>
      ) : courseAnalytics ? (
        <>
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Enrollments</h5>
                  <h2 className="card-text text-primary">{courseAnalytics.totalEnrollments}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Completion Rate</h5>
                  <h2 className="card-text text-success">{courseAnalytics.completionRate}%</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Average Progress</h5>
                  <h2 className="card-text text-warning">{courseAnalytics.avgProgress}%</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm">
                <div className="card-body text-center">
                  <h5 className="card-title">Revenue</h5>
                  <h2 className="card-text text-info">£{courseAnalytics.revenue}</h2>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Enrollments Timeline</h5>
                </div>
                <div className="card-body">
                  {courseAnalytics.enrollmentsByDate.length > 0 ? (
                    <div className="enrollment-timeline">
                      <svg viewBox="0 0 600 200" className="enrollment-chart">
                        {/* X and Y axes */}
                        <line x1="40" y1="10" x2="40" y2="170" stroke="#ccc" />
                        <line x1="40" y1="170" x2="580" y2="170" stroke="#ccc" />
                        
                        {/* Plot the enrollment data */}
                        <polyline
                          fill="none"
                          stroke="#4C84FF"
                          strokeWidth="2"
                          points={courseAnalytics.enrollmentsByDate.map((item, index, arr) => {
                            const x = 40 + ((580 - 40) / (arr.length - 1 || 1)) * index;
                            const maxCount = Math.max(...arr.map(d => d.count));
                            const y = 170 - ((item.count / (maxCount || 1)) * 150);
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                        
                        {/* Data points */}
                        {courseAnalytics.enrollmentsByDate.map((item, index, arr) => {
                          const x = 40 + ((580 - 40) / (arr.length - 1 || 1)) * index;
                          const maxCount = Math.max(...arr.map(d => d.count));
                          const y = 170 - ((item.count / (maxCount || 1)) * 150);
                          // Only show every other label if there are more than 10 points
                          const showLabel = arr.length <= 10 || index % 2 === 0;
                          
                          return (
                            <g key={index}>
                              <circle cx={x} cy={y} r="4" fill="#4C84FF" />
                              {showLabel && (
                                <>
                                  <text x={x} y="185" textAnchor="middle" fontSize="10" transform={`rotate(45, ${x}, 185)`}>
                                    {new Date(item.date).toLocaleDateString()}
                                  </text>
                                  <text x={x} y={y - 10} textAnchor="middle" fontSize="10">{item.count}</text>
                                </>
                              )}
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  ) : (
                    <div className="alert alert-info">No enrollment timeline data available</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white">
                  <h5 className="mb-0">Progress Distribution</h5>
                </div>
                <div className="card-body">
                  {courseAnalytics.progressDistribution.length > 0 ? (
                    <div className="progress-distribution">
                      {courseAnalytics.progressDistribution.map((item, index) => {
                        const colors = ['#FF6B6B', '#FF9F40', '#FFC840', '#A3D977', '#4BC0C0', '#36A2EB'];
                        return (
                          <div key={index} className="progress-item">
                            <div className="progress-label">{item.name}</div>
                            <div className="progress" style={{ height: '25px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ 
                                  width: `${(item.count / Math.max(...courseAnalytics.progressDistribution.map(d => d.count)) * 100) || 1}%`,
                                  backgroundColor: colors[index % colors.length]
                                }}
                              >
                                {item.count}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="alert alert-info">No progress distribution data available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Actions</h5>
                </div>
                <div className="card-body">
                  <div className="d-flex gap-2">
                    <Link href={`/courses/${selectedCourse.id}`} className="btn btn-primary">
                      View Course
                    </Link>
                    <Link href={`/courses/${selectedCourse.id}/edit`} className="btn btn-warning">
                      Edit Course
                    </Link>
                    <Link href={`/courses/${selectedCourse.id}/lessons/add`} className="btn btn-success">
                      Add Lesson
                    </Link>
                    <button onClick={handleResetSelection} className="btn btn-secondary">
                      Back to Overview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info">No data available for this course</div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;