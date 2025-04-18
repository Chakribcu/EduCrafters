import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useClerkAuth } from '../hooks/useClerkAuth';
import { UserButton } from '@clerk/nextjs';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoaded, isSignedIn, user, logout } = useClerkAuth();
  const [currentLocation] = useLocation();
  
  // Helper functions to check user roles
  const isAuthenticated = () => isLoaded && isSignedIn;
  const isInstructor = () => isAuthenticated() && user?.publicMetadata?.role === 'instructor';
  const isStudent = () => isAuthenticated() && user?.publicMetadata?.role === 'student';

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div>
      <nav className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="material-icons text-primary-dark text-3xl mr-2">school</span>
            <Link href="/">
              <a className="text-2xl font-bold text-primary-dark">Educrafters</a>
            </Link>
          </div>
          
          <div className="hidden md:flex space-x-6 items-center">
            <Link href="/">
              <a className={`${currentLocation === '/' ? 'text-primary-dark' : 'text-neutral-700'} hover:text-primary-dark transition`}>
                Home
              </a>
            </Link>
            <Link href="/courses">
              <a className={`${currentLocation === '/courses' ? 'text-primary-dark' : 'text-neutral-700'} hover:text-primary-dark transition`}>
                Courses
              </a>
            </Link>
            <Link href="/about">
              <a className={`${currentLocation === '/about' ? 'text-primary-dark' : 'text-neutral-700'} hover:text-primary-dark transition`}>
                About
              </a>
            </Link>
            <Link href="/contact">
              <a className={`${currentLocation === '/contact' ? 'text-primary-dark' : 'text-neutral-700'} hover:text-primary-dark transition`}>
                Contact
              </a>
            </Link>
            {!isAuthenticated() && (
              <div className="flex items-center space-x-4">
                <Link href="/sign-in">
                  <a className="text-neutral-700 hover:text-primary-dark transition">Sign In</a>
                </Link>
                <Link href="/sign-up">
                  <a className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded transition">Sign Up</a>
                </Link>
              </div>
            )}
            
            {isAuthenticated() && isStudent() && (
              <div className="flex items-center">
                <div className="relative group">
                  <div className="flex items-center text-neutral-700 hover:text-primary-dark">
                    <UserButton />
                    <span className="ml-2">{user?.firstName}</span>
                    <span className="text-xs ml-1 bg-neutral-200 px-2 py-1 rounded-full">Student</span>
                  </div>
                </div>
                <Link href="/student/dashboard">
                  <a className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded ml-4 transition">Dashboard</a>
                </Link>
              </div>
            )}
            
            {isAuthenticated() && isInstructor() && (
              <div className="flex items-center">
                <div className="relative group">
                  <div className="flex items-center text-neutral-700 hover:text-primary-dark">
                    <UserButton />
                    <span className="ml-2">{user?.firstName}</span>
                    <span className="text-xs ml-1 bg-secondary-light px-2 py-1 rounded-full">Instructor</span>
                  </div>
                </div>
                <Link href="/instructor/dashboard">
                  <a className="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded ml-4 transition">Dashboard</a>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden flex items-center"
            onClick={toggleMobileMenu}
          >
            <span className="material-icons">menu</span>
          </button>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-4 py-2">
            <Link href="/">
              <a className="block py-2 text-neutral-700 hover:text-primary-dark">Home</a>
            </Link>
            <Link href="/courses">
              <a className="block py-2 text-neutral-700 hover:text-primary-dark">Courses</a>
            </Link>
            <Link href="/about">
              <a className="block py-2 text-neutral-700 hover:text-primary-dark">About</a>
            </Link>
            <Link href="/contact">
              <a className="block py-2 text-neutral-700 hover:text-primary-dark">Contact</a>
            </Link>
            
            {!isAuthenticated() && (
              <>
                <Link href="/sign-in">
                  <a className="block py-2 text-primary hover:text-primary-dark">Sign In</a>
                </Link>
                <Link href="/sign-up">
                  <a className="block py-2 text-primary-dark hover:text-primary">Sign Up</a>
                </Link>
              </>
            )}
            
            {isAuthenticated() && (
              <>
                <Link href={isInstructor() ? "/instructor/dashboard" : "/student/dashboard"}>
                  <a className="block py-2 text-primary hover:text-primary-dark">Dashboard</a>
                </Link>
                <Link href="/profile">
                  <a className="block py-2 text-neutral-700 hover:text-primary-dark">Profile</a>
                </Link>
                <Link href="/settings">
                  <a className="block py-2 text-neutral-700 hover:text-primary-dark">Settings</a>
                </Link>
                <button 
                  onClick={logout}
                  className="block py-2 text-primary hover:text-primary-dark"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </nav>
    </div>
  );
};

export default Navbar;