
import { UserProfile, CourseResource, AttendanceRecord, Submission, ActivityFeedItem } from '../types';

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
        // 1. Admin Logic
        if (rollNo === 'ADMIN' && password === 'ADMIN') { 
             resolve({ user: { rollNo: 'ADMIN', name: 'Administrator', role: 'admin', language: 'en', year: 'N/A', branch: 'ADMIN', isSetupComplete: true } as UserProfile });
             return;
        }

        // 2. Fetch all user databases
        const students = getStorage('sits_users') || {};
        const faculty = getStorage('sits_faculty') || {};
        
        // 3. Check Student Database
        let user = students[rollNo];

        // 4. If not found in students, check Faculty Database
        if (!user) {
            user = faculty[rollNo];
        }

        if (!user) {
          // If totally new student trying to register with default pass
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
          // User exists (Student or Faculty)
          if (password === 'SITS' && !user.isSetupComplete) {
             resolve({ user, needsOnboarding: true });
          } else if (user.password === password) {
             user.isActive = true;
             
             // Update the specific storage bucket
             if (user.role === 'faculty') {
                 faculty[rollNo] = user;
                 setStorage('sits_faculty', faculty);
             } else {
                 students[rollNo] = user;
                 setStorage('sits_users', students);
             }
             
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
        const storageKey = user.role === 'faculty' ? 'sits_faculty' : 'sits_users';
        const users = getStorage(storageKey) || {};
        users[user.rollNo] = user;
        setStorage(storageKey, users);
        resolve(user);
      }, 1000);
    });
  },

  logout: async (rollNo: string) => {
      // We don't know role here easily without passing it, but strictly checking both isn't harmful for logout status
      const students = getStorage('sits_users') || {};
      const faculty = getStorage('sits_faculty') || {};
      
      if (students[rollNo]) {
          students[rollNo].isActive = false;
          setStorage('sits_users', students);
      } else if (faculty[rollNo]) {
          faculty[rollNo].isActive = false;
          setStorage('sits_faculty', faculty);
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
        
        const mySubmissions = submissions.filter((s: Submission) => s.studentRoll === rollNo);

        // Generate Simulated Activity Feed
        const activities: ActivityFeedItem[] = [];
        
        // 1. Recent Submissions
        mySubmissions.slice(0, 3).forEach((s: Submission) => {
            activities.push({
                id: `sub-${s.id}`,
                type: 'submission',
                title: 'Assignment Submitted',
                description: `You submitted "${s.assignmentTitle}"`,
                timestamp: s.submittedDate, // In real app, calculate relative time
                meta: s.status
            });
        });

        // 2. Attendance alerts (mocked based on stats)
        if (myAttendance.length > 0) {
            const lastRecord = myAttendance[myAttendance.length - 1];
            activities.push({
                id: `att-${lastRecord.date}`,
                type: 'attendance',
                title: 'Attendance Marked',
                description: `You were marked ${lastRecord.status.toUpperCase()}`,
                timestamp: lastRecord.date
            });
        }

        // 3. Mock Enrollments / Roadmap
        activities.push({
            id: 'act-1',
            type: 'enrollment',
            title: 'Course Enrolled',
            description: 'You joined "Data Structures & Algorithms"',
            timestamp: '2 days ago'
        });

        // Sort roughly by "recent" (mock sort for mixed types)
        const sortedActivities = activities.reverse();

        resolve({
          resources: resources.reverse(), // Newest first
          attendanceStats: { present, absent: total - present, percentage },
          attendanceHistory: myAttendance,
          submissions: mySubmissions,
          recentActivities: sortedActivities
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
            resolve(resources);
        }, 800);
    });
  }
};
