// Add Lesson Page
// Created by Chakridhar

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';

const AddLesson = () => {
  const { courseId } = useParams();
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [section, setSection] = useState('');
  const [duration, setDuration] = useState(0);
  const [order, setOrder] = useState(1);
  const [isPreview, setIsPreview] = useState(false);
  const [videoType, setVideoType] = useState('url'); // 'url' or 'upload'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [existingSections, setExistingSections] = useState([]);
  
  // Video preview state
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Load course data and existing sections
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!courseResponse.ok) {
          throw new Error('Failed to fetch course details');
        }
        
        const course = await courseResponse.json();
        setCourseData(course);
        
        // Fetch lessons to get existing sections
        const lessonsResponse = await fetch(`/api/courses/${courseId}/lessons`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (lessonsResponse.ok) {
          const lessons = await lessonsResponse.json();
          // Extract unique section names
          const sections = [...new Set(lessons.map(lesson => lesson.section))].filter(Boolean);
          setExistingSections(sections);
          
          // Set initial order to be after the last lesson
          if (lessons.length > 0) {
            const maxOrder = Math.max(...lessons.map(lesson => lesson.order || 0));
            setOrder(maxOrder + 1);
          }
        }
      } catch (error) {
        console.error('Failed to load course data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load course data',
          variant: 'error',
        });
      }
    };
    
    fetchCourseData();
  }, [courseId, token, toast]);
  
  // Handle video file selection
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoFileName(file.name);
      // Reset URL when file is selected
      setVideoUrl('');
    }
  };
  
  // Handle video type change
  const handleVideoTypeChange = (type) => {
    setVideoType(type);
    if (type === 'url') {
      setVideoFile(null);
      setVideoFileName('');
    } else {
      setVideoUrl('');
    }
  };
  
  // Toggle video preview
  const handleToggleVideoPreview = () => {
    setShowVideoPreview(!showVideoPreview);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: 'Missing Title',
        description: 'Please provide a lesson title',
        variant: 'warning',
      });
      return;
    }
    
    if (videoType === 'url' && !videoUrl) {
      toast({
        title: 'Missing Video URL',
        description: 'Please provide a video URL',
        variant: 'warning',
      });
      return;
    }
    
    if (videoType === 'upload' && !videoFile) {
      toast({
        title: 'Missing Video File',
        description: 'Please upload a video file',
        variant: 'warning',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('section', section);
      formData.append('duration', duration);
      formData.append('order', order);
      formData.append('isPreview', isPreview);
      
      // Append either video file or URL
      if (videoType === 'upload' && videoFile) {
        formData.append('video', videoFile);
        formData.append('videoType', 'upload');
      } else {
        formData.append('videoUrl', videoUrl);
        formData.append('videoType', 'url');
      }
      
      // Send API request
      const response = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create lesson');
      }
      
      const lesson = await response.json();
      
      toast({
        title: 'Lesson Added',
        description: `"${title}" has been added to the course`,
        variant: 'success',
      });
      
      // Redirect back to course edit page
      setLocation(`/instructor/courses/${courseId}/edit`);
    } catch (error) {
      console.error('Lesson creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create lesson',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (!courseData) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading course data...</p>
      </div>
    );
  }
  
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col">
          <h1 className="mb-3">Add Lesson</h1>
          <p className="lead">
            Course: <strong>{courseData.title}</strong>
          </p>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit}>
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Lesson Details</h5>
              </div>
              <div className="card-body">
                {/* Lesson Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Lesson Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Introduction to JavaScript Variables"
                    required
                  />
                </div>
                
                {/* Lesson Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what this lesson covers"
                  ></textarea>
                </div>
                
                {/* Section */}
                <div className="mb-3">
                  <label htmlFor="section" className="form-label">Section</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    >
                      <option value="">Select or create a section</option>
                      {existingSections.map((sectionName, index) => (
                        <option key={index} value={sectionName}>
                          {sectionName}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Or type a new section name"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                    />
                  </div>
                  <div className="form-text">Group lessons into sections for better organization</div>
                </div>
                
                <div className="row mb-3">
                  {/* Duration */}
                  <div className="col-md-6">
                    <label htmlFor="duration" className="form-label">Duration (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="duration"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  
                  {/* Order */}
                  <div className="col-md-6">
                    <label htmlFor="order" className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      id="order"
                      min="1"
                      value={order}
                      onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                    />
                    <div className="form-text">Determines the lesson position within its section</div>
                  </div>
                </div>
                
                {/* Preview Option */}
                <div className="form-check mb-3">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isPreview"
                    checked={isPreview}
                    onChange={(e) => setIsPreview(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isPreview">
                    Make this lesson available as a preview
                  </label>
                  <div className="form-text">Preview lessons can be watched by non-enrolled students</div>
                </div>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Lesson Video</h5>
              </div>
              <div className="card-body">
                {/* Video Source Selection */}
                <div className="mb-3">
                  <label className="form-label d-block">Video Source</label>
                  
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="videoType"
                      id="videoUrl"
                      value="url"
                      checked={videoType === 'url'}
                      onChange={() => handleVideoTypeChange('url')}
                    />
                    <label className="form-check-label" htmlFor="videoUrl">
                      Video URL
                    </label>
                  </div>
                  
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="videoType"
                      id="videoUpload"
                      value="upload"
                      checked={videoType === 'upload'}
                      onChange={() => handleVideoTypeChange('upload')}
                    />
                    <label className="form-check-label" htmlFor="videoUpload">
                      Upload Video
                    </label>
                  </div>
                </div>
                
                {/* Video URL Input */}
                {videoType === 'url' && (
                  <div className="mb-3">
                    <label htmlFor="videoUrl" className="form-label">Video URL</label>
                    <input
                      type="url"
                      className="form-control"
                      id="videoUrl"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube, Vimeo, or direct video URL"
                    />
                    <div className="form-text">
                      Supported platforms: YouTube, Vimeo, or direct video links
                    </div>
                    
                    {videoUrl && (
                      <div className="mt-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={handleToggleVideoPreview}
                        >
                          {showVideoPreview ? 'Hide' : 'Show'} Preview
                        </button>
                        
                        {showVideoPreview && (
                          <div className="ratio ratio-16x9 mt-3">
                            <iframe
                              src={videoUrl}
                              title="Video Preview"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Video Upload */}
                {videoType === 'upload' && (
                  <div className="mb-3">
                    <label htmlFor="videoFile" className="form-label">Video File</label>
                    <input
                      type="file"
                      className="form-control"
                      id="videoFile"
                      accept="video/*"
                      onChange={handleVideoChange}
                    />
                    <div className="form-text">
                      Supported formats: MP4, WebM, MOV (max size: 500MB)
                    </div>
                    
                    {videoFile && (
                      <div className="mt-3">
                        <div className="alert alert-info d-flex align-items-center">
                          <i className="bi bi-file-earmark-play me-2"></i>
                          <div>
                            <strong>Selected file:</strong> {videoFileName}
                          </div>
                        </div>
                        
                        <div className="mt-2">
                          <video 
                            src={URL.createObjectURL(videoFile)} 
                            className="img-fluid" 
                            controls
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setLocation(`/instructor/courses/${courseId}/edit`)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding Lesson...
                  </>
                ) : 'Add Lesson'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="col-lg-4">
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h5 className="card-title">Tips for Creating Great Lessons</h5>
              <ul className="mb-0">
                <li className="mb-2">Keep videos concise (5-15 minutes)</li>
                <li className="mb-2">Focus on one concept per lesson</li>
                <li className="mb-2">Use clear titles that describe the content</li>
                <li className="mb-2">Make introductory lessons available as previews</li>
                <li className="mb-2">Group related lessons into logical sections</li>
              </ul>
            </div>
          </div>
          
          <div className="card border-primary mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Video Recommendations</h5>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li className="mb-2">Use a high-quality microphone for clear audio</li>
                <li className="mb-2">Record in a quiet environment</li>
                <li className="mb-2">Ensure good lighting if you appear on camera</li>
                <li className="mb-2">Record at 1080p resolution or higher</li>
                <li className="mb-2">Edit out long pauses and mistakes</li>
                <li className="mb-2">Use screen recording for software tutorials</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLesson;