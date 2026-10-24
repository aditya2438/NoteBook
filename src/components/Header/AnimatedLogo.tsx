import React, { useState } from 'react';
import { playClickSound } from '../../utils/audioFeedback';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  onClick,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const dim =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
      ? 'w-12 h-12'
      : size === 'xl'
      ? 'w-16 h-16'
      : 'w-10 h-10';

  const handleClick = () => {
    playClickSound();
    if (onClick) onClick();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center gap-3 group cursor-pointer select-none transition-transform duration-300 ${className}`}
      title="AuraNotes Pro — Top 1% World-Class Infinite Spatial Canvas"
    >
      {/* Apple-grade Liquid Glassmorphic Animated Motion Squircle */}
      <div className={`relative ${dim} shrink-0 flex items-center justify-center`}>
        {/* Iridescent Celestial Aura Glow */}
        <div
          className={`absolute -inset-2 rounded-[22px] bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 blur-[12px] transition-all duration-700 ${
            isHovered ? 'opacity-95 scale-125 blur-[16px]' : 'opacity-60 animate-pulse'
          }`}
          style={{ animationDuration: '4s' }}
        />

        {/* Counter-Rotating Orbital Rings */}
        <div
          className="absolute -inset-2 rounded-full border border-cyan-400/40 border-dashed pointer-events-none"
          style={{
            animation: `spin ${isHovered ? '4s' : '12s'} linear infinite`,
          }}
        />
        <div
          className="absolute -inset-3 rounded-full border border-purple-400/30 border-dotted pointer-events-none"
          style={{
            animation: `spin ${isHovered ? '6s' : '18s'} linear infinite reverse`,
          }}
        />

        {/* Apple macOS Squircle Frosted Glass Chassis */}
        <div className="relative w-full h-full rounded-[18px] bg-gradient-to-b from-white/[0.22] to-black/[0.7] backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden group-hover:border-cyan-300/80 transition-all duration-500">
          {/* Top Specular Glass Reflection Rim (iPhone / Mac glass feel) */}
          <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/35 to-transparent pointer-events-none rounded-t-[17px]" />

          {/* Liquid Light Sweep Shimmer Animation */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
          />

          {/* Kinetic Geometric Origami Ribbon "A" Emblem */}
          <svg
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[82%] h-[82%] transform group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_2px_12px_rgba(56,189,248,0.5)]"
          >
            <defs>
              <linearGradient id="aetherNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#818cf8" />
                <stop offset="70%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>

              <linearGradient id="aetherBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>

              <filter id="aetherLogoGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Geometric "A" Left & Right Apex Struts */}
            <path
              d="M22 6L7 36H15L18.5 28H25.5L29 36H37L22 6Z"
              fill="url(#aetherNeonGrad)"
              filter="url(#aetherLogoGlow)"
            />

            {/* Central Diamond Inner Void */}
            <polygon
              points="22,14 19.8,22 24.2,22"
              fill="#060913"
            />

            {/* Specular White Rim Highlight */}
            <path
              d="M22 6L7 36"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />

            {/* Radiant Kinetic Crossbar Ray with Dash Pulse */}
            <line
              x1="12"
              y1="25"
              x2="32"
              y2="25"
              stroke="url(#aetherBeamGrad)"
              strokeWidth="1.8"
              strokeDasharray="3 4"
              strokeLinecap="round"
              className="animate-pulse"
              style={{ animationDuration: '1.8s' }}
            />

            {/* Orbiting Quantum Apex & Anchor Nodes */}
            <circle
              cx="22"
              cy="6"
              r="3.2"
              fill="#38bdf8"
              className="animate-ping origin-center"
              style={{ animationDuration: '2.5s' }}
            />
            <circle cx="22" cy="6" r="2.8" fill="#38bdf8" />
            <circle cx="7" cy="36" r="2.2" fill="#c084fc" />
            <circle cx="37" cy="36" r="2.2" fill="#22d3ee" />
            <circle cx="22" cy="25" r="2" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* Aesthetic High-End Brand Lockup */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-cyan-200 group-hover:to-fuchsia-300 transition-all duration-300 font-sans drop-shadow-sm">
            AuraNotes
          </span>
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-400/30 font-mono tracking-widest shadow-[0_2px_8px_rgba(56,189,248,0.25)]">
            PRO
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 hidden sm:inline">
            Infinite Spatial Intelligence • Zero Limits
          </span>
        )}
      </div>
    </div>
  );
};
