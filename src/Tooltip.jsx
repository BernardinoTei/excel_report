import React, { useState } from 'react';

export function Tooltip({ children, content }) {
  const [isVisible, setIsVisible] = useState(false);
  
  if (!content) {
    return children;
  }
  
  return (
    <div 
      className="relative inline-block w-full"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      {isVisible && content && (
        <div className="absolute z-10 bg-gray-800 text-white text-xs rounded p-2 max-w-xs shadow-lg whitespace-normal break-words left-0 mt-1">
          {content}
        </div>
      )}
    </div>
  );
}