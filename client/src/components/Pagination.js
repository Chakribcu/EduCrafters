import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Add ellipsis if there are many pages before current
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis if there are many pages after current
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <nav className="inline-flex rounded-md shadow-sm isolate">
      <button 
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-3 py-2 rounded-l-md text-neutral-500 bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-icons text-sm">chevron_left</span>
      </button>
      
      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === '...' ? (
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium border border-neutral-300 bg-white text-neutral-300">
              ...
            </span>
          ) : (
            <button
              onClick={() => typeof page === 'number' && onPageChange(page)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border border-neutral-300 ${
                currentPage === page 
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-500 hover:bg-neutral-50'
              } focus:z-10`}
            >
              {page}
            </button>
          )}
        </React.Fragment>
      ))}
      
      <button 
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-3 py-2 rounded-r-md text-neutral-500 bg-white border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-icons text-sm">chevron_right</span>
      </button>
    </nav>
  );
};

export default Pagination;