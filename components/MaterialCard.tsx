
import React from 'react';

interface MaterialCardProps {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ children, title, onClick, className = "", style }) => {
  return (
    <div 
      onClick={onClick}
      style={style}
      className={`m3-card p-4 sm:p-6 overflow-hidden ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
    >
      {title && <h3 className="text-lg sm:text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-tight">{title}</h3>}
      {children}
    </div>
  );
};
