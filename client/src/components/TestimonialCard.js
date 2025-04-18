import React from 'react';

const TestimonialCard = ({
  name,
  rating,
  text,
  avatar
}) => {
  return (
    <div className="p-6 rounded-lg bg-neutral-50 card-shadow">
      <div className="flex items-center mb-4">
        <img src={avatar} alt={name} className="w-12 h-12 rounded-full mr-4" />
        <div>
          <h4 className="font-bold">{name}</h4>
          <div className="flex text-yellow-400">
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
        </div>
      </div>
      <p className="text-neutral-600 italic">"{text}"</p>
    </div>
  );
};

export default TestimonialCard;