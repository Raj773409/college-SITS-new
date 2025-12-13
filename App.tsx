
import React, { useState, useEffect } from 'react';
import { UserProfile, AppRoute } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Welcome from './components/Welcome';
import { Dashboard } from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import { FacultyDashboard } from './components/FacultyDashboard';
import { api } from './services/api';

function App() {
  const [route, setRoute] = useState<AppRoute>(AppRoute.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Check Session
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('sits_current_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setUser(parsedUser);
      if (parsedUser.role === 'admin') setRoute(AppRoute.ADMIN_DASHBOARD);
      else if (parsedUser.role === 'faculty') setRoute(AppRoute.FACULTY_DASHBOARD);
      else setRoute(AppRoute.HOME);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile, needsOnboarding: boolean) => {
    setUser(loggedInUser);
    sessionStorage.setItem('sits_current_user', JSON.stringify(loggedInUser));
    
    if (loggedInUser.role === 'admin') {
        setRoute(AppRoute.ADMIN_DASHBOARD);
    } else if (loggedInUser.role === 'faculty') {
        setRoute(AppRoute.FACULTY_DASHBOARD);
    } else if (needsOnboarding) {
      setRoute(AppRoute.ONBOARDING);
    } else {
      setRoute(AppRoute.WELCOME);
    }
  };

  const handleOnboardingComplete = async (updatedUser: UserProfile) => {
    // Persist via API
    await api.updateUser(updatedUser);
    setUser(updatedUser);
    sessionStorage.setItem('sits_current_user', JSON.stringify(updatedUser));
    setRoute(AppRoute.WELCOME);
  };

  const handleWelcomeComplete = () => {
    setRoute(AppRoute.HOME);
  };

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    sessionStorage.setItem('sits_current_user', JSON.stringify(updatedUser));
  };

  const handleLogout = () => {
    if (user) {
        api.logout(user.rollNo);
    }
    sessionStorage.removeItem('sits_current_user');
    setUser(null);
    setRoute(AppRoute.LOGIN);
  };

  return (
    <div className="font-sans text-slate-900 dark:text-slate-100">
      {route === AppRoute.LOGIN && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}

      {route === AppRoute.ONBOARDING && user && (
        <Onboarding 
          initialUser={user} 
          onComplete={handleOnboardingComplete} 
        />
      )}

      {route === AppRoute.WELCOME && user && (
        <Welcome 
          user={user} 
          onComplete={handleWelcomeComplete} 
        />
      )}

      {route === AppRoute.HOME && user && (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          onUserUpdate={handleUserUpdate}
        />
      )}

      {route === AppRoute.ADMIN_DASHBOARD && user && (
        <AdminDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}

      {route === AppRoute.FACULTY_DASHBOARD && user && (
        <FacultyDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;
