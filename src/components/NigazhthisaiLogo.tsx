import React from 'react';
import logoImg from '../assets/logo.jpeg';
import nameLogoImg from '../assets/name_logo.jpeg';

interface LogoProps {
  className?: string;
  size?: number;
}

export const NigazhthisaiIcon: React.FC<LogoProps> = ({ className = '', size = 160 }) => {
  return (
    <img 
      src={logoImg} 
      alt="Nigazhthisai Logo" 
      style={{ width: `${size}px`, height: `${size}px` }} 
      className={`object-contain rounded-full shadow-sm border border-slate-200 bg-white ${className}`}
    />
  );
};

export const NigazhthisaiWordmark: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  // Map size to a proportional display height
  return (
    <img 
      src={nameLogoImg} 
      alt="Nigazhthisai Wordmark" 
      style={{ height: `${size * 1.5}px` }} 
      className={`object-contain ${className}`}
    />
  );
};
