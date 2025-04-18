import React, { useState } from 'react';
import { formatDuration } from '../utils/courseHelpers';

const LessonItem = ({
  section,
  lessons,
  isOpen = false
}) => {
  const [expanded, setExpanded] = useState(isOpen);
  
  const toggleSection = () => {
    setExpanded(!expanded);
  };
  
  const totalLessons = lessons.length;
  const totalDuration = lessons.reduce((total, lesson) => total + lesson.duration, 0);
  
  return (
    <div className="border border-neutral-200 rounded-lg mb-4">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer bg-neutral-50"
        onClick={toggleSection}
      >
        <div className="font-bold">{section}</div>
        <div className="flex items-center text-neutral-500">
          <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''} • {formatDuration(totalDuration)}</span>
          <span className="material-icons ml-2">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 border-t border-neutral-200">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-start mb-4 last:mb-0">
              <span className="material-icons text-primary mr-3 mt-1">
                {lesson.type === 'video' ? 'play_circle' : 
                 lesson.type === 'text' ? 'article' :
                 lesson.type === 'quiz' ? 'quiz' : 'assignment'}
              </span>
              <div>
                <div className="font-medium">{lesson.title}</div>
                <div className="text-sm text-neutral-500">{formatDuration(lesson.duration)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LessonItem;