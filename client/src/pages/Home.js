import React from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import CourseCard from '../components/CourseCard';
import FeatureCard from '../components/FeatureCard';
import TestimonialCard from '../components/TestimonialCard';

const Home = () => {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses'],
    select: (data) => data.slice(0, 3) // Only show first 3 courses
  });

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <div className="bg-primary-dark text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">Expand Your Knowledge with EduCrafters</h1>
              <p className="text-lg mb-8">Access quality courses from expert instructors and take your skills to the next level.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/courses">
                  <a className="bg-white text-primary-dark font-bold py-3 px-6 rounded-md text-center hover:bg-neutral-100 transition">Browse Courses</a>
                </Link>
                <Link href="/register">
                  <a className="bg-secondary text-white font-bold py-3 px-6 rounded-md text-center hover:bg-secondary-dark transition">Become an Instructor</a>
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" alt="Students learning" className="rounded-lg shadow-lg w-full max-w-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose EduCrafters?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="school"
              title="Quality Courses"
              description="Access a wide range of professionally created courses across various disciplines."
              iconBgColor="bg-primary-light"
            />
            
            <FeatureCard 
              icon="person"
              title="Expert Instructors"
              description="Learn from industry professionals with years of experience in their fields."
              iconBgColor="bg-secondary-light"
            />
            
            <FeatureCard 
              icon="devices"
              title="Learn Anywhere"
              description="Access your courses anytime, anywhere, on any device with our responsive platform."
              iconBgColor="bg-accent-light"
            />
          </div>
        </div>
      </div>

      {/* Featured Courses Section */}
      <div className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Featured Courses</h2>
            <Link href="/courses">
              <a className="text-primary hover:text-primary-dark flex items-center">
                View All <span className="material-icons ml-1">arrow_forward</span>
              </a>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden card-shadow animate-pulse">
                  <div className="h-48 bg-gray-300 w-full"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-2 w-1/4"></div>
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded mb-6 w-1/2"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses?.map((course) => (
                <CourseCard 
                  key={course.id} 
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  price={course.price}
                  category={course.category}
                  imageUrl={course.imageUrl}
                  instructor={course.instructor}
                />
              ))}
              
              {courses?.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <p className="text-neutral-500">No courses available yet. Check back soon!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Emily Rodriguez"
              rating={5}
              text="The React course I took completely transformed my career. The instructor was knowledgeable and the content was up-to-date with industry standards."
              avatar="https://randomuser.me/api/portraits/women/32.jpg"
            />
            
            <TestimonialCard 
              name="Marcus Johnson"
              rating={4.5}
              text="The Data Science bootcamp was comprehensive and challenging. I appreciated the hands-on projects that helped me build a strong portfolio."
              avatar="https://randomuser.me/api/portraits/men/47.jpg"
            />
            
            <TestimonialCard 
              name="Sophia Chen"
              rating={5}
              text="The Digital Marketing course provided me with actionable strategies I could implement immediately. Within weeks, I saw significant improvements in my campaigns."
              avatar="https://randomuser.me/api/portraits/women/65.jpg"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">Join thousands of students who are already advancing their careers with EduCrafters's expert-led courses.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/courses">
              <a className="bg-white text-primary-dark font-bold py-3 px-6 rounded-md hover:bg-neutral-100 transition">Browse Courses</a>
            </Link>
            <Link href="/register">
              <a className="bg-transparent border-2 border-white text-white font-bold py-3 px-6 rounded-md hover:bg-white/10 transition">Sign Up Now</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;