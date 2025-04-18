import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const InstructorDashboard = () => {
  const { user } = useClerkAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    totalStudents: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        const token = await user?.getToken();
        
        // Fetch instructor's courses
        const coursesResponse = await fetch('/api/instructor/courses', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }
        
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
        
        // Fetch instructor stats
        const statsResponse = await fetch('/api/instructor/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching instructor data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load instructor data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user && user.role === 'instructor') {
      fetchInstructorData();
    } else if (user && user.role !== 'instructor') {
      // Redirect to student dashboard if user is not an instructor
      navigate('/dashboard');
    }
  }, [user, navigate, toast]);
  
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    
    try {
      const token = await user.getToken();
      
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error deleting course');
      }
      
      // Remove the deleted course from the list
      setCourses(prev => prev.filter(course => course._id !== courseId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalCourses: prev.totalCourses - 1,
        publishedCourses: prev.publishedCourses - (courses.find(c => c._id === courseId)?.isPublished ? 1 : 0)
      }));
      
      toast({
        title: 'Success',
        description: 'Course deleted successfully',
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete course',
        variant: 'destructive'
      });
    }
  };
  
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{minHeight: "60vh"}}>
          <div className="spinner-border text-primary mb-3" style={{width: "3rem", height: "3rem"}} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="mb-2">Just a sec!</h4>
          <p className="text-muted">Getting your instructor data ready...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>My Teaching Portal</h1>
          <p className="text-muted">Welcome back, {user?.firstName || "Instructor"}! Here's what's happening with your courses.</p>
        </div>
        <div>
          <Link to="/profile" className="btn btn-outline-secondary me-2">
            <i className="bi bi-person-circle me-1"></i>
            My Profile
          </Link>
          <Link to="/instructor/courses/create" className="btn btn-primary">
            <i className="bi bi-plus-circle me-1"></i>
            New Course
          </Link>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card border-primary">
            <div className="card-body">
              <h5 className="card-title text-primary">My Courses</h5>
              <h2 className="display-6">{stats.totalCourses}</h2>
              <p className="text-muted mb-0 small">total</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card border-success">
            <div className="card-body">
              <h5 className="card-title text-success">Live</h5>
              <h2 className="display-6">{stats.publishedCourses}</h2>
              <p className="text-muted mb-0 small">published</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3 mb-md-0">
          <div className="card border-info">
            <div className="card-body">
              <h5 className="card-title text-info">Students</h5>
              <h2 className="display-6">{stats.totalStudents}</h2>
              <p className="text-muted mb-0 small">enrolled</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-warning">
            <div className="card-body">
              <h5 className="card-title text-warning">Money</h5>
              <h2 className="display-6">£{stats.totalRevenue.toFixed(2)}</h2>
              <p className="text-muted mb-0 small">earned</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Courses Table */}
      <div className="card">
        <div className="card-header bg-light">
          <h3 className="mb-0">Your Courses</h3>
        </div>
        <div className="card-body">
          {courses.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-journal-x fs-1 text-muted"></i>
              <h4 className="mt-3">No courses yet</h4>
              <p className="text-muted">Create your first course to get started</p>
              <Link to="/instructor/courses/create" className="btn btn-primary mt-2">
                Create Course
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Rating</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr key={course._id}>
                      <td>
                        <Link to={`/courses/${course._id}`} className="text-decoration-none">
                          {course.title}
                        </Link>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{course.category.replace('-', ' ')}</span>
                      </td>
                      <td>£{course.price.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${course.isPublished ? 'bg-success' : 'bg-warning'}`}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{course.enrollmentCount || 0}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="me-2">{course.averageRating.toFixed(1)}</span>
                          <div className="text-warning">
                            {[...Array(5)].map((_, i) => (
                              <i 
                                key={i} 
                                className={`bi ${i < Math.round(course.averageRating) ? 'bi-star-fill' : 'bi-star'}`}
                              ></i>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="btn-group">
                          <Link 
                            to={`/instructor/courses/${course._id}/edit`} 
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Tips & Tricks */}
      <div className="card mt-4 border-secondary">
        <div className="card-header">
          <h4 className="mb-0">Tips & Tricks</h4>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3 mb-md-0">
              <h5><i className="bi bi-lightbulb text-warning me-2"></i>Make Good Content</h5>
              <ul>
                <li>Keep lessons short (5-15 mins)</li>
                <li>Add real examples students can use</li>
                <li>Use pictures to explain hard stuff</li>
              </ul>
            </div>
            <div className="col-md-4 mb-3 mb-md-0">
              <h5><i className="bi bi-people text-success me-2"></i>Get More Students</h5>
              <ul>
                <li>Make your first video free as preview</li>
                <li>Answer questions quickly</li>
                <li>Update your courses regularly</li>
              </ul>
            </div>
            <div className="col-md-4">
              <h5><i className="bi bi-currency-pound text-primary me-2"></i>Earn More</h5>
              <ul>
                <li>Price based on content value</li>
                <li>Bundle related courses together</li>
                <li>Run sales on special occasions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;