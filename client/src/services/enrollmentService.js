// Enrollment Service
// Created by Chakridhar

import { authHeader } from '../utils/auth';

// Base URL for API requests
const API_URL = '/api';

// Enroll in a course
export const enrollInCourse = async (courseId) => {
  try {
    console.log(`Enrolling in course ID: ${courseId}`);
    
    const response = await fetch(`${API_URL}/courses/${courseId}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to enroll in course');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Enrollment error:', error);
    throw error;
  }
};

// Get enrollment for a course
export const getEnrollment = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/enrollment`, {
      headers: {
        ...authHeader()
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not enrolled
      }
      throw new Error('Failed to get enrollment information');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get enrollment error:', error);
    return null;
  }
};

// Get all user enrollments
export const getUserEnrollments = async () => {
  try {
    const response = await fetch(`${API_URL}/enrollments`, {
      headers: {
        ...authHeader()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Get user enrollments error:', error);
    throw error;
  }
};

// Mark lesson as completed
export const markLessonComplete = async (courseId, lessonId) => {
  try {
    const response = await fetch(`${API_URL}/courses/${courseId}/lessons/${lessonId}/mark-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark lesson as complete');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Mark lesson complete error:', error);
    throw error;
  }
};

// Create payment for course enrollment
export const createPaymentIntent = async (courseId) => {
  try {
    const response = await fetch(`${API_URL}/payments/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ courseId })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create payment');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Payment creation error:', error);
    throw error;
  }
};