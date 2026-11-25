import React from 'react';

interface SimnaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SimnaLogo: React.FC<SimnaLogoProps> = ({ size = 'md', className = '' }) => {
  const dims =
    size === 'sm'
      ? 'w-9 h-9 rounded-lg'
      : size === 'lg'
        ? 'w-16 h-16 rounded-2xl'
        : 'w-11 h-11 rounded-xl';

  return (
    <div
      className={`${dims} bg-yellow-400 text-zinc-950 flex flex-col items-center justify-center shrink-0 border-2 border-zinc-950 shadow-sm select-none ${className}`}
      aria-label="Simna Construction Logo"
    >
      <svg
        viewBox="0 0 64 52"
        className={size === 'sm' ? 'w-6 h-5' : size === 'lg' ? 'w-11 h-9' : 'w-8 h-6'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M12 32C12 20.402 20.954 11 32 11C43.046 11 52 20.402 52 32V36H12V32Z"
          fill="#0B0C0E"
        />
        <rect x="29" y="8" width="6" height="26" rx="2" fill="#FACC15" />
        <rect x="30.5" y="8" width="3" height="26" rx="1" fill="#0B0C0E" />
        <rect x="7" y="35" width="50" height="6" rx="3" fill="#0B0C0E" />
      </svg>
      <span
        className={`font-display font-bold tracking-wider leading-none text-zinc-950 ${
          size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-[13px] mt-0.5' : 'text-[9.5px]'
        }`}
      >
        SIMNA
      </span>
    </div>
  );
};
