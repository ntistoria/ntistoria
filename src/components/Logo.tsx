import React from 'react';

const LOGO_URL = 'https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logpng.png';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon';
  className?: string;
  imgClassName?: string;
  src?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ variant = 'full', className = '', imgClassName = '', src, onClick }) => {
  const heightClass = variant === 'icon' ? 'h-9' : variant === 'compact' ? 'h-11' : 'h-14';

  return (
    <div 
      onClick={onClick}
      className={`inline-flex items-center cursor-pointer select-none group ${className}`}
    >
      <img 
        src={src || LOGO_URL} 
        alt="NT ისტორიის მასწავლებელი" 
        className={`${imgClassName || heightClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

