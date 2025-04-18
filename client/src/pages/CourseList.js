import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import CourseCard from '../components/CourseCard';
import Pagination from '../components/Pagination';
import { filterCoursesByCategory, filterCoursesByPrice, searchCourses, CATEGORIES } from '../utils/courseHelpers';

const ITEMS_PER_PAGE = 6;

const CourseList = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses']
  });
  
  // Apply filters whenever filters or courses change
  useEffect(() => {
    if (!courses) return;
    
    let result = [...courses];
    
    // Apply category filter
    if (category) {
      result = filterCoursesByCategory(result, category);
    }
    
    // Apply price filter
    if (priceRange) {
      result = filterCoursesByPrice(result, priceRange);
    }
    
    // Apply search
    if (searchTerm) {
      result = searchCourses(result, searchTerm);
    }
    
    setFilteredCourses(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [courses, category, priceRange, searchTerm]);
  
  // Pagination logic
  const totalPages = Math.ceil((filteredCourses?.length || 0) / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="py-16 bg-neutral-50 flex-grow fade-in">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-2">All Courses</h1>
        <p className="text-neutral-600 mb-8">Browse our collection of high-quality courses.</p>
        
        {/* Filters */}
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                <select 
                  id="category" 
                  className="border-neutral-300 focus:ring-primary focus:border-primary rounded-md px-3 py-2 w-full"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-neutral-700 mb-1">Price Range</label>
                <select 
                  id="price" 
                  className="border-neutral-300 focus:ring-primary focus:border-primary rounded-md px-3 py-2 w-full"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                >
                  <option value="">Any Price</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                  <option value="under50">Under $50</option>
                  <option value="50to100">$50 - $100</option>
                  <option value="over100">Over $100</option>
                </select>
              </div>
            </div>
            
            <div className="flex-grow md:max-w-xs">
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-1">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  id="search" 
                  placeholder="Search courses..." 
                  className="border-neutral-300 focus:ring-primary focus:border-primary rounded-md pl-10 pr-3 py-2 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2 text-neutral-400 material-icons">search</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <>
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <span className="material-icons text-4xl text-neutral-400 mb-2">search_off</span>
                <h3 className="text-xl font-bold text-neutral-700 mb-2">No courses found</h3>
                <p className="text-neutral-600">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedCourses.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    price={course.price}
                    category={course.category}
                    imageUrl={course.imageUrl}
                    instructor={course.instructor}
                    rating={4.5} // This would come from API in a real app
                    reviewCount={65} // This would come from API in a real app
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CourseList;