import React from 'react';
import { Link } from 'wouter';
import { formatPrice } from '../utils/courseHelpers';

const CourseCard = ({
  id,
  title,
  description,
  price,
  category,
  imageUrl,
  instructor,
  duration,
  rating,
  reviewCount
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden card-shadow flex flex-col">
      <img 
        src={imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"} 
        alt={title} 
        className="h-48 w-full object-cover"
      />
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-center mb-2">
          <span className="bg-primary-light text-primary-dark text-xs font-bold px-3 py-1 rounded-full">
            {category}
          </span>
          <span className="text-secondary-dark font-bold">
            {formatPrice(price)}
          </span>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-neutral-600 mb-4 line-clamp-2">{description}</p>
        <div className="flex items-center text-sm text-neutral-500 mb-4">
          <span className="material-icons text-sm mr-1">person</span>
          <span>{instructor?.name || 'Unknown Instructor'}</span>
          {duration && (
            <>
              <span className="mx-2">•</span>
              <span className="material-icons text-sm mr-1">access_time</span>
              <span>{duration} hours</span>
            </>
          )}
        </div>
        {rating && (
          <div className="flex items-center text-sm mb-1">
            <div className="flex text-yellow-400 mr-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-icons text-sm">
                  {star <= Math.floor(rating) 
                    ? 'star' 
                    : star - 0.5 <= rating 
                      ? 'star_half' 
                      : 'star_outline'}
                </span>
              ))}
            </div>
            <span className="text-neutral-600">
              {rating.toFixed(1)} {reviewCount && `(${reviewCount} reviews)`}
            </span>
          </div>
        )}
      </div>
      <div className="px-6 pb-6">
        <Link href={`/courses/${id}`}>
          <a className="block w-full bg-primary hover:bg-primary-dark text-white text-center py-2 rounded transition">
            View Course
          </a>
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;