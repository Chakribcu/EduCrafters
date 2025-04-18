// Format price to display
export const formatPrice = (price) => {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
};

// Convert minutes to hours and minutes format
export const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
};

// Get total duration for a course from its lessons
export const calculateTotalDuration = (lessons) => {
  return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
};

// Filter courses by category
export const filterCoursesByCategory = (courses, category) => {
  if (!category) return courses;
  return courses.filter(course => course.category === category);
};

// Filter courses by price range
export const filterCoursesByPrice = (courses, priceRange) => {
  if (!priceRange) return courses;
  
  switch (priceRange) {
    case 'free':
      return courses.filter(course => course.price === 0);
    case 'paid':
      return courses.filter(course => course.price > 0);
    case 'under50':
      return courses.filter(course => course.price > 0 && course.price < 50);
    case '50to100':
      return courses.filter(course => course.price >= 50 && course.price <= 100);
    case 'over100':
      return courses.filter(course => course.price > 100);
    default:
      return courses;
  }
};

// Search courses by title and description
export const searchCourses = (courses, searchTerm) => {
  if (!searchTerm) return courses;
  
  const lowerCaseSearch = searchTerm.toLowerCase();
  return courses.filter(
    course => 
      course.title.toLowerCase().includes(lowerCaseSearch) ||
      course.description.toLowerCase().includes(lowerCaseSearch)
  );
};

// Categories list for dropdowns
export const CATEGORIES = [
  { value: 'development', label: 'Development' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'design', label: 'Design' },
  { value: 'data-science', label: 'Data Science' },
  { value: 'photography', label: 'Photography' },
  { value: 'music', label: 'Music' },
  { value: 'other', label: 'Other' }
];

// Course levels for dropdowns
export const COURSE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'all-levels', label: 'All Levels' }
];

// Get category label from value
export const getCategoryLabel = (value) => {
  const category = CATEGORIES.find(cat => cat.value === value);
  return category ? category.label : 'Unknown';
};

// Get level label from value
export const getLevelLabel = (value) => {
  const level = COURSE_LEVELS.find(lvl => lvl.value === value);
  return level ? level.label : 'Unknown';
};