
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: UserProfile, needsOnboarding: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const result = await api.login(rollNo, password);
        if (result.error) {
            setError(result.error);
        } else if (result.user) {
            onLoginSuccess(result.user, !!result.needsOnboarding);
        }
    } catch (err) {
        setError("Network error. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up transition-colors duration-200">
        <div className="bg-sits-700 dark:bg-sits-800 p-8 text-center relative overflow-hidden transition-colors duration-200">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="w-20 h-20 bg-white rounded-full absolute -top-4 -left-4"></div>
                <div className="w-32 h-32 bg-white rounded-full absolute top-10 right-10"></div>
            </div>
          <div className="mx-auto bg-white/20 w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">SITS</h1>
          <p className="text-sits-100 mt-2 text-sm font-medium">Siddhartha Institute of Science & Technology</p>
          <p className="text-white/80 text-xs uppercase tracking-widest mt-1">CSE-SE Portal</p>
        </div>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 text-center">Portal Login</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Roll Number / ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="23TQ1A5601"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 focus:border-transparent outline-none transition-all uppercase bg-white dark:bg-slate-700 dark:text-white"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 focus:border-transparent outline-none transition-all bg-white dark:bg-slate-700 dark:text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50 animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sits-600 hover:bg-sits-700 dark:bg-sits-700 dark:hover:bg-sits-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-sits-200 dark:shadow-none disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Login <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            <p>Student Default Password: <span className="font-mono font-bold text-slate-500 dark:text-slate-400">SITS</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
