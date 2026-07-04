import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const NigazhthisaiIcon: React.FC<LogoProps> = ({ className = '', size = 160 }) => {
  return (
    <svg 
      viewBox="0 0 1000 1000" 
      width={size} 
      height={size} 
      className={`select-none ${className}`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id="nigazhthisai-icon-svg"
    >
      {/* 1. Left Vertical Stem & Top-Left Horizontal Bar with 45-degree bevel */}
      <path 
        d="M 0,380 L 512,380 L 432,460 L 125,460 L 125,1000 L 0,1000 Z" 
        fill="#0D2A5D" 
        id="logo-left-stem-and-bar"
      />

      {/* 2. Middle Vertical Column of "ந" */}
      <path 
        d="M 322,260 L 435,260 L 435,800 L 322,800 Z" 
        fill="#0D2A5D" 
        id="logo-middle-column"
      />

      {/* 3. The Elegant "ி" Arc (Concentric Semi-circles) */}
      <path 
        d="M 322,260 A 324 324 0 0 1 970 260 L 857,260 A 211 211 0 0 0 435,260 Z" 
        fill="#0D2A5D" 
        id="logo-top-arc"
      />

      {/* 4. Right Vertical Stem with bottom diagonal slant */}
      <path 
        d="M 857,460 L 970,460 L 970,1000 L 857,900 Z" 
        fill="#0D2A5D" 
        id="logo-right-stem"
      />

      {/* 5. Bottom Right Loop of "ந" with True Vector Cutout */}
      <path 
        d="M 435,600 C 520,570 680,570 725,650 C 755,710 755,830 710,910 C 675,980 560,1000 450,1000 L 230,1000 L 322,900 L 322,800 L 435,800 Z M 435,713 L 435,800 C 435,850 510,870 560,820 C 610,770 600,713 540,713 Z" 
        fill="#0D2A5D" 
        fillRule="evenodd" 
        id="logo-bottom-loop"
      />

      {/* 6. Iconic Orange Map Pin hovering on the right branch */}
      <g id="logo-map-pin">
        {/* Teardrop map pin pointing downwards */}
        <path 
          d="M 913.5, 410 C 945, 370 965, 345 965, 320 C 965, 291 942, 268 913.5, 268 C 885, 268 862, 291 862, 320 C 862, 345 882, 370 913.5, 410 Z" 
          fill="#D97F00" 
        />
        {/* Inner white circle hole */}
        <circle 
          cx="913.5" 
          cy="320" 
          r="18" 
          fill="white" 
        />
      </g>
    </svg>
  );
};

export const NigazhthisaiWordmark: React.FC<LogoProps> = ({ className = '', size = 32 }) => {
  return (
    <div className={`flex items-center justify-center select-none ${className}`} id="nigazhthisai-wordmark-container">
      <h1 className="relative inline-flex items-end font-serif tracking-normal text-[#0D2A5D] leading-none select-none" style={{ fontSize: `${size}px`, fontFamily: "'Georgia', 'Times New Roman', serif" }}>
        {/* N */}
        <span className="font-semibold">N</span>
        
        {/* i with orange map pin */}
        <span className="relative inline-block font-semibold">
          i
          <span className="absolute -top-[0.35em] left-1/2 -translate-x-[45%] flex items-center justify-center w-[0.35em] h-[0.35em]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-[#D97F00]">
              <path d="M50,10 C25,10 10,25 10,45 C10,75 50,100 50,100 C50,100 90,75 90,45 C90,25 75,10 C50,10 Z" />
              <circle cx="50" cy="45" r="14" fill="white" />
            </svg>
          </span>
          {/* Hide the default font dot of 'i' with a matching white cover */}
          <span className="absolute top-[0.12em] left-1/2 -translate-x-1/2 w-[0.25em] h-[0.2em] bg-white rounded-full pointer-events-none" />
        </span>

        {/* g a z h t h */}
        <span className="font-semibold">g</span>
        <span className="font-semibold">a</span>
        <span className="font-semibold">z</span>
        <span className="font-semibold">h</span>
        <span className="font-semibold">t</span>
        <span className="font-semibold">h</span>

        {/* i with orange map pin */}
        <span className="relative inline-block font-semibold">
          i
          <span className="absolute -top-[0.35em] left-1/2 -translate-x-[45%] flex items-center justify-center w-[0.35em] h-[0.35em]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-[#D97F00]">
              <path d="M50,10 C25,10 10,25 10,45 C10,75 50,100 50,100 C50,100 90,75 90,45 C90,25 75,10 C50,10 Z" />
              <circle cx="50" cy="45" r="14" fill="white" />
            </svg>
          </span>
          <span className="absolute top-[0.12em] left-1/2 -translate-x-1/2 w-[0.25em] h-[0.2em] bg-white rounded-full pointer-events-none" />
        </span>

        {/* s a */}
        <span className="font-semibold">s</span>
        <span className="font-semibold">a</span>

        {/* i with orange map pin */}
        <span className="relative inline-block font-semibold">
          i
          <span className="absolute -top-[0.35em] left-1/2 -translate-x-[45%] flex items-center justify-center w-[0.35em] h-[0.35em]">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-[#D97F00]">
              <path d="M50,10 C25,10 10,25 10,45 C10,75 50,100 50,100 C50,100 90,75 90,45 C90,25 75,10 C50,10 Z" />
              <circle cx="50" cy="45" r="14" fill="white" />
            </svg>
          </span>
          <span className="absolute top-[0.12em] left-1/2 -translate-x-1/2 w-[0.25em] h-[0.2em] bg-white rounded-full pointer-events-none" />
        </span>
      </h1>
    </div>
  );
};
