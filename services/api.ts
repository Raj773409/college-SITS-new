
import { UserProfile, CourseResource, AttendanceRecord, Submission } from '../types';

// SIMULATED BACKEND (Node.js/MongoDB replacement)
// In a real app, these functions would be fetch() calls to your Express/Mongo endpoints.

const LATENCY = 1500; // ms to simulate network delay for skeleton loaders

const getStorage = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const setStorage = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // --- User / Auth ---
  login: async (rollNo: string, password: string): Promise<{ user: UserProfile | null, error?: string, needsOnboarding?: boolean }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Admin Logic
        if (rollNo === 'ADMIN' && password === 'ADMIN') { // Simplified for demo
             // In real backend, validate hash
             resolve({ user: { rollNo: 'ADMIN', name: 'Administrator', role: 'admin' } as UserProfile });
             return;
        }

        // Student/Faculty Logic
        const users = getStorage('sits_users') || {};
        const user = users[rollNo];

        if (!user) {
          if (password === 'SITS') {
            const newUser: UserProfile = {
              rollNo, name: '', language: 'English', year: '1', branch: 'CSE-SE',
              isSetupComplete: false, role: 'student', isActive: true
            };
            resolve({ user: newUser, needsOnboarding: true });
          } else {
            resolve({ user: null, error: 'Invalid Credentials' });
          }
        } else {
          if (password === 'SITS' && !user.isSetupComplete) {
             resolve({ user, needsOnboarding: true });
          } else if (user.password === password) {
             user.isActive = true;
             users[rollNo] = user;
             setStorage('sits_users', users);
             resolve({ user });
          } else {
             resolve({ user: null, error: 'Invalid Password' });
          }
        }
      }, LATENCY);
    });
  },

  updateUser: async (user: UserProfile): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const users = getStorage('sits_users') || {};
        users[user.rollNo] = user;
        setStorage('sits_users', users);
        resolve(user);
      }, 1000);
    });
  },

  logout: async (rollNo: string) => {
      const users = getStorage('sits_users') || {};
      if (users[rollNo]) {
          users[rollNo].isActive = false;
          setStorage('sits_users', users);
      }
  },

  // --- Dashboard Data ---
  getDashboardData: async (rollNo: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const resources = getStorage('sits_resources') || [];
        const attendance = getStorage('sits_attendance') || [];
        const submissions = getStorage('sits_submissions') || [];
        
        // Process Attendance
        const myAttendance = attendance.filter((r: AttendanceRecord) => r.rollNo === rollNo);
        const present = myAttendance.filter((r: AttendanceRecord) => r.status === 'present').length;
        const total = myAttendance.length;
        const percentage = total === 0 ? 100 : Math.round((present / total) * 100);

        resolve({
          resources: resources.reverse(), // Newest first
          attendanceStats: { present, absent: total - present, percentage },
          attendanceHistory: myAttendance,
          submissions: submissions.filter((s: Submission) => s.studentRoll === rollNo)
        });
      }, LATENCY);
    });
  },

  // --- Resources (Faculty) ---
  postResource: async (resource: CourseResource) => {
      return new Promise((resolve) => {
          setTimeout(() => {
              const resources = getStorage('sits_resources') || [];
              const newResources = [resource, ...resources];
              setStorage('sits_resources', newResources);
              resolve(newResources);
          }, 800);
      });
  },

  deleteResource: async (resourceId: string) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const resources = getStorage('sits_resources') || [];
            const newResources = resources.filter((r: CourseResource) => r.id !== resourceId);
            setStorage('sits_resources', newResources);
            resolve(newResources);
        }, 500);
    });
  },

  updateResource: async (updatedResource: CourseResource) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const resources = getStorage('sits_resources') || [];
            const index = resources.findIndex((r: CourseResource) => r.id === updatedResource.id);
            if (index !== -1) {
                resources[index] = updatedResource;
                setStorage('sits_resources', resources);
            }
            resolve(resources); // Return updated list or single resource depending on need, simple list for now
        }, 800);
    });
  }
};
