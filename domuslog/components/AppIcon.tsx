import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 48, className = "" }) => {
  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: size * 0.2, // Leggero border-radius
      }}
    >
      <img 
        src="/favicon-32x32.png" 
        alt="Logo DomusLog" 
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain' 
        }} 
      />
    </div>
  );
};