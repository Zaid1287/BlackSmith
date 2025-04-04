import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const textSizes = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm',
  };
  
  const logoSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  };
  
  const dividerSizes = {
    sm: 'text-3xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center">
        <div className={`${logoSizes[size]} font-bold flex items-center`}>
          <span>B</span>
          <span className={`mx-1 ${dividerSizes[size]}`}>|</span>
          <span>S</span>
        </div>
      </div>
      {showText && (
        <div className={`${textSizes[size]} tracking-widest font-medium mt-1`}>
          BLACKSMITH TRADERS
        </div>
      )}
    </div>
  );
}
