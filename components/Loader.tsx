import React, { useState, useEffect } from 'react';
import { Book, FileText, Library, GraduationCap } from 'lucide-react';

export const Loader = () => {
  const [iconIndex, setIconIndex] = useState(0);
  const icons = [Book, FileText, Library, GraduationCap];
  const CurrentIcon = icons[iconIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="absolute inset-0 bg-sits-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
        <div className="relative bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl animate-bounce">
          <CurrentIcon className="w-8 h-8 text-sits-600 dark:text-sits-400 transition-all duration-300" />
        </div>
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 animate-pulse">
        Fetching Data...
      </p>
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded ${className}`}></div>
);
