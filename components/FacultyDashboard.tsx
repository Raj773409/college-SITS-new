import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, AttendanceRecord, CourseResource, ResourceType } from '../types';
import { 
  Users, LogOut, BookOpen, Search, GraduationCap, Eye, CheckCircle, MessageSquare, X, Save,
  Calendar, Upload, Video, FileText, Image as ImageIcon, Briefcase, Bell, Clock, AlertTriangle,
  Download, FileDown, ChevronRight, Activity, PieChart, MoreVertical, Filter, Award, Check,
  Book, Mic, FileQuestion, MonitorPlay, ChevronLeft, ChevronRight as ChevronRightIcon,
  List, Grid, Hash, UserCheck, Shield, Plus, Paperclip, Trash2, Edit, FolderOpen
} from 'lucide-react';
import { api } from '../services/api';

interface FacultyDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'attendance' | 'resources'>('students');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  
  // Student Management State
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);

  // Resource State
  const [resourceFilter, setResourceFilter] = useState<'all' | 'notes' | 'videos' | 'assignments' | 'pdfs' | 'images' | 'projects'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [resourceSearch, setResourceSearch] = useState(""); // New Search State
  
  const [resourceForm, setResourceForm] = useState<{
      title: string; 
      desc: string; 
      type: ResourceType; 
      url: string; 
      fileName?: string;
      subject: string; 
      targetYear: string;
  }>({
      title: '', desc: '', type: 'note', url: '', subject: '', targetYear: '1'
  });

  const [editingResource, setEditingResource] = useState<CourseResource | null>(null);
  const [showEditResourceModal, setShowEditResourceModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subject Management
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', year: '1' });
  const [subjectsByYear, setSubjectsByYear] = useState<Record<string, string[]>>({
      '1': ['Mathematics I', 'English', 'Engineering Physics', 'C Programming'],
      '2': ['Data Structures', 'Java Programming', 'Digital Logic', 'Discrete Maths'],
      '3': ['Operating Systems', 'DBMS', 'Computer Networks', 'Software Engineering'],
      '4': ['Artificial Intelligence', 'Cloud Computing', 'Machine Learning', 'Project Work']
  });

  // Attendance Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // Load Data
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) setStudents(Object.values(JSON.parse(storedUsers)));

    const storedAttendance = localStorage.getItem('sits_attendance');
    if (storedAttendance) setAttendanceRecords(JSON.parse(storedAttendance));

    const storedResources = localStorage.getItem('sits_resources');
    if (storedResources) setResources(JSON.parse(storedResources));

    const storedSubjects = localStorage.getItem('sits_subjects');
    if (storedSubjects) setSubjectsByYear(JSON.parse(storedSubjects));
  }, []);

  const saveSubjects = (updatedSubjects: Record<string, string[]>) => {
      setSubjectsByYear(updatedSubjects);
      localStorage.setItem('sits_subjects', JSON.stringify(updatedSubjects));
  };

  const handleAddSubject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newSubject.name.trim()) return;
      const updated = { ...subjectsByYear };
      if (!updated[newSubject.year]) updated[newSubject.year] = [];
      if (!updated[newSubject.year].includes(newSubject.name)) {
          updated[newSubject.year].push(newSubject.name);
          saveSubjects(updated);
          alert(`Subject "${newSubject.name}" added to Year ${newSubject.year}`);
          setNewSubject({ name: '', year: '1' });
          setShowAddSubjectModal(false);
      } else {
          alert('Subject already exists for this year.');
      }
  };

  const markAttendance = (rollNo: string, status: 'present' | 'absent' | 'late') => {
      const existingRecordIndex = attendanceRecords.findIndex(r => r.rollNo === rollNo && r.date === selectedDate);
      let newRecords = [...attendanceRecords];

      if (existingRecordIndex > -1) {
          newRecords[existingRecordIndex].status = status;
      } else {
          newRecords.push({ date: selectedDate, rollNo, status });
      }

      setAttendanceRecords(newRecords);
      localStorage.setItem('sits_attendance', JSON.stringify(newRecords));
  };

  const markAllAttendance = (status: 'present' | 'absent') => {
      const newRecords = [...attendanceRecords];
      const cleanRecords = newRecords.filter(r => r.date !== selectedDate);
      
      const batchRecords: AttendanceRecord[] = students
        .filter(s => s.role === 'student')
        .map(s => ({
            date: selectedDate,
            rollNo: s.rollNo,
            status: status
        }));
      
      const finalRecords = [...cleanRecords, ...batchRecords];
      setAttendanceRecords(finalRecords);
      localStorage.setItem('sits_attendance', JSON.stringify(finalRecords));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit for local storage handling
              alert("File size too large (Max 5MB for this demo).");
              return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
              setResourceForm(prev => ({
                  ...prev,
                  url: event.target?.result as string,
                  fileName: file.name
              }));
          };
          reader.readAsDataURL(file);
      }
  };

  const postResource = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!resourceForm.title || !resourceForm.subject) {
          alert("Please fill in Title and Subject");
          return;
      }

      const now = new Date();
      const newResource: CourseResource = {
          id: Date.now().toString(),
          title: resourceForm.title,
          description: resourceForm.desc,
          type: resourceForm.type,
          url: resourceForm.url,
          fileName: resourceForm.fileName,
          subject: resourceForm.subject,
          targetYear: resourceForm.targetYear,
          datePosted: now.toLocaleDateString(),
          timePosted: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          postedBy: user.name
      };
      
      const updated = await api.postResource(newResource);
      setResources(updated as CourseResource[]);
      setResourceForm({ title: '', desc: '', type: 'note', url: '', subject: '', targetYear: '1', fileName: '' });
      if(fileInputRef.current) fileInputRef.current.value = '';
      alert("Resource posted successfully!");
  };

  const handleUpdateResource = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editingResource) return;
      
      await api.updateResource(editingResource);
      const updatedList = resources.map(r => r.id === editingResource.id ? editingResource : r);
      setResources(updatedList);
      setShowEditResourceModal(false);
      setEditingResource(null);
      alert("Resource updated successfully!");
  };

  const handleDeleteResource = async (id: string) => {
      if(window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
          await api.deleteResource(id);
          setResources(prev => prev.filter(r => r.id !== id));
      }
  };

  const getAttendanceStatus = (rollNo: string) => {
      const record = attendanceRecords.find(r => r.rollNo === rollNo && r.date === selectedDate);
      return record ? record.status : null;
  };

  const getFilteredResources = () => {
      let filtered = resources;
      
      // Filter by Type
      if (resourceFilter === 'notes') filtered = filtered.filter(r => ['note', 'lab_manual', 'question_paper'].includes(r.type));
      else if (resourceFilter === 'pdfs') filtered = filtered.filter(r => r.type === 'pdf');
      else if (resourceFilter === 'videos') filtered = filtered.filter(r => ['video', 'recording'].includes(r.type));
      else if (resourceFilter === 'assignments') filtered = filtered.filter(r => ['assignment', 'event'].includes(r.type));
      else if (resourceFilter === 'images') filtered = filtered.filter(r => r.type === 'image');
      else if (resourceFilter === 'projects') filtered = filtered.filter(r => r.type === 'project');

      // Filter by Subject
      if (subjectFilter !== 'all') {
          filtered = filtered.filter(r => r.subject === subjectFilter);
      }

      // Filter by Year
      if (yearFilter !== 'all') {
          filtered = filtered.filter(r => r.targetYear === yearFilter);
      }
      
      // Filter by Search (Title, Desc, Filename)
      if (resourceSearch.trim()) {
          const lowerSearch = resourceSearch.toLowerCase();
          filtered = filtered.filter(r => 
              r.title.toLowerCase().includes(lowerSearch) ||
              r.description.toLowerCase().includes(lowerSearch) ||
              (r.fileName && r.fileName.toLowerCase().includes(lowerSearch))
          );
      }

      return filtered;
  };

  const getStudentAttendancePercentage = (rollNo: string) => {
      const records = attendanceRecords.filter(r => r.rollNo === rollNo);
      if (records.length === 0) return 100; // Default
      const present = records.filter(r => r.status === 'present').length;
      return Math.round((present / records.length) * 100);
  };

  // Calendar Logic
  const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const days = new Date(year, month + 1, 0).getDate();
      const firstDay = new Date(year, month, 1).getDay();
      return { days, firstDay };
  };

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentDate(newDate);
  };

  const renderCalendar = () => {
      const { days, firstDay } = getDaysInMonth(currentDate);
      const daysArray = [];
      const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      // Empty slots
      for (let i = 0; i < firstDay; i++) {
          daysArray.push(<div key={`empty-${i}`} className="h-14"></div>);
      }

      // Days
      for (let d = 1; d <= days; d++) {
          const dateStr = `${currentMonthStr}-${String(d).padStart(2, '0')}`;
          const isSelected = dateStr === selectedDate;
          const hasRecords = attendanceRecords.some(r => r.date === dateStr);
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          daysArray.push(
              <div 
                  key={d} 
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-14 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border ${
                      isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-105 z-10' 
                      : isToday 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                  <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>{d}</span>
                  {hasRecords && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]'}`}></span>
                  )}
              </div>
          );
      }

      return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 hover:shadow-[0_0_30px_rgba(0,0,0,0.1)] transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-transform hover:scale-110"><ChevronLeft className="w-5 h-5 dark:text-white" /></button>
                  <h3 className="font-bold text-lg dark:text-white">{monthYearStr}</h3>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-transform hover:scale-110"><ChevronRightIcon className="w-5 h-5 dark:text-white" /></button>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-xs font-bold text-slate-400 uppercase">{day}</div>
                  ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                  {daysArray}
              </div>
          </div>
      );
  };

  const availableSubjects = yearFilter === 'all' 
    ? Object.values(subjectsByYear).flat() 
    : (subjectsByYear[yearFilter] || []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex transition-colors duration-200 font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-30 shadow-2xl border-r border-slate-700/50">
        <div className="p-8 border-b border-slate-700/50 bg-slate-950/50 backdrop-blur-md">
            <h2 className="text-2xl font-bold flex items-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                <GraduationCap className="mr-3 text-indigo-400" /> Faculty Portal
            </h2>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-widest font-semibold ml-1">Instructor Dashboard</p>
        </div>
        <nav className="flex-1 p-6 space-y-3">
            {[
                { id: 'students', icon: Users, label: 'Students' },
                { id: 'classes', icon: BookOpen, label: 'Assignments' },
                { id: 'attendance', icon: Calendar, label: 'Attendance' },
                { id: 'resources', icon: Upload, label: 'Class Resources' },
            ].map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)} 
                    className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 font-medium group relative overflow-hidden ${activeTab === item.id ? 'bg-indigo-600/20 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}
                >
                    {activeTab === item.id && <div className="absolute inset-0 bg-indigo-500/10 blur-xl"></div>}
                    <div className={`p-2 rounded-lg mr-3 transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                        <item.icon className="w-5 h-5" /> 
                    </div>
                    <span className="relative z-10">{item.label}</span>
                </button>
            ))}
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center mb-4 px-2">
                 <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm mr-2 ring-2 ring-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.5)]">{user.name.charAt(0)}</div>
                 <div>
                     <p className="text-sm font-bold truncate w-32">{user.name}</p>
                     <p className="text-xs text-slate-500">Instructor</p>
                 </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center p-3 text-red-400 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 rounded-xl transition-all duration-200 group hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-72 overflow-y-auto h-screen bg-slate-50 dark:bg-slate-950 relative">
        <div className="p-8 max-w-7xl mx-auto">
             
             {/* STUDENTS TAB */}
             {activeTab === 'students' && (
                 <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Student Directory</h1>
                            <p className="text-slate-500 mt-1">Manage and view all students in your class.</p>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl outline-none w-64 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-sm focus:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-5">Student Profile</th>
                                    <th className="p-5">Roll Number</th>
                                    <th className="p-5">Academic Info</th>
                                    <th className="p-5">Attendance</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {students.filter(s => s.role === 'student' && (s.name.toLowerCase().includes(studentSearch.toLowerCase()) || s.rollNo.includes(studentSearch.toUpperCase()))).map(student => (
                                    <tr key={student.rollNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                        <td className="p-5 flex items-center">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold mr-3 group-hover:scale-110 transition-transform shadow-md">
                                                {student.profilePic ? <img src={student.profilePic} className="w-full h-full rounded-full object-cover" /> : student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.name}</p>
                                                <div className="flex items-center mt-1">
                                                    <div className={`w-2 h-2 rounded-full mr-1.5 ${student.isActive ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'bg-slate-300'}`}></div>
                                                    <p className="text-xs text-slate-400">{student.isActive ? 'Online' : 'Offline'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 font-mono text-sm text-slate-600 dark:text-slate-400">{student.rollNo}</td>
                                        <td className="p-5 text-sm dark:text-slate-300">
                                            <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs font-bold text-slate-500 border border-slate-200 dark:border-slate-700">{student.branch}</span>
                                            <span className="ml-2 text-slate-500">{student.year} Year</span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center">
                                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full w-24 mr-3 overflow-hidden">
                                                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${getStudentAttendancePercentage(student.rollNo)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{getStudentAttendancePercentage(student.rollNo)}%</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => setSelectedStudent(student)} className="text-indigo-600 hover:text-white hover:bg-indigo-600 dark:text-indigo-400 dark:hover:text-white text-sm font-bold bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]">View Profile</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
             )}

             {/* ASSIGNMENTS TAB */}
             {activeTab === 'classes' && (
                 <div className="text-center py-20 animate-fade-in"><BookOpen className="w-16 h-16 mx-auto mb-4 text-slate-300"/><p>Assignments Module (See Dashboard)</p></div>
             )}

             {/* ATTENDANCE TAB */}
             {activeTab === 'attendance' && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {renderCalendar()}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Summary for {selectedDate}</h3>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-shadow">
                                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {students.filter(s => getAttendanceStatus(s.rollNo) === 'present').length}
                                    </div>
                                    <div className="text-xs text-emerald-600/70 font-bold uppercase">Present</div>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-shadow">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {students.filter(s => getAttendanceStatus(s.rollNo) === 'absent').length}
                                    </div>
                                    <div className="text-xs text-red-600/70 font-bold uppercase">Absent</div>
                                </div>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-shadow">
                                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {students.filter(s => getAttendanceStatus(s.rollNo) === 'late').length}
                                    </div>
                                    <div className="text-xs text-amber-600/70 font-bold uppercase">Late</div>
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <button onClick={() => markAllAttendance('present')} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105">Mark All Present</button>
                                <button onClick={() => markAllAttendance('absent')} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition-all hover:scale-105">Mark All Absent</button>
                            </div>
                        </div>
                    </div>

                    {/* Student List Column */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold dark:text-white flex items-center">
                                        Attendance List
                                        <span className="ml-3 text-sm font-normal text-slate-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full border dark:border-slate-700 shadow-sm">{selectedDate}</span>
                                    </h2>
                                </div>
                                <div className="relative group">
                                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                     <input type="text" placeholder="Filter..." className="pl-10 pr-4 py-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                            <div className="max-h-[600px] overflow-y-auto">
                                {students.filter(s => s.role === 'student').map(student => {
                                    const status = getAttendanceStatus(student.rollNo);
                                    return (
                                        <div key={student.rollNo} className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                            <div className="flex items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-4 shadow-sm ${status === 'present' ? 'bg-emerald-100 text-emerald-700' : status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm dark:text-white">{student.name}</p>
                                                    <p className="text-xs text-slate-500">{student.rollNo}</p>
                                                </div>
                                            </div>
                                            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 shadow-inner">
                                                <button onClick={() => markAttendance(student.rollNo, 'present')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${status === 'present' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-emerald-500'}`}>P</button>
                                                <button onClick={() => markAttendance(student.rollNo, 'absent')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${status === 'absent' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-red-500'}`}>A</button>
                                                <button onClick={() => markAttendance(student.rollNo, 'late')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${status === 'late' ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-md transform scale-105' : 'text-slate-400 hover:text-amber-500'}`}>L</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {/* RESOURCES TAB */}
             {activeTab === 'resources' && (
                <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 sticky top-5 z-10 hover:shadow-[0_0_30px_rgba(0,0,0,0.1)] transition-shadow">
                            <h3 className="font-bold text-xl mb-6 dark:text-white flex items-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"><Upload className="mr-3 text-indigo-500" /> Create Post</h3>
                            <form onSubmit={postResource} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Year</label>
                                        <select 
                                            className="w-full p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg"
                                            value={resourceForm.targetYear}
                                            onChange={e => setResourceForm({...resourceForm, targetYear: e.target.value})}
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                        <ChevronRight className="w-4 h-4 absolute right-3 top-9 text-slate-400 rotate-90 pointer-events-none" />
                                    </div>
                                    <div className="relative group">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Category</label>
                                        <select className="w-full p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg" value={resourceForm.type} onChange={e => setResourceForm({...resourceForm, type: e.target.value as ResourceType})}>
                                            <option value="note">Notes</option>
                                            <option value="pdf">PDF</option>
                                            <option value="video">Video</option>
                                            <option value="recording">Recording</option>
                                            <option value="image">Image</option>
                                            <option value="assignment">Assignment</option>
                                            <option value="lab_manual">Lab Manual</option>
                                            <option value="question_paper">Question Paper</option>
                                            <option value="event">Event</option>
                                            <option value="project">Project</option>
                                        </select>
                                        <ChevronRight className="w-4 h-4 absolute right-3 top-9 text-slate-400 rotate-90 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="relative group">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Subject</label>
                                        <button type="button" onClick={() => setShowAddSubjectModal(true)} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center"><Plus className="w-3 h-3 mr-1" /> Add New</button>
                                    </div>
                                    <select className="w-full p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg" value={resourceForm.subject} onChange={e => setResourceForm({...resourceForm, subject: e.target.value})}>
                                        <option value="">Select Subject</option>
                                        {(subjectsByYear[resourceForm.targetYear] || []).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                    <ChevronRight className="w-4 h-4 absolute right-3 top-9 text-slate-400 rotate-90 pointer-events-none" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Title</label>
                                    <input type="text" required className="w-full p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg" placeholder="Resource Title" value={resourceForm.title} onChange={e => setResourceForm({...resourceForm, title: e.target.value})} />
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Attachment (URL or Local File)</label>
                                    <div className="flex space-x-2">
                                        <input type="text" className="flex-1 p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg text-sm" placeholder="Paste Link..." value={resourceForm.fileName ? '' : resourceForm.url} onChange={e => setResourceForm({...resourceForm, url: e.target.value, fileName: ''})} disabled={!!resourceForm.fileName} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3.5 border rounded-xl dark:border-slate-700 transition-colors ${resourceForm.fileName ? 'bg-indigo-100 dark:bg-indigo-900 border-indigo-300' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}>
                                            <Paperclip className={`w-5 h-5 ${resourceForm.fileName ? 'text-indigo-600' : 'text-slate-500'}`} />
                                        </button>
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                    {resourceForm.fileName && (
                                        <div className="mt-2 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 p-2 rounded-lg flex justify-between items-center">
                                            <span className="truncate max-w-[200px]">{resourceForm.fileName}</span>
                                            <button onClick={() => {
                                                setResourceForm({...resourceForm, url: '', fileName: ''});
                                                if(fileInputRef.current) fileInputRef.current.value = '';
                                            }} className="text-red-500 ml-2"><X className="w-3 h-3"/></button>
                                        </div>
                                    )}
                                </div>

                                <textarea className="w-full p-3.5 border rounded-xl dark:bg-slate-950 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow focus:shadow-lg" rows={3} placeholder="Description" value={resourceForm.desc} onChange={e => setResourceForm({...resourceForm, desc: e.target.value})}></textarea>
                                <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transform hover:-translate-y-1">Post to Class</button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                         <div className="flex flex-col space-y-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                             {/* Filters Row 1 */}
                             <div className="flex items-center space-x-3 overflow-x-auto pb-2">
                                 {/* Search Bar */}
                                 <div className="relative min-w-[200px]">
                                     <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                     <input 
                                         type="text" 
                                         placeholder="Search resources..." 
                                         className="pl-10 pr-4 py-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm w-full"
                                         value={resourceSearch}
                                         onChange={(e) => setResourceSearch(e.target.value)}
                                     />
                                 </div>
                                 
                                 <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-2"></div>
                                 
                                 <div className="flex items-center space-x-2">
                                     <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Year:</span>
                                     <select className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none shadow-sm cursor-pointer" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                                         <option value="all">All</option>
                                         <option value="1">1st</option>
                                         <option value="2">2nd</option>
                                         <option value="3">3rd</option>
                                         <option value="4">4th</option>
                                     </select>
                                 </div>

                                 <span className="text-sm font-bold text-slate-500 whitespace-nowrap"><Book className="w-4 h-4 inline mr-1" /> Subject:</span>
                                 <select 
                                    className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 max-w-[200px] cursor-pointer"
                                    value={subjectFilter}
                                    onChange={(e) => setSubjectFilter(e.target.value)}
                                 >
                                     <option value="all">All Subjects</option>
                                     {availableSubjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                 </select>
                             </div>

                             {/* Type Filter */}
                             <div className="flex space-x-2 overflow-x-auto">
                                <button onClick={() => setResourceFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'all' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>All</button>
                                <button onClick={() => setResourceFilter('notes')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'notes' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Notes</button>
                                <button onClick={() => setResourceFilter('pdfs')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'pdfs' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>PDFs</button>
                                <button onClick={() => setResourceFilter('videos')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'videos' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Videos</button>
                                <button onClick={() => setResourceFilter('images')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'images' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Images</button>
                                <button onClick={() => setResourceFilter('projects')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'projects' ? 'bg-teal-600 text-white shadow-[0_0_15px_rgba(13,148,136,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Projects</button>
                                <button onClick={() => setResourceFilter('assignments')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${resourceFilter === 'assignments' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>Assignments</button>
                             </div>
                             
                             <div className="text-right text-xs font-bold text-slate-400 border-t pt-2 border-slate-100 dark:border-slate-700">
                                 {getFilteredResources().length} Items Found
                             </div>
                         </div>

                         {getFilteredResources().map(res => (
                                <div key={res.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-start hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] transition-all group duration-300">
                                    <div className={`p-4 rounded-2xl mr-5 shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform ${
                                        res.type === 'video' || res.type === 'recording' ? 'bg-red-50 text-red-600' : 
                                        res.type === 'pdf' ? 'bg-red-50 text-red-700' :
                                        res.type === 'note' ? 'bg-blue-50 text-blue-600' :
                                        res.type === 'lab_manual' ? 'bg-emerald-50 text-emerald-600' :
                                        res.type === 'image' ? 'bg-pink-50 text-pink-600' :
                                        res.type === 'project' ? 'bg-teal-50 text-teal-600' :
                                        'bg-slate-50 text-slate-600'
                                    }`}>
                                        {(res.type === 'video' || res.type === 'recording') && <MonitorPlay className="w-8 h-8" />}
                                        {(res.type === 'note') && <FileText className="w-8 h-8" />}
                                        {(res.type === 'pdf') && <FileDown className="w-8 h-8" />}
                                        {(res.type === 'image') && <ImageIcon className="w-8 h-8" />}
                                        {res.type === 'lab_manual' && <Book className="w-8 h-8" />}
                                        {res.type === 'assignment' && <Briefcase className="w-8 h-8" />}
                                        {res.type === 'event' && <Bell className="w-8 h-8" />}
                                        {res.type === 'project' && <FolderOpen className="w-8 h-8" />}
                                        {res.type === 'question_paper' && <FileQuestion className="w-8 h-8" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                     <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{res.subject || 'General'}</span>
                                                     {res.targetYear && <span className="ml-2 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">Year {res.targetYear}</span>}
                                                     {res.timePosted && <span className="text-[10px] text-slate-400 flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded ml-2"><Clock className="w-3 h-3 mr-1"/> {res.timePosted}</span>}
                                                </div>
                                                <h4 className="font-bold text-lg dark:text-white truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{res.title}</h4>
                                                <span className="inline-flex items-center text-xs font-bold text-slate-400 mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" /> {res.datePosted}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                 <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded mb-1 shadow-sm ${
                                                     res.type === 'pdf' ? 'bg-red-100 text-red-700' :
                                                     res.type === 'video' ? 'bg-purple-100 text-purple-700' :
                                                     res.type === 'project' ? 'bg-teal-100 text-teal-700' :
                                                     'bg-slate-100 text-slate-600'
                                                 }`}>{res.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 mt-2 leading-relaxed">{res.description}</p>
                                        
                                        {res.fileName && (
                                            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center w-fit mt-2">
                                                <Paperclip className="w-4 h-4 text-slate-400 mr-2" />
                                                <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{res.fileName}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center text-xs text-slate-400">
                                                <Users className="w-3 h-3 mr-1" /> Posted by <span className="font-bold ml-1 text-slate-600 dark:text-slate-300">{res.postedBy}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => {
                                                    setEditingResource(res);
                                                    setShowEditResourceModal(true);
                                                }} className="text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors"><Edit className="w-3 h-3 mr-1"/> Edit</button>
                                                <button onClick={() => handleDeleteResource(res.id)} className="text-red-400 hover:text-red-600 text-xs font-bold flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"><Trash2 className="w-3 h-3 mr-1"/> Delete</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
             )}
        </div>
      </div>
      
      {/* Student Details Modal */}
      {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl animate-scale-up overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 flex justify-between items-start text-white">
                      <div className="flex items-center">
                           <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-2xl font-bold mr-4">
                               {selectedStudent.profilePic ? <img src={selectedStudent.profilePic} className="w-full h-full rounded-full object-cover" /> : selectedStudent.name.charAt(0)}
                           </div>
                           <div>
                               <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                               <p className="opacity-90">{selectedStudent.rollNo}</p>
                           </div>
                      </div>
                      <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Branch</p>
                              <p className="font-bold dark:text-white">{selectedStudent.branch}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Year</p>
                              <p className="font-bold dark:text-white">{selectedStudent.year}</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Attendance</p>
                              <p className={`font-bold ${getStudentAttendancePercentage(selectedStudent.rollNo) < 75 ? 'text-red-500' : 'text-emerald-500'}`}>{getStudentAttendancePercentage(selectedStudent.rollNo)}%</p>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">
                              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Status</p>
                              <p className="font-bold dark:text-white">{selectedStudent.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                          <h4 className="font-bold dark:text-white mb-2">Actions</h4>
                          <div className="flex space-x-2">
                              <button className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">Message</button>
                              <button className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white py-2 rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600">View Full Record</button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubjectModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-96 shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold dark:text-white">Add New Subject</h3>
                      <button onClick={() => setShowAddSubjectModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
                  </div>
                  <form onSubmit={handleAddSubject} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Year</label>
                          <select 
                              className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                              value={newSubject.year}
                              onChange={e => setNewSubject({...newSubject, year: e.target.value})}
                          >
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Subject Name</label>
                          <input 
                              type="text" 
                              className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                              placeholder="e.g. Advanced Java"
                              value={newSubject.name}
                              onChange={e => setNewSubject({...newSubject, name: e.target.value})}
                              autoFocus
                          />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700">Add Subject</button>
                  </form>
              </div>
          </div>
      )}

      {/* Edit Resource Modal */}
      {showEditResourceModal && editingResource && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold dark:text-white flex items-center"><Edit className="mr-2 text-indigo-500 w-5 h-5"/> Edit Resource</h3>
                      <button onClick={() => setShowEditResourceModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
                  </div>
                  <form onSubmit={handleUpdateResource} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Title</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                                value={editingResource.title}
                                onChange={e => setEditingResource({...editingResource, title: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Description</label>
                            <textarea 
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                                rows={3}
                                value={editingResource.description}
                                onChange={e => setEditingResource({...editingResource, description: e.target.value})}
                            ></textarea>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">URL / Link</label>
                             <input 
                                type="text" 
                                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white outline-none"
                                value={editingResource.url || ''}
                                onChange={e => setEditingResource({...editingResource, url: e.target.value})}
                                placeholder="https://"
                             />
                        </div>
                        
                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={() => setShowEditResourceModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors font-bold">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center"><Save className="w-4 h-4 mr-2" /> Update Resource</button>
                        </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};