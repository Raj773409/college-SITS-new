import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Submission, SkillRoadmap, ResumeData, ChatMessage, ChatGroup, CourseResource, AttendanceRecord, ResourceType, ActivityFeedItem } from '../types';
import { 
  Bell, Search, Menu, BookOpen, Calendar, Award, Settings, X, Send,
  Sparkles, Sun, Moon, Upload, ClipboardList, Plus, FileText, Trash2,
  CheckCircle, AlertCircle, Bold, Italic, List, Download, Briefcase, Target,
  CheckSquare, RefreshCw, Printer, HelpCircle, ChevronRight, User as UserIcon, Camera,
  GraduationCap, Clock, MessageCircle, Bot, Video, Image as ImageIcon, Users,
  TrendingUp, Activity, Star, Library, FileQuestion, Book, MonitorPlay, FolderOpen,
  CreditCard, UserPlus, Hash, FileDown, Phone, Video as VideoIcon, MoreVertical, Paperclip, MapPin
} from 'lucide-react';
import { generateAIResponse, generateJSON } from '../services/geminiService';
import ProfileSection from './ProfileSection';
import { api } from '../services/api'; // Use centralized API
import { Loader, Skeleton } from './Loader';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUserUpdate: (user: UserProfile) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserUpdate }) => {
  const [view, setView] = useState<'home' | 'profile'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // AI Chat State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: `Hi ${user.name.split(' ')[0]}! I'm your SITS AI Tutor. How can I help you with your CSE studies today?` }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Theme State
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');

  // Modal States
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false); 
  const [showFacultyModal, setShowFacultyModal] = useState(false);

  // States
  const [courseTab, setCourseTab] = useState<'enrolled' | 'catalog' | 'grades' | 'resources'>('enrolled');
  const [resourceFilter, setResourceFilter] = useState<'all' | 'notes' | 'videos' | 'assignments' | 'pdfs' | 'images'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('general');
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [groupInput, setGroupInput] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [chatView, setChatView] = useState<'groups' | 'dms' | 'new_dm'>('groups');
  
  // Fetched Data
  const [gradedSubmissions, setGradedSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{present: number, absent: number, percentage: number}>({present: 0, absent: 0, percentage: 0});
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityFeedItem[]>([]);

  // Feature Forms
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '', file: null as File | null });
  const [resumeForm, setResumeForm] = useState<ResumeData>(user.resume || { summary: '', skills: '', projects: '', experience: '', achievements: '' });
  const [skillInterest, setSkillInterest] = useState("");
  const [roadmap, setRoadmap] = useState<SkillRoadmap | undefined>(user.activeRoadmap);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Static Data (Mock Catalog)
  const courseCatalog = [
    { id: 'CS2101', title: 'Data Structures', code: '23CS2101', instructor: 'Dr. A. Kumar', credits: 4 },
    { id: 'CS2102', title: 'Operating Systems', code: '23CS2102', instructor: 'Prof. S. Reddy', credits: 4 },
    { id: 'CS2103', title: 'Database Management', code: '23CS2103', instructor: 'Dr. M. Rao', credits: 3 },
    { id: 'CS2104', title: 'Software Engineering', code: '23CS2104', instructor: 'Mrs. K. Lakshmi', credits: 3 },
    { id: 'CS2105', title: 'Java Programming', code: '23CS2105', instructor: 'Mr. B. Singh', credits: 3 },
    { id: 'CS2106', title: 'Computer Networks', code: '23CS2106', instructor: 'Dr. P. Wei', credits: 3 },
    { id: 'CS2107', title: 'Artificial Intelligence', code: '23CS2107', instructor: 'Dr. K. Murthy', credits: 3 },
    { id: 'CS2108', title: 'Cloud Computing', code: '23CS2108', instructor: 'Mr. R. Das', credits: 3 },
  ];

  const subjectsList = ['General', 'Data Structures', 'Operating Systems', 'Database Management', 'Software Engineering', 'Java Programming', 'Computer Networks', 'Artificial Intelligence', 'Cloud Computing'];
  const subjectFaculties = [
    { subject: 'Data Structures', faculty: 'Dr. A. Kumar', qualification: 'Ph.D in CS', contact: 'akumar@sits.edu' },
    { subject: 'Operating Systems', faculty: 'Prof. S. Reddy', qualification: 'M.Tech', contact: 'sreddy@sits.edu' },
    { subject: 'Database Management', faculty: 'Dr. M. Rao', qualification: 'Ph.D', contact: 'mrao@sits.edu' },
    { subject: 'Software Engineering', faculty: 'Mrs. K. Lakshmi', qualification: 'M.Tech', contact: 'klakshmi@sits.edu' },
    { subject: 'Java Programming', faculty: 'Mr. B. Singh', qualification: 'M.Tech', contact: 'bsingh@sits.edu' },
    { subject: 'Computer Networks', faculty: 'Dr. P. Wei', qualification: 'Ph.D', contact: 'pwei@sits.edu' },
    { subject: 'Artificial Intelligence', faculty: 'Dr. K. Murthy', qualification: 'Ph.D', contact: 'kmurthy@sits.edu' },
    { subject: 'Cloud Computing', faculty: 'Mr. R. Das', qualification: 'M.Tech', contact: 'rdas@sits.edu' },
  ];
  
  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data: any = await api.getDashboardData(user.rollNo);
        setResources(data.resources);
        setAttendanceStats(data.attendanceStats);
        setAttendanceHistory(data.attendanceHistory);
        setGradedSubmissions(data.submissions);
        setRecentActivities(data.recentActivities);
        
        // Mock Chat Data (Local for now as it's complex to mock nicely in simple API)
        const storedGroups = localStorage.getItem('sits_chat_groups');
        if (storedGroups) {
            setChatGroups(JSON.parse(storedGroups));
        } else {
            const initialGroups: ChatGroup[] = [{ id: 'general', name: 'General Community', type: 'group', description: 'Official SITS Community', createdBy: 'ADMIN', members: [], createdAt: new Date().toISOString() }];
            setChatGroups(initialGroups);
        }
        const storedMessages = localStorage.getItem('sits_chat_messages');
        if (storedMessages) setGroupMessages(JSON.parse(storedMessages));

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user.rollNo]);

  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); } 
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiLoading, groupMessages, activeGroupId]);

  const toggleTheme = () => setIsDark(!isDark);

  // --- Handlers ---
  
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsAiLoading(true);
    const response = await generateAIResponse(userMsg);
    setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    setIsAiLoading(false);
  };

  const handleGroupChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupInput.trim()) return;
    const newMessage: ChatMessage = { id: Date.now().toString(), senderRoll: user.rollNo, senderName: user.name, text: groupInput, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), groupId: activeGroupId, groupName: chatGroups.find(g => g.id === activeGroupId)?.name || 'Unknown' };
    const updatedMessages = [...groupMessages, newMessage];
    setGroupMessages(updatedMessages);
    localStorage.setItem('sits_chat_messages', JSON.stringify(updatedMessages));
    setGroupInput("");
  };

  const createGroup = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGroupName.trim()) return;
      const newGroup: ChatGroup = { id: Date.now().toString(), name: newGroupName, type: 'group', description: 'Student created group', createdBy: user.rollNo, members: [user.rollNo], createdAt: new Date().toISOString() };
      const updatedGroups = [...chatGroups, newGroup];
      setChatGroups(updatedGroups);
      localStorage.setItem('sits_chat_groups', JSON.stringify(updatedGroups));
      setNewGroupName("");
      setShowCreateGroup(false);
      setActiveGroupId(newGroup.id);
  };

  const startDM = (otherName: string, otherId: string) => {
      const existingDM = chatGroups.find(g => g.type === 'dm' && g.participants?.includes(user.rollNo) && g.participants?.includes(otherId));
      if (existingDM) { setActiveGroupId(existingDM.id); setChatView('dms'); return; }
      const newDM: ChatGroup = { id: `dm-${Date.now()}`, name: otherName, type: 'dm', participants: [user.rollNo, otherId], description: 'Direct Message', createdBy: user.rollNo, members: [user.rollNo], createdAt: new Date().toISOString() };
      const updatedGroups = [...chatGroups, newDM];
      setChatGroups(updatedGroups);
      localStorage.setItem('sits_chat_groups', JSON.stringify(updatedGroups));
      setActiveGroupId(newDM.id);
      setChatView('dms');
  };

  const enrollInCourse = (courseId: string) => {
      const currentEnrolled = user.enrolledCourses || [];
      if (currentEnrolled.includes(courseId)) { alert("Already enrolled."); return; }
      const newEnrolled = [...currentEnrolled, courseId];
      const updatedUser = { ...user, enrolledCourses: newEnrolled };
      api.updateUser(updatedUser).then(u => onUserUpdate(u));
  };

  const initiateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.dueDate) { alert("Please fill fields."); return; }
    setShowAssignmentsModal(false);
    setShowConfirmationModal(true);
  };

  const confirmSubmission = () => {
    // Mock submission to API
    alert("Assignment submitted successfully!");
    setAssignmentForm({ title: '', description: '', dueDate: '', file: null });
    setShowConfirmationModal(false);
  };

  const generateRoadmap = async () => {
    if (!skillInterest) return;
    setIsGeneratingRoadmap(true);
    const prompt = `Create a 5-day structured learning roadmap for a Computer Science student interested in "${skillInterest}". Return ONLY a JSON object with this structure: { "days": [{ "day": 1, "topic": "Topic Name", "task": "Specific actionable task" }] }`;
    const data = await generateJSON(prompt);
    if (data && data.days) {
        const newRoadmap: SkillRoadmap = { interest: skillInterest, generatedDate: new Date().toISOString(), days: data.days.map((d: any) => ({...d, isCompleted: false})) };
        setRoadmap(newRoadmap);
        const updatedUser = { ...user, activeRoadmap: newRoadmap };
        api.updateUser(updatedUser).then(u => onUserUpdate(u));
    }
    setIsGeneratingRoadmap(false);
  };
  
  const handleUpdateResume = async (e: React.FormEvent) => {
      e.preventDefault();
      const updatedUser = { ...user, resume: resumeForm };
      await api.updateUser(updatedUser);
      onUserUpdate(updatedUser);
      alert("Resume updated!");
      setShowResumeModal(false);
  };

  const getFilteredResources = () => {
      let filtered = resources;
      if (resourceFilter !== 'all') filtered = filtered.filter(r => r.type.includes(resourceFilter.replace('s', ''))); // Simple matching
      if (subjectFilter !== 'all') filtered = filtered.filter(r => r.subject === subjectFilter);
      if (postSearchQuery.trim()) filtered = filtered.filter(r => r.title.toLowerCase().includes(postSearchQuery.toLowerCase()));
      return filtered;
  };

  const FeatureCard = ({ icon: Icon, title, desc, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] cursor-pointer group card-hover-effect relative overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${color.replace('bg-', 'bg-')}`}></div>
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg ring-4 ring-opacity-20 ring-white`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1 group-hover:text-sits-600 transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{desc}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200 font-sans">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity group" onClick={() => setView('home')}>
                <div className="bg-gradient-to-tr from-sits-600 to-sits-800 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg group-hover:scale-105 transition-transform">SITS</div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 hidden sm:block">CSE-SE Portal</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700" onClick={() => setView('profile')}>
              <img src={user.profilePic || "https://picsum.photos/200"} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {view === 'home' && (
      <main className="flex-1 w-full animate-fade-in pb-10">
        {/* Improved Hero Section */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-sits-800 to-slate-900 text-white overflow-hidden mb-8 shadow-2xl">
            {/* Mesh Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full -translate-y-20 translate-x-20 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full translate-y-10 -translate-x-10 blur-3xl"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 text-center md:text-left animate-slide-up">
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wider uppercase mb-4 text-blue-200">Student Dashboard</span>
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-sm leading-tight">
                        Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-200">{user.name.split(' ')[0]}</span>
                    </h1>
                    <p className="text-sits-100 text-lg md:text-xl max-w-xl leading-relaxed font-light mb-6">
                        Track your academic progress, access study materials, and build your skills with our AI-powered learning environment.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button onClick={() => setShowCoursesModal(true)} className="px-6 py-3 bg-white text-sits-900 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg">My Courses</button>
                        <button onClick={() => setShowCommunityModal(true)} className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold hover:bg-white/20 transition-colors backdrop-blur-sm">Join Community</button>
                    </div>
                </div>
                <div className="hidden md:block relative animate-scale-up">
                    <div className="relative z-10 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Sparkles className="w-6 h-6 text-white"/></div>
                            <div>
                                <p className="font-bold text-lg">Daily Streak</p>
                                <p className="text-blue-200 text-sm">Keep it up!</p>
                            </div>
                        </div>
                        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-gradient-to-r from-blue-400 to-cyan-300"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 -mt-12 relative z-20">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 -mt-12 relative z-20">
                    <FeatureCard icon={BookOpen} title="My Courses" desc={`${user.enrolledCourses?.length || 0} Active Subjects`} color="bg-blue-500" onClick={() => setShowCoursesModal(true)} />
                    <FeatureCard icon={ClipboardList} title="Assignments" desc="Submit Work" color="bg-orange-500" onClick={() => setShowAssignmentsModal(true)} />
                    <FeatureCard icon={Calendar} title="Attendance" desc={`${attendanceStats.percentage}% Present`} color="bg-emerald-500" onClick={() => setShowAttendanceModal(true)} />
                    <FeatureCard icon={Award} title="Results" desc="CGPA: 8.5" color="bg-amber-500" onClick={() => setShowResultsModal(true)} />
                </div>
            )}
            
            {/* Student Activity Feed */}
            {!isLoading && recentActivities.length > 0 && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center"><Activity className="w-6 h-6 mr-2 text-indigo-500" /> Recent Activity</h2>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                        <div className="space-y-6">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start space-x-4 border-b border-slate-50 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
                                    <div className={`p-3 rounded-full flex-shrink-0 ${
                                        activity.type === 'submission' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                                        activity.type === 'enrollment' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                        activity.type === 'attendance' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                    }`}>
                                        {activity.type === 'submission' && <ClipboardList className="w-5 h-5" />}
                                        {activity.type === 'enrollment' && <BookOpen className="w-5 h-5" />}
                                        {activity.type === 'attendance' && <CheckCircle className="w-5 h-5" />}
                                        {activity.type === 'resource' && <Download className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-bold text-slate-800 dark:text-white">{activity.title}</h4>
                                            <span className="text-xs text-slate-400">{activity.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{activity.description}</p>
                                        {activity.meta && (
                                            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500">
                                                {activity.meta}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center"><Sparkles className="w-6 h-6 mr-2 text-purple-500" /> Discover More</h2>
            
            {isLoading ? (
               <div className="flex justify-center py-10"><Loader /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                    <FeatureCard icon={Bell} title="Faculty Posts" desc="Classroom Feed" color="bg-rose-500" onClick={() => setShowPostsModal(true)} />
                    <FeatureCard icon={Users} title="Subject Faculties" desc="List of Teachers" color="bg-teal-500" onClick={() => setShowFacultyModal(true)} />
                    <FeatureCard icon={Library} title="Library" desc="Digital Books" color="bg-pink-500" onClick={() => setShowLibraryModal(true)} />
                    <FeatureCard icon={FileQuestion} title="Exam Cell" desc="Schedules & Fees" color="bg-cyan-500" onClick={() => setShowExamModal(true)} />
                    <FeatureCard icon={Target} title="Skill Boost" desc="AI Learning Path" color="bg-purple-600" onClick={() => setShowSkillModal(true)} />
                    <FeatureCard icon={MessageCircle} title="Community" desc="Chat & Groups" color="bg-indigo-600" onClick={() => setShowCommunityModal(true)} />
                    <FeatureCard icon={Briefcase} title="Resume" desc="Auto-generate CV" color="bg-slate-600" onClick={() => setShowResumeModal(true)} />
                </div>
            )}
        </div>
      </main>
      )}

      {view === 'profile' && <ProfileSection user={user} onLogout={onLogout} onUpdate={onUserUpdate} />}

      {/* --- ALL MODALS (Standardized) --- */}
      
      {/* Faculty Posts Modal */}
      {showPostsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-2xl font-bold dark:text-white flex items-center"><Bell className="mr-3 text-rose-500" /> Faculty Posts & Updates</h2>
                    <button onClick={() => setShowPostsModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-6 h-6 dark:text-slate-400" /></button>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col">
                     <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-col space-y-3">
                         <div className="flex items-center space-x-2 w-full">
                             <div className="relative w-full">
                                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                 <input type="text" placeholder="Search by title, teacher..." value={postSearchQuery} onChange={(e) => setPostSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-rose-500" />
                             </div>
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
                        <div className="space-y-6">
                            {getFilteredResources().length > 0 ? getFilteredResources().map(res => (
                                <div key={res.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                                    <div className={`p-5 rounded-2xl flex items-center justify-center shrink-0 h-fit w-fit bg-slate-100 dark:bg-slate-700`}>
                                        <FileText className="w-8 h-8 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                 <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{res.subject || 'General'}</span>
                                                 {res.targetYear && <span className="ml-2 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded">Year {res.targetYear}</span>}
                                                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{res.title}</h3>
                                            </div>
                                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <Calendar className="w-3 h-3 mr-2" /> {res.datePosted}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">{res.description}</p>
                                        
                                        {res.fileName && (
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center w-fit mt-2 mb-2">
                                                <Paperclip className="w-4 h-4 text-slate-400 mr-2" />
                                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{res.fileName}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs mr-2">{res.postedBy.charAt(0)}</div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{res.postedBy}</span>
                                            </div>
                                            {res.url && <a href={res.url} target="_blank" rel="noreferrer" className="flex items-center px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shadow-lg">View Resource <ChevronRight className="w-4 h-4 ml-1" /></a>}
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="flex flex-col items-center justify-center py-20 text-slate-400"><FolderOpen className="w-10 h-10 mb-2"/><p>No posts found.</p></div>}
                        </div>
                     </div>
                </div>
            </div>
        </div>
      )}

      {/* Community Modal */}
      {showCommunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex h-[85vh] animate-scale-up border border-slate-200 dark:border-slate-700">
                {/* Sidebar */}
                <div className="w-1/3 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                        <h2 className="text-xl font-bold dark:text-white flex items-center"><Users className="mr-2 text-indigo-500" /> Community</h2>
                        <div className="flex space-x-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg mt-4">
                            <button onClick={() => setChatView('groups')} className={`flex-1 p-1.5 rounded-md text-xs font-bold ${chatView === 'groups' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-400'}`}>Groups</button>
                            <button onClick={() => setChatView('dms')} className={`flex-1 p-1.5 rounded-md text-xs font-bold ${chatView === 'dms' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-400'}`}>DMs</button>
                        </div>
                        <button onClick={() => { if(chatView === 'groups') setShowCreateGroup(true); else setChatView('new_dm'); }} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-bold flex items-center justify-center transition-colors shadow-lg"><Plus className="w-4 h-4 mr-2" /> New</button>
                    </div>
                    {showCreateGroup && (
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 animate-fade-in">
                            <input type="text" placeholder="Group Name" className="w-full p-2 mb-2 rounded border border-indigo-200 dark:border-indigo-800 dark:bg-slate-800 dark:text-white text-sm" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                            <div className="flex space-x-2"><button onClick={createGroup} className="flex-1 bg-indigo-600 text-white py-1 rounded text-xs font-bold">Create</button><button onClick={() => setShowCreateGroup(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-1 rounded text-xs font-bold">Cancel</button></div>
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto">
                        {chatView === 'new_dm' && (
                            <div className="p-4 animate-fade-in">
                                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3">Teachers</h3>
                                {subjectFaculties.map((fac, idx) => (
                                    <div key={idx} onClick={() => startDM(fac.faculty, `fac-${idx}`)} className="flex items-center p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer mb-1">
                                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xs font-bold mr-3">{fac.faculty.charAt(0)}</div>
                                        <p className="text-sm font-bold dark:text-white">{fac.faculty}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {chatView !== 'new_dm' && chatGroups.filter(g => (chatView === 'groups' ? g.type !== 'dm' : g.type === 'dm')).map(group => (
                            <div key={group.id} onClick={() => setActiveGroupId(group.id)} className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${activeGroupId === group.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600' : ''}`}>
                                <h3 className="font-bold text-slate-800 dark:text-white">{group.name}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{group.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-slate-100 dark:bg-slate-950/50 relative">
                    <button onClick={() => setShowCommunityModal(false)} className="absolute top-4 right-4 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md z-10 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                    {activeGroupId ? (
                        <>
                            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mr-3"><Hash className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div><div><h3 className="font-bold text-lg dark:text-white">{chatGroups.find(g => g.id === activeGroupId)?.name}</h3></div></div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {groupMessages.filter(m => m.groupId === activeGroupId).map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.senderRoll === user.rollNo ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] ${msg.senderRoll === user.rollNo ? 'bg-indigo-600 text-white rounded-l-2xl rounded-tr-2xl shadow-md' : 'bg-white dark:bg-slate-800 dark:text-white rounded-r-2xl rounded-tl-2xl shadow-sm'} p-3`}>
                                            <p className={`text-xs font-bold mb-1 ${msg.senderRoll === user.rollNo ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'}`}>{msg.senderName}</p><p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatContainerRef}></div>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                <form onSubmit={handleGroupChatSubmit} className="flex space-x-2"><input type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-inner" placeholder="Type a message..." /><button type="submit" className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transform active:scale-95 transition-transform"><Send className="w-5 h-5" /></button></form>
                            </div>
                        </>
                    ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><MessageCircle className="w-16 h-16 mb-4 opacity-20"/><p>Select a group or start a new chat</p></div>}
                </div>
             </div>
        </div>
      )}

      {/* Courses Modal */}
      {showCoursesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"><div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900"><h2 className="text-2xl font-bold dark:text-white flex items-center"><BookOpen className="mr-3 text-blue-500" /> Academic Courses</h2><button onClick={() => setShowCoursesModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button></div><div className="p-6 flex-1 overflow-y-auto"><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{courseCatalog.map(c => (<div key={c.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600"><h3 className="font-bold dark:text-white">{c.title}</h3><p className="text-sm text-slate-500 dark:text-slate-300">{c.instructor}</p><button onClick={() => enrollInCourse(c.id)} className="mt-2 text-sm text-blue-600 font-bold hover:underline">Enroll</button></div>))}</div></div></div></div>
      )}

      {/* Assignments Modal */}
      {showAssignmentsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                      <h2 className="text-2xl font-bold dark:text-white flex items-center"><ClipboardList className="mr-3 text-orange-500" /> Assignments</h2>
                      <button onClick={() => setShowAssignmentsModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="space-y-4">
                        {/* Mock Pending Assignment */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-700/50">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h3 className="font-bold dark:text-white">Data Structures Lab 4</h3>
                                    <p className="text-sm text-slate-500">Implement Linked List</p>
                                 </div>
                                 <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">Pending</span>
                             </div>
                             <button onClick={() => {setShowAssignmentsModal(false); setShowConfirmationModal(true);}} className="mt-2 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 text-sm">Submit Work</button>
                        </div>
                         {gradedSubmissions.map(sub => (
                             <div key={sub.id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-700/50 opacity-80">
                                 <div className="flex justify-between items-start">
                                     <div>
                                        <h3 className="font-bold dark:text-white">{sub.assignmentTitle}</h3>
                                        <p className="text-sm text-slate-500">Submitted on {sub.submittedDate}</p>
                                     </div>
                                     <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{sub.status}</span>
                                 </div>
                             </div>
                         ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                      <h2 className="text-2xl font-bold dark:text-white flex items-center"><Calendar className="mr-3 text-emerald-500" /> Attendance History</h2>
                      <button onClick={() => setShowAttendanceModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                      <div className="mb-4 text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900">
                          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{attendanceStats.percentage}%</p>
                          <p className="text-xs font-bold uppercase text-emerald-600/70">Overall Attendance</p>
                      </div>
                      <div className="space-y-2">
                          {attendanceHistory.map((rec, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700">
                                  <span className="font-mono text-sm dark:text-slate-300">{rec.date}</span>
                                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                      rec.status === 'present' ? 'bg-emerald-100 text-emerald-700' : 
                                      rec.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                  }`}>{rec.status}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center"><Award className="mr-3 text-amber-500" /> Results</h2>
                        <button onClick={() => setShowResultsModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                    </div>
                    <div className="p-6">
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center mb-6 border border-amber-100 dark:border-amber-900">
                            <h3 className="text-4xl font-bold text-amber-600 dark:text-amber-400">8.5</h3>
                            <p className="text-xs uppercase font-bold text-amber-600/70">Current CGPA</p>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-bold text-slate-400 uppercase border-b dark:border-slate-700"><th className="pb-2">Subject</th><th className="pb-2">Grade</th><th className="pb-2">Credits</th></tr>
                            </thead>
                            <tbody className="text-sm dark:text-slate-300">
                                <tr className="border-b dark:border-slate-800"><td className="py-2">Data Structures</td><td className="py-2 font-bold text-emerald-500">A+</td><td className="py-2">4</td></tr>
                                <tr className="border-b dark:border-slate-800"><td className="py-2">Java Programming</td><td className="py-2 font-bold text-emerald-500">A</td><td className="py-2">3</td></tr>
                                <tr className="border-b dark:border-slate-800"><td className="py-2">Digital Logic</td><td className="py-2 font-bold text-blue-500">B+</td><td className="py-2">3</td></tr>
                            </tbody>
                        </table>
                    </div>
               </div>
          </div>
      )}

      {/* Library Modal */}
      {showLibraryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                      <h2 className="text-2xl font-bold dark:text-white flex items-center"><Library className="mr-3 text-pink-500" /> Digital Library</h2>
                      <button onClick={() => setShowLibraryModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                  </div>
                  <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col items-center text-center">
                              <div className={`w-20 h-28 rounded-md mb-3 shadow-md ${i % 2 === 0 ? 'bg-blue-200' : 'bg-rose-200'}`}></div>
                              <h3 className="font-bold text-sm dark:text-white line-clamp-2">Computer Science Vol {i}</h3>
                              <button className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded-full font-bold hover:bg-indigo-700">Borrow</button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Exam Modal */}
      {showExamModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                   <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center"><FileQuestion className="mr-3 text-cyan-500" /> Exam Cell</h2>
                        <button onClick={() => setShowExamModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                   </div>
                   <div className="p-6">
                       <h3 className="font-bold mb-4 dark:text-white">Upcoming Exams</h3>
                       <div className="space-y-3">
                           <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                               <div><p className="font-bold text-sm dark:text-white">Data Structures Mid-1</p><p className="text-xs text-slate-500">Room 304</p></div>
                               <div className="text-right"><p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Oct 24</p><p className="text-xs text-slate-500">10:00 AM</p></div>
                           </div>
                           <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600">
                               <div><p className="font-bold text-sm dark:text-white">OS Mid-1</p><p className="text-xs text-slate-500">Room 201</p></div>
                               <div className="text-right"><p className="font-bold text-sm text-indigo-600 dark:text-indigo-400">Oct 25</p><p className="text-xs text-slate-500">02:00 PM</p></div>
                           </div>
                       </div>
                   </div>
               </div>
           </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center"><Briefcase className="mr-3 text-slate-600 dark:text-slate-300" /> Resume Builder</h2>
                        <button onClick={() => setShowResumeModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                   </div>
                   <div className="p-6 overflow-y-auto flex-1">
                       <form onSubmit={handleUpdateResume} className="space-y-4">
                           <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Professional Summary</label><textarea className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} value={resumeForm.summary} onChange={e => setResumeForm({...resumeForm, summary: e.target.value})}></textarea></div>
                           <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Technical Skills</label><input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={resumeForm.skills} onChange={e => setResumeForm({...resumeForm, skills: e.target.value})} /></div>
                           <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Projects</label><textarea className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} value={resumeForm.projects} onChange={e => setResumeForm({...resumeForm, projects: e.target.value})}></textarea></div>
                           <button type="submit" className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-lg font-bold">Save Resume</button>
                       </form>
                   </div>
              </div>
          </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center"><Target className="mr-3 text-purple-600" /> AI Skill Roadmap</h2>
                        <button onClick={() => setShowSkillModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                  </div>
                  <div className="p-6 flex-1 overflow-y-auto">
                      {!roadmap ? (
                          <div className="text-center py-10">
                              <Target className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                              <h3 className="text-lg font-bold dark:text-white mb-4">Generate a Learning Path</h3>
                              <input type="text" placeholder="Enter skill (e.g. React, Python)" className="w-full max-w-md p-3 border rounded-lg mb-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={skillInterest} onChange={e => setSkillInterest(e.target.value)} />
                              <button onClick={generateRoadmap} disabled={isGeneratingRoadmap} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50">{isGeneratingRoadmap ? 'Generating...' : 'Create Roadmap'}</button>
                          </div>
                      ) : (
                          <div>
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-bold dark:text-white capitalize">{roadmap.interest} Roadmap</h3>
                                  <button onClick={() => setRoadmap(undefined)} className="text-sm text-red-500 font-bold hover:underline">Reset</button>
                              </div>
                              <div className="space-y-4">
                                  {roadmap.days.map(day => (
                                      <div key={day.day} className="flex p-4 border rounded-xl dark:border-slate-700">
                                          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center font-bold mr-4 shrink-0">{day.day}</div>
                                          <div>
                                              <h4 className="font-bold dark:text-white">{day.topic}</h4>
                                              <p className="text-sm text-slate-500 dark:text-slate-400">{day.task}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Subject Faculty Modal */}
      {showFacultyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center"><Users className="mr-3 text-teal-500" /> Subject Faculties</h2>
                        <button onClick={() => setShowFacultyModal(false)}><X className="w-6 h-6 dark:text-slate-400" /></button>
                  </div>
                  <div className="p-6 grid grid-cols-1 gap-4 overflow-y-auto">
                      {subjectFaculties.map((fac, idx) => (
                          <div key={idx} className="flex items-center p-4 border rounded-xl dark:border-slate-700 bg-white dark:bg-slate-700/50">
                              <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-600 flex items-center justify-center font-bold mr-4">{fac.faculty.charAt(0)}</div>
                              <div className="flex-1">
                                  <h4 className="font-bold dark:text-white">{fac.faculty}</h4>
                                  <p className="text-xs font-bold uppercase text-teal-500">{fac.subject}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{fac.qualification}</p>
                              </div>
                              <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Contact</button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold dark:text-white mb-2">Confirm Submission?</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">Are you sure you want to submit this assignment?</p>
                  <div className="flex space-x-3">
                      <button onClick={confirmSubmission} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-bold transition-colors">Yes, Submit</button>
                      <button onClick={() => setShowConfirmationModal(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white py-2 rounded-lg font-bold transition-colors">Cancel</button>
                  </div>
              </div>
          </div>
      )}
      
    </div>
  );
};