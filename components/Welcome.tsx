import React, { useEffect } from 'react';
import { UserProfile } from '../types';
import { Sparkles } from 'lucide-react';

interface WelcomeProps {
  user: UserProfile;
  onComplete: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ user, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-sits-900 z-50 flex flex-col items-center justify-center text-white p-4">
      <div className="animate-scale-up flex flex-col items-center">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
            {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-2xl object-cover relative z-10" />
            ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl bg-sits-700 flex items-center justify-center relative z-10">
                    <span className="text-4xl font-bold">{user.name.charAt(0)}</span>
                </div>
            )}
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full z-20">
                <Sparkles className="w-6 h-6 text-sits-900" />
            </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Welcome, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-sits-200 text-lg animate-slide-up text-center" style={{ animationDelay: '0.4s' }}>
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default Welcome;