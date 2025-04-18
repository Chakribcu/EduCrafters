import express from 'express';
import mongoose from 'mongoose';
import Course from '../../models/Course.js';
import Enrollment from '../../models/Enrollment.js';
import User from '../../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// This route gets all the analytics data for the instructor dashboard
// Only instructors can access this - it's protected
router.get('/instructor/dashboard', protect, authorize('instructor'), async (req, res) => {
  try {
    const instructorId = req.user._id;
    
    // Find all courses by this instructor
    const courses = await Course.find({ instructor: instructorId });
    
    if (!courses.length) {
      return res.status(200).json({
        totalCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
        courseStats: [],
        revenueData: [],
        studentEngagement: [],
        enrollmentsByMonth: [],
        courseCompletionRates: []
      });
    }
    
    const courseIds = courses.map(course => course._id);
    
    // Get enrollments for these courses
    const enrollments = await Enrollment.find({ 
      course: { $in: courseIds },
      paymentStatus: 'completed'
    }).populate('user', 'name email');
    
    // Calculate total students (unique users)
    const uniqueUserIds = [...new Set(enrollments.map(enrollment => enrollment.user._id.toString()))];
    const totalStudents = uniqueUserIds.length;
    
    // Calculate total revenue
    const totalRevenue = courses.reduce((total, course) => {
      const courseEnrollments = enrollments.filter(
        enrollment => enrollment.course.toString() === course._id.toString()
      );
      return total + (courseEnrollments.length * course.price);
    }, 0);
    
    // Get stats for each course
    const courseStats = await Promise.all(courses.map(async (course) => {
      const courseEnrollments = enrollments.filter(
        enrollment => enrollment.course.toString() === course._id.toString()
      );
      
      // Calculate average progress
      const totalProgress = courseEnrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
      const avgProgress = courseEnrollments.length > 0 
        ? Math.round(totalProgress / courseEnrollments.length) 
        : 0;
      
      // Calculate completion rate
      const completedEnrollments = courseEnrollments.filter(enrollment => enrollment.completed);
      const completionRate = courseEnrollments.length > 0
        ? Math.round((completedEnrollments.length / courseEnrollments.length) * 100)
        : 0;
      
      return {
        id: course._id,
        title: course.title,
        price: course.price,
        enrollments: courseEnrollments.length,
        revenue: courseEnrollments.length * course.price,
        avgProgress,
        completionRate,
        category: course.category,
        level: course.level
      };
    }));
    
    // Get revenue data by month (last 6 months)
    const revenueByMonth = await getRevenueByMonth(enrollments, courses);
    
    // Get student engagement data
    const studentEngagement = await getStudentEngagement(enrollments);
    
    // Get enrollments by month
    const enrollmentsByMonth = await getEnrollmentsByMonth(enrollments);
    
    // Get course completion rates
    const courseCompletionRates = courseStats.map(course => ({
      name: course.title,
      value: course.completionRate
    }));
    
    res.json({
      totalCourses: courses.length,
      totalStudents,
      totalRevenue,
      courseStats,
      revenueData: revenueByMonth,
      studentEngagement,
      enrollmentsByMonth,
      courseCompletionRates
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed stats for a single course
// Need to verify that the instructor actually owns this course
// Only the instructor who created the course can see these stats
router.get('/instructor/course/:courseId', protect, authorize('instructor'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;
    
    // Validate course exists and belongs to instructor
    const course = await Course.findOne({ 
      _id: courseId,
      instructor: instructorId 
    });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found or not owned by this instructor' });
    }
    
    // Get enrollments for this course
    const enrollments = await Enrollment.find({ 
      course: courseId,
      paymentStatus: 'completed'
    }).populate('user', 'name email');
    
    // Calculate stats
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter(enrollment => enrollment.completed).length;
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0;
    
    // Calculate average progress
    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    const avgProgress = totalEnrollments > 0 
      ? Math.round(totalProgress / totalEnrollments) 
      : 0;
    
    // Get revenue
    const revenue = totalEnrollments * course.price;
    
    // Get enrollments by date
    const enrollmentsByDate = await getEnrollmentsByDateForCourse(enrollments);
    
    // Calculate progress distribution
    const progressDistribution = calculateProgressDistribution(enrollments);
    
    res.json({
      courseTitle: course.title,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      avgProgress,
      revenue,
      enrollmentsByDate,
      progressDistribution
    });
    
  } catch (error) {
    console.error('Course analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get revenue by month
async function getRevenueByMonth(enrollments, courses) {
  // Get last 6 months
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      date: month,
      name: month.toLocaleString('default', { month: 'short' }),
      revenue: 0
    });
  }
  
  // Calculate revenue for each month
  enrollments.forEach(enrollment => {
    const enrollmentDate = new Date(enrollment.enrolledAt);
    const course = courses.find(c => c._id.toString() === enrollment.course.toString());
    
    if (course) {
      // Check if enrollment is within the last 6 months
      const monthIndex = months.findIndex(m => 
        m.date.getMonth() === enrollmentDate.getMonth() && 
        m.date.getFullYear() === enrollmentDate.getFullYear()
      );
      
      if (monthIndex !== -1) {
        months[monthIndex].revenue += course.price;
      }
    }
  });
  
  return months.map(month => ({
    name: month.name,
    revenue: month.revenue
  }));
}

// Helper function to get student engagement data
async function getStudentEngagement(enrollments) {
  // Define engagement levels
  const engagementLevels = [
    { name: 'Low (0-25%)', count: 0 },
    { name: 'Medium (26-50%)', count: 0 },
    { name: 'High (51-75%)', count: 0 },
    { name: 'Very High (76-100%)', count: 0 }
  ];
  
  // Calculate engagement level for each enrollment
  enrollments.forEach(enrollment => {
    const progress = enrollment.progress;
    
    if (progress <= 25) {
      engagementLevels[0].count++;
    } else if (progress <= 50) {
      engagementLevels[1].count++;
    } else if (progress <= 75) {
      engagementLevels[2].count++;
    } else {
      engagementLevels[3].count++;
    }
  });
  
  return engagementLevels;
}

// Helper function to get enrollments by month
async function getEnrollmentsByMonth(enrollments) {
  // Get last 6 months
  const months = [];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      date: month,
      name: month.toLocaleString('default', { month: 'short' }),
      count: 0
    });
  }
  
  // Count enrollments for each month
  enrollments.forEach(enrollment => {
    const enrollmentDate = new Date(enrollment.enrolledAt);
    
    // Check if enrollment is within the last 6 months
    const monthIndex = months.findIndex(m => 
      m.date.getMonth() === enrollmentDate.getMonth() && 
      m.date.getFullYear() === enrollmentDate.getFullYear()
    );
    
    if (monthIndex !== -1) {
      months[monthIndex].count++;
    }
  });
  
  return months.map(month => ({
    name: month.name,
    enrollments: month.count
  }));
}

// Helper function to get enrollments by date for a specific course
async function getEnrollmentsByDateForCourse(enrollments) {
  // Group enrollments by date
  const enrollmentsByDate = {};
  
  enrollments.forEach(enrollment => {
    const date = new Date(enrollment.enrolledAt).toISOString().split('T')[0];
    
    if (enrollmentsByDate[date]) {
      enrollmentsByDate[date]++;
    } else {
      enrollmentsByDate[date] = 1;
    }
  });
  
  // Convert to array format for charts
  return Object.keys(enrollmentsByDate).map(date => ({
    date,
    count: enrollmentsByDate[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Helper function to calculate progress distribution
function calculateProgressDistribution(enrollments) {
  // Define progress ranges
  const ranges = [
    { name: '0-10%', count: 0 },
    { name: '11-25%', count: 0 },
    { name: '26-50%', count: 0 },
    { name: '51-75%', count: 0 },
    { name: '76-99%', count: 0 },
    { name: '100%', count: 0 }
  ];
  
  // Count enrollments in each range
  enrollments.forEach(enrollment => {
    const progress = enrollment.progress;
    
    if (progress <= 10) {
      ranges[0].count++;
    } else if (progress <= 25) {
      ranges[1].count++;
    } else if (progress <= 50) {
      ranges[2].count++;
    } else if (progress <= 75) {
      ranges[3].count++;
    } else if (progress < 100) {
      ranges[4].count++;
    } else {
      ranges[5].count++;
    }
  });
  
  return ranges;
}

export default router;