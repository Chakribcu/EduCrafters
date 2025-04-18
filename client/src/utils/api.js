// API utility functions for making HTTP requests

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

/**
 * Handles API requests with authentication
 */
const apiService = {
  /**
   * Get the stored JWT token
   */
  getToken() {
    return localStorage.getItem('token');
  },
  
  /**
   * Set JWT token in local storage
   * @param {string} token - JWT token
   */
  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    }
  },
  
  /**
   * Remove JWT token from local storage
   */
  removeToken() {
    localStorage.removeItem('token');
  },
  
  /**
   * Make a request to the API with authentication
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} Response data
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };
    
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },
  
  // Auth endpoints
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Response data
   */
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  },
  
  /**
   * Login a user
   * @param {Object} credentials - User login credentials
   * @returns {Promise} Response data
   */
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (data.token) {
      this.setToken(data.token);
    }
    
    return data;
  },
  
  /**
   * Get the current user
   * @returns {Promise} Response data
   */
  async getCurrentUser() {
    return this.request('/auth/user');
  },
  
  /**
   * Logout the current user
   */
  logout() {
    this.removeToken();
  },
  
  // Course endpoints
  
  /**
   * Get all courses
   * @returns {Promise} Response data
   */
  async getCourses() {
    return this.request('/courses');
  },
  
  /**
   * Get a single course by ID
   * @param {string} id - Course ID
   * @returns {Promise} Response data
   */
  async getCourse(id) {
    return this.request(`/courses/${id}`);
  },
  
  /**
   * Get courses by instructor
   * @returns {Promise} Response data
   */
  async getInstructorCourses() {
    return this.request('/instructor/courses');
  },
  
  /**
   * Create a new course
   * @param {Object} courseData - Course data
   * @returns {Promise} Response data
   */
  async createCourse(courseData) {
    return this.request('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },
  
  /**
   * Update a course
   * @param {string} id - Course ID
   * @param {Object} courseData - Course data
   * @returns {Promise} Response data
   */
  async updateCourse(id, courseData) {
    return this.request(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },
  
  /**
   * Delete a course
   * @param {string} id - Course ID
   * @returns {Promise} Response data
   */
  async deleteCourse(id) {
    return this.request(`/courses/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Lesson endpoints
  
  /**
   * Get lessons for a course
   * @param {string} courseId - Course ID
   * @returns {Promise} Response data
   */
  async getLessons(courseId) {
    return this.request(`/courses/${courseId}/lessons`);
  },
  
  /**
   * Create a lesson
   * @param {string} courseId - Course ID
   * @param {Object} lessonData - Lesson data
   * @returns {Promise} Response data
   */
  async createLesson(courseId, lessonData) {
    return this.request(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  },
  
  // Enrollment endpoints
  
  /**
   * Enroll in a course
   * @param {string} courseId - Course ID
   * @returns {Promise} Response data
   */
  async enrollInCourse(courseId) {
    return this.request(`/courses/${courseId}/enroll`, {
      method: 'POST',
    });
  },
  
  /**
   * Get user enrollments
   * @returns {Promise} Response data
   */
  async getUserEnrollments() {
    return this.request('/user/enrollments');
  },
  
  /**
   * Update enrollment progress
   * @param {string} enrollmentId - Enrollment ID
   * @param {number} progress - Progress percentage
   * @returns {Promise} Response data
   */
  async updateEnrollmentProgress(enrollmentId, progress) {
    return this.request(`/enrollments/${enrollmentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    });
  },
  
  // Payment endpoints
  
  /**
   * Create a payment intent
   * @param {Object} paymentData - Payment data
   * @returns {Promise} Response data
   */
  async createPaymentIntent(paymentData) {
    return this.request('/create-payment-intent', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  },
};

export default apiService;