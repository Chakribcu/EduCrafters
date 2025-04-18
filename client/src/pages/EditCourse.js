import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const EditCourse = () => {
  const { id } = useParams();
  const { user } = useClerkAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'web-development',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    isPublished: false
  });
  
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '',
    description: '',
    content: '',
    duration: 10,
    order: 1,
    isPreview: false
  });
  
  const { title, description, category, level, price, thumbnail, isPublished } = formData;
  
  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = await user?.getToken();
        
        const response = await fetch(`/api/courses/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }
        
        const courseData = await response.json();
        
        // Update form data with course details
        setFormData({
          title: courseData.title,
          description: courseData.description,
          category: courseData.category,
          level: courseData.level,
          price: courseData.price,
          thumbnail: courseData.thumbnail || '',
          isPublished: courseData.isPublished
        });
        
        // Fetch lessons for this course
        const lessonsResponse = await fetch(`/api/courses/${id}/lessons`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!lessonsResponse.ok) {
          throw new Error('Failed to fetch lessons');
        }
        
        const lessonsData = await lessonsResponse.json();
        setLessons(lessonsData);
        
        // Set the new lesson order to be the next in sequence
        if (lessonsData.length > 0) {
          setNewLesson(prev => ({
            ...prev,
            order: Math.max(...lessonsData.map(l => l.order)) + 1
          }));
        }
        
      } catch (error) {
        console.error('Error fetching course:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load course',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (id && user) {
      fetchCourse();
    }
  }, [id, user, toast]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              name === 'price' ? parseFloat(value) : value
    }));
  };
  
  const handleLessonChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLesson(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
              name === 'duration' ? parseInt(value, 10) : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!title || !description || !category || !level || price < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const token = await user.getToken();
      
      const response = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error updating course');
      }
      
      toast({
        title: 'Success',
        description: 'Course updated successfully!',
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update course',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleAddLesson = async (e) => {
    e.preventDefault();
    
    // Validate lesson form
    if (!newLesson.title || !newLesson.content) {
      toast({
        title: 'Validation Error',
        description: 'Lesson title and content are required',
        variant: 'destructive'
      });
      return;
    }
    
    setAddingLesson(true);
    
    try {
      const token = await user.getToken();
      
      const response = await fetch(`/api/courses/${id}/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newLesson)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error adding lesson');
      }
      
      // Add the new lesson to the lessons array
      setLessons(prev => [...prev, data]);
      
      // Reset the form for a new lesson
      setNewLesson({
        title: '',
        description: '',
        content: '',
        duration: 10,
        order: newLesson.order + 1,
        isPreview: false
      });
      
      toast({
        title: 'Success',
        description: 'Lesson added successfully!',
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lesson',
        variant: 'destructive'
      });
    } finally {
      setAddingLesson(false);
    }
  };
  
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) {
      return;
    }
    
    try {
      const token = await user.getToken();
      
      const response = await fetch(`/api/courses/${id}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error deleting lesson');
      }
      
      // Remove the lesson from the lessons array
      setLessons(prev => prev.filter(lesson => lesson._id !== lessonId));
      
      toast({
        title: 'Success',
        description: 'Lesson deleted successfully!',
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lesson',
        variant: 'destructive'
      });
    }
  };
  
  const handlePublishToggle = async () => {
    try {
      const token = await user.getToken();
      
      const response = await fetch(`/api/courses/${id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished: !isPublished })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Error updating publication status');
      }
      
      setFormData(prev => ({
        ...prev,
        isPublished: !isPublished
      }));
      
      toast({
        title: 'Success',
        description: `Course ${isPublished ? 'unpublished' : 'published'} successfully!`,
        variant: 'success'
      });
      
    } catch (error) {
      console.error('Error toggling publish status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update publication status',
        variant: 'destructive'
      });
    }
  };
  
  // Redirect if user is not authenticated or not an instructor
  if (user && user.role !== 'instructor') {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Access Denied</h4>
          <p>You must be the course instructor to edit this course.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading course data...</p>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Course</h1>
        <div>
          <button 
            className="btn btn-outline-secondary me-2"
            onClick={() => navigate(`/courses/${id}`)}
          >
            Preview
          </button>
          <button 
            className={`btn ${isPublished ? 'btn-outline-danger' : 'btn-success'}`}
            onClick={handlePublishToggle}
          >
            {isPublished ? 'Unpublish' : 'Publish'} Course
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          {/* Course Details Form */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Course Details</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Course Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    className="form-control"
                    value={title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
                  <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    rows="5"
                    value={description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label">Category <span className="text-danger">*</span></label>
                    <select
                      id="category"
                      name="category"
                      className="form-select"
                      value={category}
                      onChange={handleChange}
                      required
                    >
                      <option value="web-development">Web Development</option>
                      <option value="mobile-development">Mobile Development</option>
                      <option value="data-science">Data Science</option>
                      <option value="ui-ux-design">UI/UX Design</option>
                      <option value="business">Business</option>
                      <option value="marketing">Marketing</option>
                      <option value="music">Music</option>
                      <option value="photography">Photography</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label htmlFor="level" className="form-label">Difficulty Level <span className="text-danger">*</span></label>
                    <select
                      id="level"
                      name="level"
                      className="form-select"
                      value={level}
                      onChange={handleChange}
                      required
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price (£) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="form-control"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="thumbnail" className="form-label">Thumbnail URL</label>
                  <input
                    type="url"
                    id="thumbnail"
                    name="thumbnail"
                    className="form-control"
                    value={thumbnail}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Lessons Management */}
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Lessons</h3>
              <span className="badge bg-light text-dark">{lessons.length} Lessons</span>
            </div>
            <div className="card-body">
              {lessons.length === 0 ? (
                <div className="alert alert-info">
                  No lessons yet. Add your first lesson below.
                </div>
              ) : (
                <div className="list-group mb-4">
                  {lessons
                    .sort((a, b) => a.order - b.order)
                    .map(lesson => (
                      <div key={lesson._id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                        <div>
                          <div className="d-flex align-items-center">
                            <span className="badge bg-secondary me-2">{lesson.order}</span>
                            <h5 className="mb-1">{lesson.title}</h5>
                            {lesson.isPreview && (
                              <span className="badge bg-success ms-2">Preview</span>
                            )}
                          </div>
                          <p className="mb-1 text-muted">{lesson.description || 'No description'}</p>
                          <small>{lesson.duration} min</small>
                        </div>
                        <div>
                          <button 
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => navigate(`/courses/${id}/lessons/${lesson._id}/edit`)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteLesson(lesson._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
              
              {/* Add Lesson Form */}
              <div className="card mb-3">
                <div className="card-header bg-light">
                  <h4 className="mb-0">Add New Lesson</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddLesson}>
                    <div className="mb-3">
                      <label htmlFor="lessonTitle" className="form-label">Lesson Title <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        id="lessonTitle"
                        name="title"
                        className="form-control"
                        value={newLesson.title}
                        onChange={handleLessonChange}
                        required
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="lessonDescription" className="form-label">Description</label>
                      <textarea
                        id="lessonDescription"
                        name="description"
                        className="form-control"
                        rows="2"
                        value={newLesson.description}
                        onChange={handleLessonChange}
                      ></textarea>
                    </div>
                    
                    <div className="mb-3">
                      <label htmlFor="lessonContent" className="form-label">Content <span className="text-danger">*</span></label>
                      <textarea
                        id="lessonContent"
                        name="content"
                        className="form-control"
                        rows="4"
                        value={newLesson.content}
                        onChange={handleLessonChange}
                        required
                      ></textarea>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="lessonDuration" className="form-label">Duration (minutes) <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          id="lessonDuration"
                          name="duration"
                          className="form-control"
                          min="1"
                          value={newLesson.duration}
                          onChange={handleLessonChange}
                          required
                        />
                      </div>
                      
                      <div className="col-md-6">
                        <label htmlFor="lessonOrder" className="form-label">Order <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          id="lessonOrder"
                          name="order"
                          className="form-control"
                          min="1"
                          value={newLesson.order}
                          onChange={handleLessonChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        id="lessonIsPreview"
                        name="isPreview"
                        className="form-check-input"
                        checked={newLesson.isPreview}
                        onChange={handleLessonChange}
                      />
                      <label className="form-check-label" htmlFor="lessonIsPreview">
                        Make this lesson available as a preview
                      </label>
                    </div>
                    
                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-success"
                        disabled={addingLesson}
                      >
                        {addingLesson ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Adding...
                          </>
                        ) : 'Add Lesson'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Course Status Card */}
          <div className="card mb-4">
            <div className="card-header bg-secondary text-white">
              <h4 className="mb-0">Course Status</h4>
            </div>
            <div className="card-body">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`badge ${isPublished ? 'bg-success' : 'bg-warning'}`}>
                  {isPublished ? 'Published' : 'Draft'}
                </span>
              </p>
              <p>
                <strong>Total Lessons:</strong> {lessons.length}
              </p>
              <p>
                <strong>Total Duration:</strong> {lessons.reduce((acc, lesson) => acc + lesson.duration, 0)} minutes
              </p>
              
              <hr />
              
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => navigate(`/courses/${id}`)}
                >
                  Preview Course
                </button>
                <button 
                  className={`btn ${isPublished ? 'btn-outline-danger' : 'btn-success'}`}
                  onClick={handlePublishToggle}
                >
                  {isPublished ? 'Unpublish' : 'Publish'} Course
                </button>
              </div>
            </div>
          </div>
          
          {/* Help Card */}
          <div className="card">
            <div className="card-header bg-info text-white">
              <h4 className="mb-0">Tips for Course Creation</h4>
            </div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Structure your content logically</strong>
                  <p className="small mb-0">Organize lessons in a structured way that builds knowledge step by step.</p>
                </li>
                <li className="list-group-item">
                  <strong>Include a preview lesson</strong>
                  <p className="small mb-0">Making at least one lesson available as a preview helps attract students.</p>
                </li>
                <li className="list-group-item">
                  <strong>Keep lessons concise</strong>
                  <p className="small mb-0">Aim for 5-15 minute lessons to maintain student engagement.</p>
                </li>
                <li className="list-group-item">
                  <strong>Add practical examples</strong>
                  <p className="small mb-0">Include real-world examples and exercises in your lessons.</p>
                </li>
                <li className="list-group-item">
                  <strong>Review before publishing</strong>
                  <p className="small mb-0">Preview your course to check for errors before publishing.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCourse;