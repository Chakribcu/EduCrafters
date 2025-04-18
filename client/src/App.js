// Main Application Component 
// Created by Chakridhar

import React from 'react';
import { Route, Switch } from 'wouter';
import ToastContainer from './components/Toast';

// Page imports
import HomePage from './pages/Home';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import Checkout from './pages/Checkout';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Student pages
import StudentDashboard from './pages/StudentDashboard';
import LessonView from './pages/LessonView';

// Instructor pages  
import InstructorDashboard from './pages/InstructorDashboard';
import CreateCourse from './pages/CreateCourse';
import EditCourse from './pages/EditCourse';
import AddLesson from './pages/AddLesson';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1">
        <Switch>
          {/* Public routes */}
          <Route path="/" component={HomePage} />
          <Route path="/courses" component={CourseList} />
          <Route path="/courses/:id" component={CourseDetail} />
          <Route path="/auth" component={AuthPage} />
          <Route path="/auth/sign-in" component={AuthPage} />
          <Route path="/auth/sign-up" component={AuthPage} />
          
          {/* Protected student routes */}
          <ProtectedRoute 
            path="/student/dashboard" 
            component={StudentDashboard} 
            roles={['student']} 
          />
          <ProtectedRoute 
            path="/learn/:courseId" 
            component={LessonView} 
            roles={['student']} 
          />
          <ProtectedRoute 
            path="/checkout" 
            component={Checkout} 
            roles={['student']} 
          />
          
          {/* Protected instructor routes */}
          <ProtectedRoute 
            path="/instructor/dashboard" 
            component={InstructorDashboard} 
            roles={['instructor']} 
          />
          <ProtectedRoute 
            path="/instructor/courses/create" 
            component={CreateCourse} 
            roles={['instructor']} 
          />
          <ProtectedRoute 
            path="/instructor/courses/:id/edit" 
            component={EditCourse} 
            roles={['instructor']} 
          />
          <ProtectedRoute 
            path="/instructor/courses/:courseId/lessons/add" 
            component={AddLesson} 
            roles={['instructor']} 
          />
          
          {/* 404 route */}
          <Route component={NotFound} />
        </Switch>
      </main>
      
      <Footer />
      
      {/* Toast notification container */}
      <ToastContainer />
    </div>
  );
}

export default App;