import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 48, className = "" }) => {
  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size * 0.2,
      }}
    >
      <img 
        src="favicon-32x32.png" 
        alt="Logo DomusLog" 
        style={{ 
          width: '70%', 
          height: '70%', 
          objectFit: 'contain' 
        }} 
      />
    </div>
  );
};