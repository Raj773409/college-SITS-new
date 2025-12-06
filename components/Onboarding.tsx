import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { Camera, Upload, Check, ChevronRight, User as UserIcon } from 'lucide-react';

interface OnboardingProps {
  initialUser: UserProfile;
  onComplete: (user: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ initialUser, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>(initialUser);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) { // 500KB limit
        alert("File size too large. Please upload an image under 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, profilePic: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.name) {
        setError("Please enter your full name.");
        return;
    }
    setError("");
    setStep(prev => prev + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const finalUser: UserProfile = {
      ...formData,
      password: password,
      isSetupComplete: true
    };
    
    // Save to local storage
    const storedUsers = localStorage.getItem('sits_users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[finalUser.rollNo] = finalUser;
    localStorage.setItem('sits_users', JSON.stringify(users));

    onComplete(finalUser);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar */}
        <div className="bg-sits-800 dark:bg-sits-900 p-8 md:w-1/3 flex flex-col justify-between text-white relative overflow-hidden transition-colors duration-200">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Setup Profile</h2>
            <p className="text-sits-200 text-sm">Complete your registration to access the student portal.</p>
          </div>
          <div className="mt-8 space-y-6 relative z-10">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`flex items-center space-x-3 ${step >= s ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s ? 'bg-white text-sits-800 border-white' : 'border-white/50'}`}>
                  {step > s ? <Check className="w-4 h-4" /> : <span className="text-sm font-bold">{s}</span>}
                </div>
                <span className="text-sm font-medium">
                  {s === 1 ? 'Personal Info' : s === 2 ? 'Academic Details' : 'Security'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:w-2/3 flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Who are you?</h3>
              
              <div className="flex justify-center mb-6">
                <div 
                  className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-slate-50 dark:border-slate-600 flex items-center justify-center overflow-hidden cursor-pointer relative group shadow-inner transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-slate-300 dark:text-slate-500" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              
               {error && <p className="text-red-500 text-sm">{error}</p>}

              <button onClick={handleNext} className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center">
                Next Step <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Academic Details</h3>
              
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Preferred Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                >
                  <option>English</option>
                  <option>Telugu</option>
                  <option>Hindi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({...formData, branch: e.target.value})}
                    className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    disabled // Locked to CSE-SE as per requirement, but editable if removed
                  />
                </div>
              </div>

              <button onClick={handleNext} className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center">
                Next Step <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-slide-up">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Secure Your Account</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create a new password for future logins.</p>

              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Min 4 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 outline-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                  placeholder="Re-enter password"
                />
              </div>

              {error && <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</p>}

              <button onClick={handleSubmit} className="w-full bg-sits-600 dark:bg-sits-700 text-white py-3 rounded-lg hover:bg-sits-700 dark:hover:bg-sits-600 transition-colors flex items-center justify-center shadow-lg shadow-sits-200 dark:shadow-none">
                Complete Setup <Check className="w-4 h-4 ml-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;