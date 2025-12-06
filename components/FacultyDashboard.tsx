
import React, { useState, useEffect } from 'react';
import { UserProfile, Submission } from '../types';
import { 
  Users, LogOut, BookOpen, Search, GraduationCap, Eye, CheckCircle, MessageSquare, X, Save
} from 'lucide-react';

interface FacultyDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  
  // Modal States
  const [viewStudentSubmissions, setViewStudentSubmissions] = useState<string | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });

  useEffect(() => {
    // Load Data
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) {
      setStudents(Object.values(JSON.parse(storedUsers)));
    }
    const storedSubmissions = localStorage.getItem('sits_submissions');
    if (storedSubmissions) {
        setSubmissions(JSON.parse(storedSubmissions));
    }
  }, []);

  const saveGrade = () => {
      if (!gradingSubmission) return;
      const updatedSubmissions = submissions.map(sub => {
          if (sub.id === gradingSubmission.id) {
              return { ...sub, grade: gradeForm.grade, feedback: gradeForm.feedback, status: 'graded' as const };
          }
          return sub;
      });
      setSubmissions(updatedSubmissions);
      localStorage.setItem('sits_submissions', JSON.stringify(updatedSubmissions));
      setGradingSubmission(null);
      alert("Grade saved!");
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold flex items-center text-sits-600"><GraduationCap className="mr-2" /> Faculty Portal</h2>
            <p className="text-sm text-slate-500 mt-1">Welcome, {user.name}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setActiveTab('students')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'students' ? 'bg-sits-100 text-sits-700 dark:bg-sits-900 dark:text-sits-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
                <Users className="w-5 h-5 mr-3" /> Students
            </button>
            <button 
                onClick={() => setActiveTab('classes')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'classes' ? 'bg-sits-100 text-sits-700 dark:bg-sits-900 dark:text-sits-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
                <BookOpen className="w-5 h-5 mr-3" /> My Classes
            </button>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button onClick={onLogout} className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all hover:translate-x-1 duration-200">
                <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {activeTab === 'students' && (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-6">Student List</h1>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Search students..." className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg outline-none text-sm w-64 dark:text-white" />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Year</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {students.map(student => (
                                <tr key={student.rollNo} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 font-mono text-sm">{student.rollNo}</td>
                                    <td className="p-4 flex items-center">
                                        {student.profilePic && <img src={student.profilePic} className="w-8 h-8 rounded-full mr-3" />}
                                        {student.name || 'Not Setup'}
                                    </td>
                                    <td className="p-4">{student.year} Year</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setViewStudentSubmissions(student.rollNo)}
                                            className="text-sits-600 hover:text-sits-800 text-sm font-medium flex items-center"
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

        {activeTab === 'classes' && (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-6">Class Assignment Management</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
                        <h3 className="text-slate-500 font-medium">Pending Grading</h3>
                        <p className="text-3xl font-bold">{pendingSubmissions.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                        <h3 className="text-slate-500 font-medium">Total Submissions</h3>
                        <p className="text-3xl font-bold">{submissions.length}</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold">Recent Submissions</h3>
                     </div>
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
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
                                <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4">
                                        <span className="block font-bold text-sm">{sub.studentName}</span>
                                        <span className="text-xs text-slate-500 font-mono">{sub.studentRoll}</span>
                                    </td>
                                    <td className="p-4 text-sm">{sub.assignmentTitle}</td>
                                    <td className="p-4 text-sm">{sub.submittedDate}</td>
                                    <td className="p-4">
                                        {sub.status === 'graded' ? (
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold flex w-fit items-center"><CheckCircle className="w-3 h-3 mr-1" /> Graded</span>
                                        ) : (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => { setGradingSubmission(sub); setGradeForm({ grade: sub.grade || '', feedback: sub.feedback || '' }); }}
                                            className="text-sits-600 hover:text-sits-800 text-sm font-medium flex items-center"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-1" /> {sub.status === 'graded' ? 'Edit Grade' : 'Grade Now'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                </div>
            </div>
        )}

        {/* View Student Submissions Modal */}
        {viewStudentSubmissions && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[600px] shadow-2xl animate-scale-up max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Submissions: {viewStudentSubmissions}</h3>
                        <button onClick={() => setViewStudentSubmissions(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="space-y-4">
                        {submissions.filter(s => s.studentRoll === viewStudentSubmissions).length === 0 ? (
                            <p className="text-slate-500 text-center py-4">No assignments submitted yet.</p>
                        ) : (
                            submissions.filter(s => s.studentRoll === viewStudentSubmissions).map(sub => (
                                <div key={sub.id} className="border border-slate-200 dark:border-slate-700 p-4 rounded-lg">
                                    <h4 className="font-bold">{sub.assignmentTitle}</h4>
                                    <p className="text-sm text-slate-500 mb-2">Submitted on {sub.submittedDate}</p>
                                    {sub.fileName && <p className="text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded mb-2">📎 {sub.fileName}</p>}
                                    {sub.status === 'graded' ? (
                                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
                                            <p className="text-sm font-bold text-green-700 dark:text-green-400">Grade: {sub.grade}</p>
                                            <p className="text-xs text-green-600 dark:text-green-300 mt-1">"{sub.feedback}"</p>
                                        </div>
                                    ) : (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Pending Grade</span>
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
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[500px] shadow-2xl animate-scale-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Grade Assignment</h3>
                        <button onClick={() => setGradingSubmission(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded">
                        <p className="font-bold">{gradingSubmission.assignmentTitle}</p>
                        <p className="text-sm text-slate-500">Student: {gradingSubmission.studentName}</p>
                        <p className="mt-2 text-sm">{gradingSubmission.description}</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">Grade / Score</label>
                            <input 
                                type="text" 
                                value={gradeForm.grade}
                                onChange={e => setGradeForm({...gradeForm, grade: e.target.value})}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="e.g., A, 90/100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Feedback</label>
                            <textarea 
                                value={gradeForm.feedback}
                                onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})}
                                className="w-full p-2 border rounded h-24 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="Enter comments..."
                            />
                        </div>
                        <button onClick={saveGrade} className="w-full bg-sits-600 text-white py-2 rounded font-bold hover:bg-sits-700 flex items-center justify-center">
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
