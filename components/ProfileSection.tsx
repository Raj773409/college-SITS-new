
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Camera, LogOut, Save } from 'lucide-react';
import { api } from '../services/api';
import { Skeleton } from './Loader';

interface ProfileSectionProps {
  user: UserProfile;
  onLogout: () => void;
  onUpdate: (user: UserProfile) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onLogout, onUpdate }) => {
  const [profileForm, setProfileForm] = useState(user);
  const [isUpdating, setIsUpdating] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileForm(user);
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
        const updatedUser = await api.updateUser(profileForm);
        onUpdate(updatedUser);
        alert("Profile updated successfully!");
    } catch (error) {
        alert("Failed to update profile");
    } finally {
        setIsUpdating(false);
    }
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB
        alert("File too large (max 500KB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileForm({ ...profileForm, profilePic: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full animate-slide-up">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Profile Settings</h1>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden card-hover-effect">
            <div className="p-8 border-b border-slate-200 dark:border-slate-700 bg-sits-50 dark:bg-slate-800/50 flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                    <img 
                        src={profileForm.profilePic || "https://picsum.photos/200"} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={profilePicInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleProfilePicChange}
                />
                <h2 className="text-2xl font-bold mt-4 dark:text-white">{user.name}</h2>
                <p className="text-slate-500 dark:text-slate-400">{user.rollNo}</p>
            </div>
            
            {isUpdating ? (
                <div className="p-8 space-y-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
            <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                            <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Roll Number</label>
                            <input type="text" value={profileForm.rollNo} disabled className="w-full p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-500 cursor-not-allowed" />
                        </div>
                         <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Branch</label>
                            <input type="text" value={profileForm.branch} disabled className="w-full p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Year</label>
                            <select 
                                value={profileForm.year} 
                                onChange={(e) => setProfileForm({...profileForm, year: e.target.value})}
                                className="w-full p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 dark:text-white"
                            >
                                <option value="1">1st Year</option>
                                <option value="2">2nd Year</option>
                                <option value="3">3rd Year</option>
                                <option value="4">4th Year</option>
                            </select>
                        </div>
                    </div>

                <div className="flex justify-between pt-4">
                     <button 
                        type="button" 
                        onClick={() => { api.logout(user.rollNo); onLogout(); }}
                        className="bg-red-50 text-red-600 dark:bg-red-900/20 px-6 py-3 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" /> Logout
                    </button>

                    <button type="submit" className="bg-sits-600 hover:bg-sits-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all hover:scale-105 flex items-center">
                        <Save className="w-4 h-4 mr-2" /> Save Changes
                    </button>
                </div>
            </form>
            )}
        </div>
    </div>
  );
};

export default ProfileSection;
