// Course Creation Page
// Created by Chakridhar

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { useToast } from '../hooks/use-toast';

const CreateCourse = () => {
  const { userData, getAuthToken } = useClerkAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(null);
  
  // Get auth token on component mount
  useEffect(() => {
    const fetchToken = async () => {
      const authToken = await getAuthToken();
      setToken(authToken);
    };
    
    fetchToken();
  }, [getAuthToken]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState('development');
  const [level, setLevel] = useState('beginner');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [requirements, setRequirements] = useState('');
  const [objectives, setObjectives] = useState('');
  const [introVideoUrl, setIntroVideoUrl] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Video preview state
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  // Handle thumbnail file change
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setThumbnailUrl(''); // Clear URL when file is selected
    }
  };
  
  // Handle intro video preview toggle
  const handleToggleVideoPreview = () => {
    setShowVideoPreview(!showVideoPreview);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'warning',
      });
      return;
    }
    
    // Make sure we have a valid token
    if (!token) {
      const freshToken = await getAuthToken();
      if (!freshToken) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create courses',
          variant: 'destructive',
        });
        return;
      }
      setToken(freshToken);
    }
    
    setLoading(true);
    
    try {
      // Format requirements and objectives as arrays
      const requirementsArray = requirements
        .split('\n')
        .map(req => req.trim())
        .filter(req => req.length > 0);
        
      const objectivesArray = objectives
        .split('\n')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('level', level);
      formData.append('requirements', JSON.stringify(requirementsArray));
      formData.append('objectives', JSON.stringify(objectivesArray));
      formData.append('introVideoUrl', introVideoUrl);
      formData.append('isPublished', isPublished.toString());
      
      // Append either file or URL
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      } else if (thumbnailUrl) {
        formData.append('thumbnailUrl', thumbnailUrl);
      }
      
      // Send API request
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to create course');
      }
      
      const newCourse = await response.json();
      
      toast({
        title: 'Course Created',
        description: 'Your course has been created successfully',
        variant: 'success',
      });
      
      // Redirect to the edit page to add lessons
      setLocation(`/instructor/courses/${newCourse.id}/edit`);
    } catch (error) {
      console.error('Course creation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create course',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container py-5">
      <div className="row mb-4">
        <div className="col">
          <h1 className="mb-3">Create New Course</h1>
          <p className="lead">Fill in the details below to create your new course</p>
        </div>
      </div>
      
      <div className="row">
        <div className="col-lg-8">
          <form onSubmit={handleSubmit}>
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Basic Information</h5>
              </div>
              <div className="card-body">
                {/* Course Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Course Title <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Complete JavaScript Bootcamp"
                    required
                  />
                </div>
                
                {/* Course Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description <span className="text-danger">*</span></label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows="4"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed description of your course"
                    required
                  ></textarea>
                </div>
                
                {/* Category & Level */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label">Category</label>
                    <select
                      className="form-select"
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="development">Web Development</option>
                      <option value="design">Design</option>
                      <option value="business">Business</option>
                      <option value="marketing">Marketing</option>
                      <option value="photography">Photography</option>
                      <option value="music">Music</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="level" className="form-label">Difficulty Level</label>
                    <select
                      className="form-select"
                      id="level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                {/* Price */}
                <div className="mb-3">
                  <label htmlFor="price" className="form-label">Price (in £)</label>
                  <div className="input-group">
                    <span className="input-group-text">£</span>
                    <input
                      type="number"
                      className="form-control"
                      id="price"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 49.99"
                    />
                  </div>
                  <div className="form-text">Set to 0 for free courses</div>
                </div>
                
                {/* Publication Status */}
                <div className="mb-3">
                  <label className="form-label d-block">Publication Status</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="publicationStatus"
                      id="draftStatus"
                      checked={!isPublished}
                      onChange={() => setIsPublished(false)}
                    />
                    <label className="form-check-label" htmlFor="draftStatus">
                      Save as Draft
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="publicationStatus"
                      id="publishStatus"
                      checked={isPublished}
                      onChange={() => setIsPublished(true)}
                    />
                    <label className="form-check-label" htmlFor="publishStatus">
                      Publish Immediately
                    </label>
                  </div>
                  <div className="form-text">
                    {isPublished 
                      ? 'Course will be visible to students after creation.' 
                      : 'Course will be saved as a draft and won\'t be visible to students until published.'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Course Media</h5>
              </div>
              <div className="card-body">
                {/* Thumbnail Image */}
                <div className="mb-4">
                  <label className="form-label">Course Thumbnail</label>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="thumbnailType" 
                        id="thumbnailURL" 
                        checked={!thumbnailFile}
                        onChange={() => setThumbnailFile(null)}
                      />
                      <label className="form-check-label" htmlFor="thumbnailURL">
                        Use Image URL
                      </label>
                    </div>
                    
                    {!thumbnailFile && (
                      <input
                        type="url"
                        className="form-control mt-2"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="radio" 
                        name="thumbnailType" 
                        id="thumbnailFile"
                        checked={thumbnailFile !== null}
                        onChange={() => setThumbnailUrl('')}
                      />
                      <label className="form-check-label" htmlFor="thumbnailFile">
                        Upload Image
                      </label>
                    </div>
                    
                    {thumbnailFile && (
                      <div className="input-group mt-2">
                        <input 
                          type="file" 
                          className="form-control" 
                          id="thumbnailUpload"
                          accept="image/*"
                          onChange={handleThumbnailChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview */}
                  {(thumbnailPreview || thumbnailUrl) && (
                    <div className="mt-3">
                      <label className="form-label">Preview:</label>
                      <div style={{ maxWidth: '300px', maxHeight: '200px', overflow: 'hidden' }}>
                        <img 
                          src={thumbnailPreview || thumbnailUrl} 
                          alt="Thumbnail Preview" 
                          className="img-fluid img-thumbnail"
                          style={{ objectFit: 'cover', width: '100%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Introduction Video */}
                <div className="mb-3">
                  <label htmlFor="introVideo" className="form-label">Introduction Video URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="introVideo"
                    value={introVideoUrl}
                    onChange={(e) => setIntroVideoUrl(e.target.value)}
                    placeholder="YouTube or Vimeo URL"
                  />
                  <div className="form-text">This video will be shown to non-enrolled students as a preview</div>
                  
                  {introVideoUrl && (
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
                            src={introVideoUrl}
                            title="Introduction Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h5 className="mb-0">Course Details</h5>
              </div>
              <div className="card-body">
                {/* Requirements */}
                <div className="mb-3">
                  <label htmlFor="requirements" className="form-label">Requirements</label>
                  <textarea
                    className="form-control"
                    id="requirements"
                    rows="4"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Add one requirement per line"
                  ></textarea>
                  <div className="form-text">Enter each requirement on a new line</div>
                </div>
                
                {/* Learning Objectives */}
                <div className="mb-3">
                  <label htmlFor="objectives" className="form-label">What Students Will Learn</label>
                  <textarea
                    className="form-control"
                    id="objectives"
                    rows="4"
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Add one learning objective per line"
                  ></textarea>
                  <div className="form-text">Enter each learning objective on a new line</div>
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => setLocation('/instructor/dashboard')}
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
                    Creating Course...
                  </>
                ) : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="col-lg-4">
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h5 className="card-title">Creating Your Course</h5>
              <p className="card-text">After creating your course, you'll be able to:</p>
              <ul className="mb-0">
                <li>Add lessons and sections</li>
                <li>Upload videos or provide video URLs</li>
                <li>Create quizzes and assignments</li>
                <li>Preview your course as a student</li>
                <li>Publish when you're ready</li>
              </ul>
            </div>
          </div>
          
          <div className="card border-primary mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Tips for Success</h5>
            </div>
            <div className="card-body">
              <ul className="mb-0">
                <li className="mb-2">Choose a specific, descriptive title</li>
                <li className="mb-2">Write a detailed course description</li>
                <li className="mb-2">Use a high-quality thumbnail image</li>
                <li className="mb-2">Create an engaging intro video</li>
                <li className="mb-2">Clearly define your target audience</li>
                <li className="mb-2">Outline what students will learn</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;