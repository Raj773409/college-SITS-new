
export type UserRole = 'student' | 'admin' | 'faculty';

export interface ResumeData {
  summary: string;
  skills: string;
  projects: string;
  experience: string;
  achievements: string;
}

export interface RoadmapDay {
  day: number;
  topic: string;
  task: string;
  isCompleted: boolean;
  submission?: string;
}

export interface SkillRoadmap {
  interest: string;
  generatedDate: string;
  days: RoadmapDay[];
}

export interface UserProfile {
  rollNo: string;
  name: string;
  password?: string; // Stored securely in real app, simulated here
  profilePic?: string; // Base64 data URL
  language: string;
  year: string;
  branch: string;
  isSetupComplete: boolean;
  role: UserRole;
  isActive?: boolean;
  resume?: ResumeData;
  activeRoadmap?: SkillRoadmap;
  enrolledCourses?: string[]; // IDs of enrolled courses
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target?: string;
  details: string;
}

export interface Submission {
  id: string;
  studentRoll: string;
  studentName: string;
  assignmentTitle: string;
  description: string;
  submittedDate: string;
  fileName?: string;
  grade?: string;
  feedback?: string;
  status: 'pending' | 'graded' | 'late';
}

// New Types for Faculty Resources
export type ResourceType = 'note' | 'video' | 'assignment' | 'event' | 'project' | 'image';

export interface CourseResource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url?: string; // Or base64 content
  datePosted: string;
  postedBy: string;
}

// New Types for Attendance
export interface AttendanceRecord {
  date: string;
  rollNo: string;
  status: 'present' | 'absent' | 'late';
}

// New Types for Chat
export interface ChatMessage {
  id: string;
  senderRoll: string;
  senderName: string;
  text: string;
  timestamp: string;
  groupName: string; // 'General', 'CSE-A', etc.
}

export enum AppRoute {
  LOGIN = 'login',
  ONBOARDING = 'onboarding',
  WELCOME = 'welcome',
  HOME = 'home',
  ADMIN_DASHBOARD = 'admin_dashboard',
  FACULTY_DASHBOARD = 'faculty_dashboard',
}
