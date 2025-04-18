import React from 'react';

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  iconBgColor 
}) => {
  return (
    <div className="text-center p-6 card-shadow rounded-lg bg-neutral-50">
      <div className={`${iconBgColor} inline-block p-3 rounded-full text-white mb-4`}>
        <span className="material-icons text-2xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
};

export default FeatureCard;