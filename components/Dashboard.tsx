
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Submission, SkillRoadmap, ResumeData, ChatMessage, CourseResource, AttendanceRecord } from '../types';
import { 
  Bell, Search, Menu, BookOpen, Calendar, Award, LogOut, Settings, X, Send,
  Sparkles, Sun, Moon, Upload, ClipboardList, Plus, FileText, Trash2,
  CheckCircle, AlertCircle, Bold, Italic, List, Download, Briefcase, Target,
  CheckSquare, RefreshCw, Printer, HelpCircle, ChevronRight, User as UserIcon, Camera,
  GraduationCap, Clock, MessageCircle, Bot, Video, Image as ImageIcon, Users
} from 'lucide-react';
import { generateAIResponse, generateJSON } from '../services/geminiService';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
  onUserUpdate: (user: UserProfile) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, onUserUpdate }) => {
  const [view, setView] = useState<'home' | 'profile'>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // AI Chat State
  const [showAiChat, setShowAiChat] = useState(false);
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
  const [courseTab, setCourseTab] = useState<'enrolled' | 'catalog' | 'grades' | 'resources'>('enrolled');
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  
  // Community Chat State
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [groupInput, setGroupInput] = useState("");

  // Data States
  const [gradedSubmissions, setGradedSubmissions] = useState<Submission[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<{present: number, absent: number, percentage: number}>({present: 0, absent: 0, percentage: 100});

  // Profile Edit State
  const [profileForm, setProfileForm] = useState(user);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  // Feature States
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    file: null as File | null
  });
  
  const [resumeForm, setResumeForm] = useState<ResumeData>(user.resume || {
      summary: '', skills: '', projects: '', experience: '', achievements: ''
  });

  const [skillInterest, setSkillInterest] = useState("");
  const [roadmap, setRoadmap] = useState<SkillRoadmap | undefined>(user.activeRoadmap);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock Data
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

  const faqs = [
    { q: "How do I submit an assignment?", a: "Go to the Assignments section, click 'Submit Assignment', fill in the details, attach your file, and click Submit." },
    { q: "How do I check my grades?", a: "Open 'My Courses' and navigate to the 'Grades' tab to see feedback on your submissions." },
    { q: "Can I change my profile picture?", a: "Yes, go to your Profile page by clicking your avatar and select the camera icon to upload a new photo." },
    { q: "What is Skill Boost?", a: "Skill Boost uses AI to generate a 5-day learning roadmap for any topic you are interested in." }
  ];

  // Theme Toggle Effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    // Load Graded Submissions
    const storedSubmissions = localStorage.getItem('sits_submissions');
    if (storedSubmissions) {
        const all: Submission[] = JSON.parse(storedSubmissions);
        setGradedSubmissions(all.filter(s => s.studentRoll === user.rollNo && (s.status === 'graded' || s.status === 'late')));
    }

    // Load Resources
    const storedResources = localStorage.getItem('sits_resources');
    if (storedResources) {
      setResources(JSON.parse(storedResources));
    }

    // Load Attendance
    const storedAttendance = localStorage.getItem('sits_attendance');
    if (storedAttendance) {
      const records: AttendanceRecord[] = JSON.parse(storedAttendance);
      const myRecords = records.filter(r => r.rollNo === user.rollNo);
      const present = myRecords.filter(r => r.status === 'present').length;
      const absent = myRecords.filter(r => r.status === 'absent').length;
      const total = present + absent;
      const percentage = total === 0 ? 100 : Math.round((present / total) * 100);
      setAttendanceStats({ present, absent, percentage });
    }

    // Load Chat Messages
    const storedChat = localStorage.getItem('sits_group_chat');
    if (storedChat) {
      setGroupMessages(JSON.parse(storedChat));
    }
  }, [showCoursesModal, user.rollNo, showCommunityModal]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const toggleTheme = () => setIsDark(!isDark);

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

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderRoll: user.rollNo,
      senderName: user.name,
      text: groupInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groupName: 'SITS Community'
    };

    const updatedMessages = [...groupMessages, newMessage];
    setGroupMessages(updatedMessages);
    localStorage.setItem('sits_group_chat', JSON.stringify(updatedMessages));
    setGroupInput("");
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    onUserUpdate(profileForm);
    alert("Profile updated successfully!");
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

  const enrollInCourse = (courseId: string) => {
      const currentEnrolled = user.enrolledCourses || [];
      if (currentEnrolled.includes(courseId)) {
        alert("You are already enrolled in this course.");
        return;
      }
      
      const newEnrolled = [...currentEnrolled, courseId];
      const updatedUser = { ...user, enrolledCourses: newEnrolled };
      onUserUpdate(updatedUser);
      setProfileForm(updatedUser); // sync local state
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB Limit
        alert("File size exceeds 10MB limit.");
        return;
      }
      setAssignmentForm({ ...assignmentForm, file });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }
      setAssignmentForm({ ...assignmentForm, file });
    }
  };

  const removeFile = () => {
    setAssignmentForm({ ...assignmentForm, file: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('assignment-desc') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = assignmentForm.description;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const selection = text.substring(start, end);

    let newText = text;
    if (syntax === 'bold') newText = `${before}**${selection || 'bold text'}**${after}`;
    if (syntax === 'italic') newText = `${before}_${selection || 'italic text'}_${after}`;
    if (syntax === 'list') newText = `${before}\n- ${selection || 'list item'}${after}`;

    setAssignmentForm({ ...assignmentForm, description: newText });
  };

  const initiateSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.title || !assignmentForm.dueDate) {
      alert("Please fill in all required fields.");
      return;
    }
    setShowAssignmentsModal(false);
    setShowConfirmationModal(true);
  };

  const confirmSubmission = () => {
    const storedSubmissions = localStorage.getItem('sits_submissions');
    const submissions: Submission[] = storedSubmissions ? JSON.parse(storedSubmissions) : [];

    const newSubmission: Submission = {
        id: Date.now().toString(),
        studentRoll: user.rollNo,
        studentName: user.name,
        assignmentTitle: assignmentForm.title,
        description: assignmentForm.description,
        submittedDate: new Date().toLocaleDateString(),
        fileName: assignmentForm.file?.name,
        status: 'pending'
    };

    submissions.push(newSubmission);
    localStorage.setItem('sits_submissions', JSON.stringify(submissions));

    alert("Assignment submitted successfully!");
    setAssignmentForm({ title: '', description: '', dueDate: '', file: null });
    setShowConfirmationModal(false);
  };

  const handleDownloadResult = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
        const html = `
            <html>
            <head>
                <title>Result Card - ${user.rollNo}</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="p-10 bg-white">
                <div class="max-w-3xl mx-auto border-4 border-double border-slate-800 p-8">
                    <div class="text-center border-b-2 border-slate-800 pb-6 mb-6">
                        <h1 class="text-3xl font-bold uppercase tracking-wider">Siddhartha Institute of Science and Technology</h1>
                        <p class="text-slate-600 font-semibold mt-2">Department of Computer Science & Engineering (SE)</p>
                        <h2 class="text-xl font-bold mt-4 underline">PROVISIONAL RESULT MEMORANDUM</h2>
                    </div>
                    <div class="flex justify-between mb-8">
                        <div>
                            <p><strong>Name:</strong> ${user.name}</p>
                            <p><strong>Roll No:</strong> ${user.rollNo}</p>
                        </div>
                        <div class="text-right">
                            <p><strong>Branch:</strong> ${user.branch}</p>
                            <p><strong>Year:</strong> ${user.year}</p>
                        </div>
                    </div>
                    <table class="w-full border-collapse border border-slate-800 mb-8">
                        <thead>
                            <tr class="bg-slate-100">
                                <th class="border border-slate-800 p-2 text-left">Subject Code</th>
                                <th class="border border-slate-800 p-2 text-left">Subject Name</th>
                                <th class="border border-slate-800 p-2 text-center">Grade</th>
                                <th class="border border-slate-800 p-2 text-center">Credits</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td class="border border-slate-800 p-2">23CS2101</td><td class="border border-slate-800 p-2">Data Structures</td><td class="border border-slate-800 p-2 text-center">A</td><td class="border border-slate-800 p-2 text-center">4</td></tr>
                            <tr><td class="border border-slate-800 p-2">23CS2102</td><td class="border border-slate-800 p-2">Operating Systems</td><td class="border border-slate-800 p-2 text-center">A+</td><td class="border border-slate-800 p-2 text-center">4</td></tr>
                            <tr><td class="border border-slate-800 p-2">23CS2103</td><td class="border border-slate-800 p-2">Database Management</td><td class="border border-slate-800 p-2 text-center">O</td><td class="border border-slate-800 p-2 text-center">3</td></tr>
                            <tr><td class="border border-slate-800 p-2">23CS2104</td><td class="border border-slate-800 p-2">Software Engineering</td><td class="border border-slate-800 p-2 text-center">A</td><td class="border border-slate-800 p-2 text-center">3</td></tr>
                        </tbody>
                        <tfoot>
                             <tr class="font-bold"><td colspan="3" class="border border-slate-800 p-2 text-right">SGPA</td><td class="border border-slate-800 p-2 text-center">8.75</td></tr>
                        </tfoot>
                    </table>
                    <div class="flex justify-between mt-16">
                        <div class="text-center">
                            <p>Date: ${new Date().toLocaleDateString()}</p>
                        </div>
                         <div class="text-center">
                            <p>Controller of Examinations</p>
                        </div>
                    </div>
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;
        newWindow.document.write(html);
        newWindow.document.close();
    }
  };

  const handleResumeSave = () => {
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) {
        const users = JSON.parse(storedUsers);
        if (users[user.rollNo]) {
            users[user.rollNo].resume = resumeForm;
            localStorage.setItem('sits_users', JSON.stringify(users));
            alert("Resume details saved!");
            
            // Generate Mock PDF Download
            const element = document.createElement("a");
            const file = new Blob([JSON.stringify(resumeForm, null, 2)], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `${user.rollNo}_Resume_Data.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
    }
    setShowResumeModal(false);
  };

  const generateRoadmap = async () => {
    if (!skillInterest) return;
    setIsGeneratingRoadmap(true);
    const prompt = `Create a 5-day structured learning roadmap for a Computer Science student interested in "${skillInterest}". 
    Return ONLY a JSON object with this structure: 
    { "days": [{ "day": 1, "topic": "Topic Name", "task": "Specific actionable task" }] }`;
    
    const data = await generateJSON(prompt);
    
    if (data && data.days) {
        const newRoadmap: SkillRoadmap = {
            interest: skillInterest,
            generatedDate: new Date().toISOString(),
            days: data.days.map((d: any) => ({...d, isCompleted: false}))
        };
        setRoadmap(newRoadmap);
        
        // Save to User Profile
        const updatedUser = { ...user, activeRoadmap: newRoadmap };
        onUserUpdate(updatedUser);
    } else {
        alert("Failed to generate roadmap. Please try again.");
    }
    setIsGeneratingRoadmap(false);
  };

  const toggleTaskCompletion = (dayIndex: number) => {
    if (!roadmap) return;
    const updatedRoadmap = { ...roadmap };
    updatedRoadmap.days[dayIndex].isCompleted = !updatedRoadmap.days[dayIndex].isCompleted;
    setRoadmap(updatedRoadmap);

    const updatedUser = { ...user, activeRoadmap: updatedRoadmap };
    onUserUpdate(updatedUser);
  };

  const FeatureCard = ({ icon: Icon, title, desc, color, onClick }: any) => (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
    >
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );

  const getEnrolledCoursesList = () => {
    return courseCatalog.filter(c => user.enrolledCourses?.includes(c.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setView('home')}
            >
                <div className="bg-sits-700 w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs">SITS</div>
                <span className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">CSE-SE Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <input type="text" placeholder="Search..." className="bg-slate-100 dark:bg-slate-700 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-sits-500 outline-none w-64 dark:text-white transition-colors" />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
            
             <button 
              onClick={() => setShowHelpModal(true)}
              className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-105"
              title="Help & FAQ"
            >
              <HelpCircle className="w-6 h-6" />
            </button>

            <button 
              onClick={toggleTheme} 
              className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all hover:scale-105"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            <button className="relative p-2 text-slate-500 dark:text-slate-300 hover:text-sits-600 transition-all hover:scale-105">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>

            <div 
              className="flex items-center space-x-3 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-105"
              onClick={() => setView('profile')}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.rollNo}</p>
              </div>
              <img 
                src={user.profilePic || "https://picsum.photos/200"} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 dark:border-slate-600" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 space-y-4 animate-slide-up">
           <input type="text" placeholder="Search..." className="w-full bg-slate-100 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2 text-sm" />
           <nav className="space-y-2">
             <button onClick={() => { setView('home'); setIsMobileMenuOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:translate-x-1 transition-all rounded font-medium text-slate-700 dark:text-slate-200">Home</button>
             <button onClick={() => { setView('profile'); setIsMobileMenuOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:translate-x-1 transition-all rounded font-medium text-slate-700 dark:text-slate-200">My Profile</button>
             <button onClick={() => { setShowCoursesModal(true); setIsMobileMenuOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:translate-x-1 transition-all rounded font-medium text-slate-700 dark:text-slate-200">My Courses</button>
             <button onClick={() => { setShowAssignmentsModal(true); setIsMobileMenuOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-700 hover:translate-x-1 transition-all rounded font-medium text-slate-700 dark:text-slate-200">Assignments</button>
             <button onClick={onLogout} className="w-full text-left p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:translate-x-1 transition-all rounded font-medium">Logout</button>
           </nav>
        </div>
      )}

      {/* Main Content Area */}
      {view === 'home' && (
      <main className="flex-1 w-full animate-fade-in pb-10">
        
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-sits-600 to-indigo-700 dark:from-slate-800 dark:to-sits-900 text-white overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full translate-y-10 -translate-x-10 blur-3xl"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10 flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 text-center md:text-left animate-slide-up">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        Welcome back, {user.name.split(' ')[0]}!
                    </h1>
                    <p className="text-sits-100 text-lg md:text-xl max-w-xl leading-relaxed">
                        Track your academic progress, access study materials, and build your skills with AI-powered tools.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                        <button 
                            onClick={() => setShowCoursesModal(true)}
                            className="bg-white text-sits-700 hover:bg-sits-50 px-6 py-3 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center"
                        >
                            <BookOpen className="w-5 h-5 mr-2" /> My Courses
                        </button>
                         <button 
                            onClick={() => setShowSkillModal(true)}
                            className="bg-sits-500/30 hover:bg-sits-500/50 text-white border border-white/20 px-6 py-3 rounded-full font-bold backdrop-blur-sm transition-all hover:scale-105 flex items-center"
                        >
                            <Sparkles className="w-5 h-5 mr-2" /> AI Tutor
                        </button>
                    </div>
                </div>
                <div className="hidden md:block relative animate-scale-up" style={{ animationDelay: '0.2s' }}>
                     <div className="w-64 h-64 bg-white/10 rounded-2xl rotate-3 backdrop-blur-md border border-white/20 flex items-center justify-center relative z-10">
                        <div className="text-center p-6">
                            <div className="w-16 h-16 bg-green-400 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                                <Award className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-bold text-2xl mb-1">8.75</h3>
                            <p className="text-sm text-sits-100">Current CGPA</p>
                            <div className="mt-4 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-400 h-full w-4/5"></div>
                            </div>
                            <p className="text-xs text-sits-200 mt-2">Top 5% of class</p>
                        </div>
                     </div>
                     <div className="absolute inset-0 bg-indigo-600/30 rounded-2xl -rotate-3 -z-10"></div>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Quick Stats/Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 -mt-10 relative z-20">
                <FeatureCard 
                    icon={BookOpen} 
                    title="My Courses" 
                    desc={`${user.enrolledCourses?.length || 0} Active Subjects`} 
                    color="bg-blue-500" 
                    onClick={() => setShowCoursesModal(true)}
                />
                <FeatureCard 
                    icon={ClipboardList} 
                    title="Assignments" 
                    desc="Submit Work" 
                    color="bg-orange-500" 
                    onClick={() => setShowAssignmentsModal(true)}
                />
                <FeatureCard 
                    icon={Calendar} 
                    title="Attendance" 
                    desc={`${attendanceStats.percentage}% Present`} 
                    color="bg-emerald-500" 
                />
                <div 
                  onClick={handleDownloadResult}
                  className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer group hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1">Results</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">CGPA: 8.5 <span className="text-xs text-sits-600 dark:text-sits-400 ml-1">(Download)</span></p>
                </div>
            </div>

            {/* New Feature Row */}
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-purple-500" /> Discover More</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <FeatureCard 
                    icon={Briefcase} 
                    title="Resume Builder" 
                    desc="Auto-generate CV" 
                    color="bg-slate-600" 
                    onClick={() => setShowResumeModal(true)}
                />
                <FeatureCard 
                    icon={Target} 
                    title="Skill Boost" 
                    desc="AI Learning Path" 
                    color="bg-purple-600" 
                    onClick={() => setShowSkillModal(true)}
                />
                <FeatureCard 
                    icon={MessageCircle} 
                    title="Community" 
                    desc="Chat & Groups" 
                    color="bg-indigo-600" 
                    onClick={() => setShowCommunityModal(true)}
                />
            </div>
        </div>
      </main>
      )}

      {view === 'profile' && (
        <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full animate-slide-up">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Profile Settings</h1>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-8 border-b border-slate-200 dark:border-slate-700 bg-sits-50 dark:bg-slate-800/50 flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                        <img 
                            src={profileForm.profilePic || "https://picsum.photos/200"} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
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
                
                <form onSubmit={handleProfileUpdate} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                            <input type="text" value={profileForm.name} disabled className="w-full p-3 bg-slate-100 dark:bg-slate-900 border rounded-lg text-slate-500 cursor-not-allowed" />
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
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Preferred Language</label>
                            <select 
                                value={profileForm.language} 
                                onChange={(e) => setProfileForm({...profileForm, language: e.target.value})}
                                className="w-full p-3 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-sits-500 dark:text-white"
                            >
                                <option>English</option>
                                <option>Telugu</option>
                                <option>Hindi</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="flex justify-between pt-4">
                         <button 
                            type="button" 
                            onClick={onLogout}
                            className="bg-red-50 text-red-600 dark:bg-red-900/20 px-6 py-3 rounded-lg font-bold hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center transition-colors"
                        >
                            <LogOut className="w-5 h-5 mr-2" /> Logout
                        </button>

                        <button type="submit" className="bg-sits-600 hover:bg-sits-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition-all hover:scale-105">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* AI Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!showAiChat ? (
          <button 
            onClick={() => setShowAiChat(true)}
            className="w-14 h-14 bg-sits-600 hover:bg-sits-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
          >
            <Bot className="w-8 h-8" />
          </button>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[500px] border border-slate-200 dark:border-slate-700 animate-slide-up overflow-hidden">
            <div className="bg-sits-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Bot className="w-6 h-6 mr-2" />
                <h3 className="font-bold">SITS AI Tutor</h3>
              </div>
              <button onClick={() => setShowAiChat(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900">
               {chatMessages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-sits-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'}`}>
                     {msg.text}
                   </div>
                 </div>
               ))}
               {isAiLoading && <div className="text-slate-400 text-xs text-center">AI is typing...</div>}
               <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleAiSubmit} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex">
               <input 
                 type="text" 
                 value={chatInput} 
                 onChange={(e) => setChatInput(e.target.value)}
                 className="flex-1 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-full px-4 py-2 outline-none focus:ring-1 focus:ring-sits-500" 
                 placeholder="Ask about your course..."
               />
               <button type="submit" className="ml-2 p-2 bg-sits-600 text-white rounded-full hover:bg-sits-700"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        )}
      </div>

      {/* Courses Modal */}
      {showCoursesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-2xl font-bold dark:text-white">Academic Courses</h2>
                    <button onClick={() => setShowCoursesModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-6 h-6 dark:text-slate-400" /></button>
                </div>
                
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                    {['enrolled', 'catalog', 'grades', 'resources'].map((tab) => (
                         <button 
                            key={tab}
                            onClick={() => setCourseTab(tab as any)}
                            className={`flex-1 min-w-[120px] py-4 font-semibold text-center transition-colors capitalize ${courseTab === tab ? 'border-b-2 border-sits-600 text-sits-600 bg-sits-50 dark:bg-slate-800 dark:text-sits-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            {tab === 'resources' ? 'Classroom' : tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800/50">
                    {courseTab === 'enrolled' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {getEnrolledCoursesList().length > 0 ? getEnrolledCoursesList().map(course => (
                                <div key={course.id} className="bg-white dark:bg-slate-700 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg dark:text-white">{course.title}</h3>
                                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-mono">{course.code}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-4">Instructor: {course.instructor}</p>
                                    <div className="w-full bg-slate-100 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full w-3/4"></div>
                                    </div>
                                    <p className="text-xs text-right mt-1 text-slate-400">75% Complete</p>
                                </div>
                            )) : (
                                <div className="col-span-2 text-center py-10">
                                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">You haven't enrolled in any courses yet.</p>
                                    <button onClick={() => setCourseTab('catalog')} className="text-sits-600 font-bold mt-2 hover:underline">Browse Catalog</button>
                                </div>
                            )}
                        </div>
                    )}

                    {courseTab === 'catalog' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courseCatalog.map(course => {
                                const isEnrolled = user.enrolledCourses?.includes(course.id);
                                return (
                                <div key={course.id} className="bg-white dark:bg-slate-700 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 flex flex-col justify-between h-full">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg dark:text-white">{course.title}</h3>
                                            <span className="bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs px-2 py-1 rounded font-mono">{course.code}</span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-300 mb-2">Instructor: {course.instructor}</p>
                                        <p className="text-xs text-slate-400 mb-4">{course.credits} Credits</p>
                                    </div>
                                    <button 
                                        onClick={() => enrollInCourse(course.id)}
                                        disabled={isEnrolled}
                                        className={`w-full py-2 rounded-lg font-bold transition-all ${isEnrolled ? 'bg-green-100 text-green-700 cursor-default' : 'bg-sits-600 text-white hover:bg-sits-700 hover:scale-[1.02]'}`}
                                    >
                                        {isEnrolled ? 'Enrolled' : 'Enroll Now'}
                                    </button>
                                </div>
                            )})}
                        </div>
                    )}

                    {courseTab === 'grades' && (
                        <div className="space-y-4">
                            {gradedSubmissions.length > 0 ? gradedSubmissions.map(sub => (
                                <div key={sub.id} className="bg-white dark:bg-slate-700 p-5 rounded-xl shadow-sm border-l-4 border-green-500">
                                    <div className="flex justify-between">
                                        <h3 className="font-bold text-lg dark:text-white">{sub.assignmentTitle}</h3>
                                        <span className={`font-bold text-xl ${sub.status === 'late' ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                            {sub.status === 'late' ? 'Late' : sub.grade}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Submitted: {sub.submittedDate}</p>
                                    {sub.feedback && (
                                        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Feedback</p>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{sub.feedback}"</p>
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-10">
                                    <Award className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">No graded assignments yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {courseTab === 'resources' && (
                        <div className="space-y-4">
                             {resources.length > 0 ? resources.map(res => (
                                <div key={res.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 flex items-start">
                                    <div className={`p-3 rounded-lg mr-4 ${
                                        res.type === 'video' ? 'bg-red-100 text-red-600' : 
                                        res.type === 'event' ? 'bg-purple-100 text-purple-600' : 
                                        res.type === 'project' ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {res.type === 'video' && <Video className="w-6 h-6" />}
                                        {res.type === 'event' && <Bell className="w-6 h-6" />}
                                        {res.type === 'project' && <Briefcase className="w-6 h-6" />}
                                        {(res.type === 'note' || res.type === 'assignment') && <FileText className="w-6 h-6" />}
                                        {res.type === 'image' && <ImageIcon className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-bold text-lg dark:text-white">{res.title}</h4>
                                            <span className="text-xs text-slate-500">{res.datePosted}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{res.description}</p>
                                        {res.url && (
                                            <a 
                                                href={res.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                                            >
                                                View Material
                                            </a>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2">Posted by {res.postedBy}</p>
                                    </div>
                                </div>
                             )) : (
                                <div className="text-center py-10">
                                    <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500">No class resources posted yet.</p>
                                </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Community Chat Modal */}
      {showCommunityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex h-[80vh] animate-scale-up">
                  {/* Sidebar */}
                  <div className="w-72 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                          <h2 className="font-bold text-xl dark:text-white flex items-center"><MessageCircle className="mr-2" /> Chats</h2>
                      </div>
                      <div className="p-4 space-y-2 overflow-y-auto bg-white dark:bg-slate-800 flex-1">
                          <div className="p-3 bg-sits-100 dark:bg-sits-900/30 border border-sits-200 dark:border-sits-700 rounded-lg cursor-pointer">
                              <h3 className="font-bold text-sits-700 dark:text-sits-300">SITS Community</h3>
                              <p className="text-xs text-slate-500">General Discussion</p>
                          </div>
                          <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer opacity-50">
                              <h3 className="font-bold dark:text-white">CSE-SE 2023</h3>
                              <p className="text-xs text-slate-500">Locked</p>
                          </div>
                          <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer opacity-50">
                              <h3 className="font-bold dark:text-white">Project Group A</h3>
                              <p className="text-xs text-slate-500">Locked</p>
                          </div>
                      </div>
                  </div>

                  {/* Chat Area */}
                  <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900/50">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                          <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mr-3">SC</div>
                              <div>
                                  <h3 className="font-bold dark:text-white">SITS Community</h3>
                                  <p className="text-xs text-green-500 flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Online</p>
                              </div>
                          </div>
                          <button onClick={() => setShowCommunityModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 dark:text-slate-400" /></button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {groupMessages.map((msg) => {
                              const isMe = msg.senderRoll === user.rollNo;
                              return (
                                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                      {!isMe && <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold mr-2">{msg.senderName.charAt(0)}</div>}
                                      <div className={`max-w-[70%] p-3 rounded-xl shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none'}`}>
                                          {!isMe && <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{msg.senderName}</p>}
                                          <p className="text-sm">{msg.text}</p>
                                          <p className={`text-[10px] text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.timestamp}</p>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <form onSubmit={handleGroupChatSubmit} className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex">
                          <input 
                              type="text" 
                              value={groupInput}
                              onChange={(e) => setGroupInput(e.target.value)}
                              className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg outline-none dark:text-white"
                              placeholder="Type a message..."
                          />
                          <button type="submit" className="ml-3 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"><Send className="w-5 h-5" /></button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-up overflow-hidden">
             <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <h2 className="text-2xl font-bold flex items-center dark:text-white"><Upload className="mr-2" /> Submit Assignment</h2>
                <button onClick={() => setShowAssignmentsModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 dark:text-slate-400" /></button>
            </div>
            <form onSubmit={initiateSubmission} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Assignment Title</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sits-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="e.g., Data Structures Lab 1"
                        value={assignmentForm.title}
                        onChange={e => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Due Date</label>
                    <input 
                        type="date" 
                        required 
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sits-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        value={assignmentForm.dueDate}
                        onChange={e => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <div className="border rounded-lg overflow-hidden dark:border-slate-600">
                        <div className="bg-slate-50 dark:bg-slate-700 p-2 border-b dark:border-slate-600 flex space-x-2">
                            <button type="button" onClick={() => insertMarkdown('bold')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded" title="Bold"><Bold className="w-4 h-4 dark:text-white" /></button>
                            <button type="button" onClick={() => insertMarkdown('italic')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded" title="Italic"><Italic className="w-4 h-4 dark:text-white" /></button>
                            <button type="button" onClick={() => insertMarkdown('list')} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded" title="List"><List className="w-4 h-4 dark:text-white" /></button>
                        </div>
                        <textarea 
                            id="assignment-desc"
                            className="w-full p-3 h-32 focus:outline-none dark:bg-slate-800 dark:text-white"
                            placeholder="Enter assignment details..."
                            value={assignmentForm.description}
                            onChange={e => setAssignmentForm({...assignmentForm, description: e.target.value})}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Attachment</label>
                    <div 
                        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                        {assignmentForm.file ? (
                            <div className="flex items-center justify-center space-x-3">
                                <FileText className="w-8 h-8 text-sits-600" />
                                <div className="text-left">
                                    <p className="font-bold text-sm dark:text-white">{assignmentForm.file.name}</p>
                                    <p className="text-xs text-slate-500">{(assignmentForm.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); removeFile(); }} className="p-1 hover:bg-red-100 text-red-500 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Drag & drop files or <span className="text-sits-600">Browse</span></p>
                                <p className="text-xs text-slate-400 mt-1">Max 10MB (PDF, DOCX)</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="pt-2">
                    <button type="submit" className="w-full bg-sits-600 hover:bg-sits-700 text-white py-3 rounded-lg font-bold shadow-lg transition-transform hover:scale-[1.02]">Proceed to Submit</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-up">
                <div className="flex items-center mb-4 text-orange-500">
                    <AlertCircle className="w-8 h-8 mr-3" />
                    <h3 className="text-xl font-bold dark:text-white">Confirm Submission</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4">Please verify the details before submitting. This action cannot be undone.</p>
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 space-y-2 text-sm">
                    <p><span className="font-bold text-slate-500">Title:</span> <span className="dark:text-white">{assignmentForm.title}</span></p>
                    <p><span className="font-bold text-slate-500">Due Date:</span> <span className="dark:text-white">{assignmentForm.dueDate}</span></p>
                    <p><span className="font-bold text-slate-500">File:</span> <span className="dark:text-white">{assignmentForm.file?.name || 'No file attached'}</span></p>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => setShowConfirmationModal(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                    <button onClick={confirmSubmission} className="flex-1 py-2 bg-sits-600 text-white rounded-lg font-bold hover:bg-sits-700">Confirm Submit</button>
                </div>
            </div>
        </div>
      )}

      {/* Resume Modal */}
      {showResumeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold flex items-center dark:text-white"><Briefcase className="mr-2" /> Resume Builder</h2>
                        <button onClick={() => setShowResumeModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 dark:text-slate-400" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Professional Summary</label>
                                <textarea className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={3} value={resumeForm.summary} onChange={e => setResumeForm({...resumeForm, summary: e.target.value})} placeholder="Brief overview of your career goals..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Skills</label>
                                <textarea className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={4} value={resumeForm.skills} onChange={e => setResumeForm({...resumeForm, skills: e.target.value})} placeholder="Java, Python, React..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Projects</label>
                                <textarea className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={4} value={resumeForm.projects} onChange={e => setResumeForm({...resumeForm, projects: e.target.value})} placeholder="List your academic projects..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Experience / Internships</label>
                                <textarea className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={4} value={resumeForm.experience} onChange={e => setResumeForm({...resumeForm, experience: e.target.value})} placeholder="Details of internships..."></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Achievements</label>
                                <textarea className="w-full p-3 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" rows={4} value={resumeForm.achievements} onChange={e => setResumeForm({...resumeForm, achievements: e.target.value})} placeholder="Hackathons, Certifications..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
                        <button onClick={handleResumeSave} className="bg-sits-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-sits-700 flex items-center shadow-lg"><Download className="w-4 h-4 mr-2" /> Save & Download</button>
                    </div>
               </div>
          </div>
      )}

      {/* Skill Modal */}
      {showSkillModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-2xl font-bold flex items-center dark:text-white"><Target className="mr-2" /> AI Skill Boost</h2>
                        <button onClick={() => setShowSkillModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 dark:text-slate-400" /></button>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {!roadmap ? (
                            <div className="text-center py-8">
                                <Sparkles className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-pulse" />
                                <h3 className="text-xl font-bold mb-2 dark:text-white">What do you want to learn?</h3>
                                <p className="text-slate-500 mb-6">Enter a topic (e.g., "React JS", "Machine Learning") and AI will generate a roadmap.</p>
                                <div className="flex max-w-md mx-auto space-x-2">
                                    <input 
                                        type="text" 
                                        className="flex-1 p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                                        placeholder="Enter skill..." 
                                        value={skillInterest}
                                        onChange={(e) => setSkillInterest(e.target.value)}
                                    />
                                    <button 
                                        onClick={generateRoadmap} 
                                        disabled={isGeneratingRoadmap}
                                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {isGeneratingRoadmap ? 'Generating...' : 'Start'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-purple-700 dark:text-purple-400">Roadmap: {roadmap.interest}</h3>
                                    <button onClick={() => setRoadmap(undefined)} className="text-sm text-slate-500 hover:text-red-500 flex items-center"><RefreshCw className="w-4 h-4 mr-1" /> Reset</button>
                                </div>
                                <div className="space-y-4">
                                    {roadmap.days.map((day, idx) => (
                                        <div key={idx} className={`p-4 border rounded-xl transition-all ${day.isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-white border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                                            <div className="flex items-start">
                                                <div 
                                                    onClick={() => toggleTaskCompletion(idx)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 cursor-pointer mt-1 ${day.isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-500'}`}
                                                >
                                                    {day.isCompleted && <CheckSquare className="w-4 h-4 text-white" />}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold ${day.isCompleted ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>Day {day.day}: {day.topic}</h4>
                                                    <p className={`text-sm mt-1 ${day.isCompleted ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{day.task}</p>
                                                </div>
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-xl font-bold flex items-center dark:text-white"><HelpCircle className="mr-2 text-sits-500" /> Help Center</h2>
                    <button onClick={() => setShowHelpModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full"><X className="w-6 h-6 dark:text-slate-400" /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border-b border-slate-100 dark:border-slate-700 pb-4 last:border-0 last:pb-0">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-2 text-sm">{faq.q}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-xs text-slate-400">Need more help? Contact admin@siddhartha.org.in</p>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
