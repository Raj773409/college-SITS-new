
import React, { useState, useEffect } from 'react';
import { UserProfile, AppRoute } from './types';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import FacultyDashboard from './components/FacultyDashboard';

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

  // Load user from session if available (simulated persistence for refresh)
  useEffect(() => {
    const sessionUser = sessionStorage.getItem('sits_current_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setUser(parsedUser);
      
      // Determine route based on role
      if (parsedUser.role === 'admin') {
        setRoute(AppRoute.ADMIN_DASHBOARD);
      } else if (parsedUser.role === 'faculty') {
        setRoute(AppRoute.FACULTY_DASHBOARD);
      } else {
        setRoute(AppRoute.HOME);
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile, needsOnboarding: boolean) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === 'admin') {
        sessionStorage.setItem('sits_current_user', JSON.stringify(loggedInUser));
        setRoute(AppRoute.ADMIN_DASHBOARD);
        return;
    }

    if (loggedInUser.role === 'faculty') {
        sessionStorage.setItem('sits_current_user', JSON.stringify(loggedInUser));
        setRoute(AppRoute.FACULTY_DASHBOARD);
        return;
    }

    if (needsOnboarding) {
      setRoute(AppRoute.ONBOARDING);
    } else {
      sessionStorage.setItem('sits_current_user', JSON.stringify(loggedInUser));
      setRoute(AppRoute.WELCOME);
    }
  };

  const handleOnboardingComplete = (updatedUser: UserProfile) => {
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
    
    // Also update persistent storage
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) {
        const users = JSON.parse(storedUsers);
        if (users[updatedUser.rollNo]) {
            users[updatedUser.rollNo] = updatedUser;
            localStorage.setItem('sits_users', JSON.stringify(users));
        }
    }
  };

  const handleLogout = () => {
    if (user && user.role === 'student') {
        // Set user to offline in storage
        const storedUsers = localStorage.getItem('sits_users');
        if (storedUsers) {
            const users = JSON.parse(storedUsers);
            if (users[user.rollNo]) {
                users[user.rollNo].isActive = false;
                localStorage.setItem('sits_users', JSON.stringify(users));
            }
        }
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
