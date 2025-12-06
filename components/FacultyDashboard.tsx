import React, { useState, useEffect } from 'react';
import { UserProfile, Submission, AttendanceRecord, CourseResource, ResourceType } from '../types';
import { 
  Users, LogOut, BookOpen, Search, GraduationCap, Eye, CheckCircle, MessageSquare, X, Save,
  Calendar, Upload, Video, FileText, Image as ImageIcon, Briefcase, Bell, Clock, AlertTriangle
} from 'lucide-react';

interface FacultyDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes' | 'attendance' | 'resources'>('students');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  
  // Modal States
  const [viewStudentSubmissions, setViewStudentSubmissions] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '', isLate: false });

  // Attendance State
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Resource Form State
  const [resourceForm, setResourceForm] = useState<{title: string, desc: string, type: ResourceType, url: string}>({
      title: '', desc: '', type: 'note', url: ''
  });

  useEffect(() => {
    // Load Data
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) setStudents(Object.values(JSON.parse(storedUsers)));

    const storedSubmissions = localStorage.getItem('sits_submissions');
    if (storedSubmissions) setSubmissions(JSON.parse(storedSubmissions));

    const storedAttendance = localStorage.getItem('sits_attendance');
    if (storedAttendance) setAttendanceRecords(JSON.parse(storedAttendance));

    const storedResources = localStorage.getItem('sits_resources');
    if (storedResources) setResources(JSON.parse(storedResources));
  }, []);

  const saveGrade = () => {
      if (!gradingSubmission) return;
      const updatedSubmissions = submissions.map(sub => {
          if (sub.id === gradingSubmission.id) {
              const newStatus: 'graded' | 'late' = gradeForm.isLate ? 'late' : 'graded';
              return { 
                  ...sub, 
                  grade: gradeForm.grade, 
                  feedback: gradeForm.feedback, 
                  status: newStatus 
              };
          }
          return sub;
      });
      setSubmissions(updatedSubmissions);
      localStorage.setItem('sits_submissions', JSON.stringify(updatedSubmissions));
      setGradingSubmission(null);
      alert("Grade saved!");
  };

  const markAttendance = (rollNo: string, status: 'present' | 'absent') => {
      const existingRecordIndex = attendanceRecords.findIndex(r => r.rollNo === rollNo && r.date === attendanceDate);
      let newRecords = [...attendanceRecords];

      if (existingRecordIndex > -1) {
          newRecords[existingRecordIndex].status = status;
      } else {
          newRecords.push({ date: attendanceDate, rollNo, status });
      }

      setAttendanceRecords(newRecords);
      localStorage.setItem('sits_attendance', JSON.stringify(newRecords));
  };

  const postResource = (e: React.FormEvent) => {
      e.preventDefault();
      const newResource: CourseResource = {
          id: Date.now().toString(),
          title: resourceForm.title,
          description: resourceForm.desc,
          type: resourceForm.type,
          url: resourceForm.url,
          datePosted: new Date().toLocaleDateString(),
          postedBy: user.name
      };
      
      const updatedResources = [newResource, ...resources];
      setResources(updatedResources);
      localStorage.setItem('sits_resources', JSON.stringify(updatedResources));
      setResourceForm({ title: '', desc: '', type: 'note', url: '' });
      alert("Resource posted successfully!");
  };

  const getAttendanceStatus = (rollNo: string) => {
      const record = attendanceRecords.find(r => r.rollNo === rollNo && r.date === attendanceDate);
      return record ? record.status : null;
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed h-full z-20 transition-colors duration-200 shadow-xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-sits-600 dark:bg-slate-950 text-white">
            <h2 className="text-xl font-bold flex items-center"><GraduationCap className="mr-2" /> Faculty Portal</h2>
            <p className="text-xs text-sits-100 mt-1 uppercase tracking-wider">Instructor Mode</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {[
                { id: 'students', icon: Users, label: 'Students' },
                { id: 'classes', icon: BookOpen, label: 'Assignments' },
                { id: 'attendance', icon: Calendar, label: 'Attendance' },
                { id: 'resources', icon: Upload, label: 'Post Resources' },
            ].map((item) => (
                <button 
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)} 
                    className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === item.id ? 'bg-sits-100 text-sits-700 dark:bg-sits-900 dark:text-sits-300 shadow-sm' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    <item.icon className="w-5 h-5 mr-3" /> {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
             <div className="flex items-center mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-sits-500 flex items-center justify-center font-bold text-sm mr-2 text-white">{user.name.charAt(0)}</div>
                <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.rollNo}</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg transition-all hover:translate-x-1 duration-200">
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto h-screen">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-slate-800 dark:to-slate-900 text-white p-8 pb-12 relative overflow-hidden">
             <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-y-1/2 translate-x-1/4 blur-3xl"></div>
             <div className="relative z-10 animate-slide-up">
                <h1 className="text-3xl font-bold mb-2">Classroom Overview</h1>
                <p className="text-purple-100">Manage your students, grades, and materials efficiently.</p>
             </div>
        </div>

        <div className="p-8 -mt-8 relative z-20">
        
        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
            <div className="animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h2 className="text-xl font-bold dark:text-white">Student Directory</h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search students..." className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg outline-none text-sm w-64 border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Year</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {students.filter(s => s.role === 'student').map(student => (
                                <tr key={student.rollNo} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 font-mono text-sm dark:text-slate-300">{student.rollNo}</td>
                                    <td className="p-4 flex items-center dark:text-white">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 mr-3 flex items-center justify-center overflow-hidden text-xs font-bold">
                                            {student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                        </div>
                                        {student.name || 'Not Setup'}
                                    </td>
                                    <td className="p-4 dark:text-slate-300">{student.year} Year</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setViewStudentSubmissions(student.rollNo)}
                                            className="text-sits-600 hover:text-sits-800 dark:text-sits-400 dark:hover:text-sits-300 text-sm font-medium flex items-center px-3 py-1 bg-sits-50 dark:bg-sits-900/20 rounded hover:bg-sits-100 dark:hover:bg-sits-900/40 transition-colors"
                                        >
                                            <Eye className="w-4 h-4 mr-1" /> View Work
                                        </button>
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
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center">
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full mr-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase">Pending Grading</h3>
                            <p className="text-3xl font-bold dark:text-white">{pendingSubmissions.length}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700 flex items-center">
                        <div className="p-4 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full mr-4">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase">Total Submissions</h3>
                            <p className="text-3xl font-bold dark:text-white">{submissions.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-bold text-xl dark:text-white">Recent Submissions</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Assignment</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {submissions.map(sub => (
                                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <span className="block font-bold text-sm dark:text-white">{sub.studentName}</span>
                                        <span className="text-xs text-slate-500 font-mono">{sub.studentRoll}</span>
                                    </td>
                                    <td className="p-4 text-sm dark:text-slate-300">{sub.assignmentTitle}</td>
                                    <td className="p-4 text-sm dark:text-slate-300">{sub.submittedDate}</td>
                                    <td className="p-4">
                                        {sub.status === 'graded' ? (
                                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full font-bold flex w-fit items-center"><CheckCircle className="w-3 h-3 mr-1" /> Graded</span>
                                        ) : sub.status === 'late' ? (
                                            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full font-bold flex w-fit items-center"><AlertTriangle className="w-3 h-3 mr-1" /> Late</span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-1 rounded-full font-bold">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => { setGradingSubmission(sub); setGradeForm({ grade: sub.grade || '', feedback: sub.feedback || '', isLate: sub.status === 'late' }); }}
                                            className="text-sits-600 hover:text-sits-800 dark:text-sits-400 dark:hover:text-sits-300 text-sm font-medium flex items-center px-3 py-1 hover:bg-sits-50 dark:hover:bg-sits-900/20 rounded transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-1" /> {sub.status === 'pending' ? 'Grade Now' : 'Edit Grade'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
            <div className="animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <div className="mb-4 md:mb-0">
                            <h2 className="text-xl font-bold dark:text-white">Daily Attendance</h2>
                            <p className="text-sm text-slate-500">Mark students present or absent for today.</p>
                        </div>
                        <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 p-2 rounded-lg border dark:border-slate-600">
                             <Calendar className="w-5 h-5 text-slate-400" />
                             <input 
                                type="date" 
                                value={attendanceDate} 
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="border-none bg-transparent outline-none text-sm font-bold dark:text-white"
                             />
                        </div>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-end space-x-4 text-sm font-bold">
                         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2 shadow-sm"></span> Present</div>
                         <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm"></span> Absent</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                        {students.filter(s => s.role === 'student').map(student => {
                            const status = getAttendanceStatus(student.rollNo);
                            return (
                                <div key={student.rollNo} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-md transition-all bg-white dark:bg-slate-800">
                                    <div className="flex items-center">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mr-3 transition-colors ${status === 'present' ? 'bg-green-500' : status === 'absent' ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            {student.name.charAt(0)}
                                         </div>
                                         <div>
                                             <p className="font-bold text-sm dark:text-white">{student.name}</p>
                                             <p className="text-xs text-slate-500 font-mono">{student.rollNo}</p>
                                         </div>
                                    </div>
                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={() => markAttendance(student.rollNo, 'present')}
                                            className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300'}`}
                                            title="Mark Present"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => markAttendance(student.rollNo, 'absent')}
                                            className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300'}`}
                                            title="Mark Absent"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* RESOURCES TAB */}
        {activeTab === 'resources' && (
            <div className="animate-fade-in">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 sticky top-6">
                            <h3 className="font-bold text-lg mb-4 dark:text-white">Create New Post</h3>
                            <form onSubmit={postResource} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Title</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                                        placeholder="e.g. Unit 1 Notes"
                                        value={resourceForm.title}
                                        onChange={e => setResourceForm({...resourceForm, title: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Type</label>
                                    <select 
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={resourceForm.type}
                                        onChange={e => setResourceForm({...resourceForm, type: e.target.value as ResourceType})}
                                    >
                                        <option value="note">Notes / PDF</option>
                                        <option value="video">Video Recording</option>
                                        <option value="assignment">Assignment</option>
                                        <option value="event">Event</option>
                                        <option value="project">Project</option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Link / URL</label>
                                    <input 
                                        type="text" 
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                                        placeholder="https://..."
                                        value={resourceForm.url}
                                        onChange={e => setResourceForm({...resourceForm, url: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 dark:text-slate-300">Description</label>
                                    <textarea 
                                        className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" 
                                        rows={3}
                                        value={resourceForm.desc}
                                        onChange={e => setResourceForm({...resourceForm, desc: e.target.value})}
                                    ></textarea>
                                </div>
                                <button className="w-full bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none">
                                    Post to Class
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-lg dark:text-white">Posted Resources</h3>
                        {resources.length === 0 ? (
                            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500 italic">No resources posted yet.</p>
                            </div>
                        ) : (
                            resources.map(res => (
                                <div key={res.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start hover:-translate-y-1 transition-transform">
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
                                        {res.url && <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sits-600 text-sm hover:underline font-medium">View Resource</a>}
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const newRes = resources.filter(r => r.id !== res.id);
                                            setResources(newRes);
                                            localStorage.setItem('sits_resources', JSON.stringify(newRes));
                                        }} 
                                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* View Student Submissions Modal */}
        {viewStudentSubmissions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[600px] shadow-2xl animate-scale-up max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold dark:text-white">Submissions: {viewStudentSubmissions}</h3>
                        <button onClick={() => setViewStudentSubmissions(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="space-y-4">
                        {submissions.filter(s => s.studentRoll === viewStudentSubmissions).length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No assignments submitted yet.</p>
                        ) : (
                            submissions.filter(s => s.studentRoll === viewStudentSubmissions).map(sub => (
                                <div key={sub.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <h4 className="font-bold dark:text-white">{sub.assignmentTitle}</h4>
                                    <p className="text-sm text-slate-500 mb-2">Submitted on {sub.submittedDate}</p>
                                    {sub.fileName && <p className="text-xs bg-white dark:bg-slate-800 border dark:border-slate-600 p-2 rounded mb-2 inline-block">📎 {sub.fileName}</p>}
                                    {sub.status === 'graded' ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2 border border-green-100 dark:border-green-900/50">
                                            <p className="text-sm font-bold text-green-700 dark:text-green-400">Grade: {sub.grade}</p>
                                            <p className="text-xs text-green-600 dark:text-green-300 mt-1">"{sub.feedback}"</p>
                                        </div>
                                    ) : sub.status === 'late' ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded mt-2 border border-red-100 dark:border-red-900/50">
                                             <p className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> Late Submission</p>
                                             {sub.grade && <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">Grade: {sub.grade}</p>}
                                             <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">"{sub.feedback}"</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded border border-yellow-200 mt-2 inline-block">Pending Grade</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                 </div>
            </div>
        )}

        {/* Grading Modal */}
        {gradingSubmission && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[500px] shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold dark:text-white">Grade Assignment</h3>
                        <button onClick={() => setGradingSubmission(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-100 dark:border-slate-700">
                        <p className="font-bold dark:text-white">{gradingSubmission.assignmentTitle}</p>
                        <p className="text-sm text-slate-500">Student: {gradingSubmission.studentName}</p>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 italic">"{gradingSubmission.description}"</p>
                        {gradingSubmission.fileName && <p className="mt-2 text-xs text-indigo-500">📎 {gradingSubmission.fileName}</p>}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-slate-300">Grade / Score</label>
                            <input 
                                type="text" 
                                value={gradeForm.grade}
                                onChange={e => setGradeForm({...gradeForm, grade: e.target.value})}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="e.g., A, 90/100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1 dark:text-slate-300">Feedback</label>
                            <textarea 
                                value={gradeForm.feedback}
                                onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                                className="w-full p-2 border rounded h-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Enter comments..."
                            />
                        </div>
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="isLate"
                                checked={gradeForm.isLate}
                                onChange={e => setGradeForm({...gradeForm, isLate: e.target.checked})}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label htmlFor="isLate" className="ml-2 text-sm font-bold text-slate-700 dark:text-slate-300">Mark as Late Submission</label>
                        </div>
                        <button onClick={saveGrade} className="w-full bg-sits-600 text-white py-2 rounded font-bold hover:bg-sits-700 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-none transition-transform hover:scale-[1.02]">
                            <Save className="w-4 h-4 mr-2" /> Save Result
                        </button>
                    </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;