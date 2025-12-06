
import React, { useState, useEffect } from 'react';
import { UserProfile, AuditLogEntry } from '../types';
import { 
  Users, UserPlus, Trash2, LogOut, Shield, Search, School, History, Settings, X, Lock, UserX
} from 'lucide-react';

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'faculty' | 'audit'>('overview');
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [faculty, setFaculty] = useState<UserProfile[]>([]);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showManageFacultyModal, setShowManageFacultyModal] = useState<UserProfile | null>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Faculty Form
  const [newFaculty, setNewFaculty] = useState({ name: '', rollNo: '', password: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedUsers = localStorage.getItem('sits_users');
    if (storedUsers) setStudents(Object.values(JSON.parse(storedUsers)));

    const storedFaculty = localStorage.getItem('sits_faculty');
    if (storedFaculty) setFaculty(Object.values(JSON.parse(storedFaculty)));

    const storedLogs = localStorage.getItem('sits_audit_logs');
    if (storedLogs) setLogs(JSON.parse(storedLogs).reverse()); // Newest first
  };

  const logAction = (action: string, target: string, details: string) => {
    const newLog: AuditLogEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString(),
        action,
        actor: 'Admin',
        target,
        details
    };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('sits_audit_logs', JSON.stringify(updatedLogs.reverse())); // Store chronological order
  };

  const handleAddFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaculty.name || !newFaculty.rollNo || !newFaculty.password) return;

    const storedFaculty = localStorage.getItem('sits_faculty');
    const currentFaculty = storedFaculty ? JSON.parse(storedFaculty) : {};
    
    currentFaculty[newFaculty.rollNo] = {
      ...newFaculty,
      role: 'faculty',
      branch: 'CSE-SE',
      isSetupComplete: true,
      profilePic: ''
    };

    localStorage.setItem('sits_faculty', JSON.stringify(currentFaculty));
    logAction('CREATE_FACULTY', newFaculty.rollNo, `Created faculty account for ${newFaculty.name}`);
    
    setFaculty(Object.values(currentFaculty));
    setNewFaculty({ name: '', rollNo: '', password: '' });
    setShowAddFacultyModal(false);
    alert("Faculty created successfully!");
  };

  const deleteStudent = (rollNo: string) => {
    if(confirm(`Are you sure you want to delete student ${rollNo}?`)) {
        const storedUsers = localStorage.getItem('sits_users');
        if (storedUsers) {
            const users = JSON.parse(storedUsers);
            delete users[rollNo];
            localStorage.setItem('sits_users', JSON.stringify(users));
            setStudents(Object.values(users));
            logAction('DELETE_STUDENT', rollNo, 'Deleted student account');
        }
    }
  };

  const updateFaculty = (rollNo: string, updates: Partial<UserProfile>) => {
      const storedFaculty = localStorage.getItem('sits_faculty');
      if (storedFaculty) {
          const facMap = JSON.parse(storedFaculty);
          if (facMap[rollNo]) {
              facMap[rollNo] = { ...facMap[rollNo], ...updates };
              localStorage.setItem('sits_faculty', JSON.stringify(facMap));
              setFaculty(Object.values(facMap));
              logAction('UPDATE_FACULTY', rollNo, `Updated faculty: ${Object.keys(updates).join(', ')}`);
              setShowManageFacultyModal(null);
          }
      }
  };

  const activeStudentsCount = students.filter(s => s.isActive).length;

  const filteredStudents = students.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFaculty = faculty.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 dark:bg-slate-950 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold flex items-center"><Shield className="mr-2" /> Admin Panel</h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setActiveTab('overview')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'overview' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}
            >
                <School className="w-5 h-5 mr-3" /> Overview
            </button>
            <button 
                onClick={() => setActiveTab('students')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'students' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}
            >
                <Users className="w-5 h-5 mr-3" /> Students
            </button>
            <button 
                onClick={() => setActiveTab('faculty')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'faculty' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}
            >
                <UserPlus className="w-5 h-5 mr-3" /> Faculty
            </button>
            <button 
                onClick={() => setActiveTab('audit')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'audit' ? 'bg-indigo-600' : 'hover:bg-slate-700'}`}
            >
                <History className="w-5 h-5 mr-3" /> Audit Logs
            </button>
        </nav>
        <div className="p-4 border-t border-slate-700">
            <button onClick={onLogout} className="w-full flex items-center p-3 text-red-400 hover:bg-slate-700 rounded-lg transition-all hover:translate-x-1 duration-200">
                <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8">
        {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6">
                <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 font-medium mb-2">Total Students</h3>
                        <p className="text-4xl font-bold text-indigo-600">{students.length}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 font-medium mb-2">Active Now</h3>
                        <p className="text-4xl font-bold text-emerald-500">{activeStudentsCount}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="text-slate-500 font-medium mb-2">Total Faculty</h3>
                        <p className="text-4xl font-bold text-orange-500">{faculty.length}</p>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-6">Student Management</h1>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-lg outline-none text-sm w-64 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Year</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredStudents.map(student => (
                                <tr key={student.rollNo} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 font-mono text-sm">{student.rollNo}</td>
                                    <td className="p-4 flex items-center">
                                        {student.profilePic && <img src={student.profilePic} className="w-8 h-8 rounded-full mr-3" />}
                                        {student.name || 'Not Setup'}
                                    </td>
                                    <td className="p-4">{student.year} Year</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${student.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {student.isActive ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => deleteStudent(student.rollNo)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'faculty' && (
            <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Faculty Management</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search faculty..." 
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg outline-none text-sm w-64 border border-slate-200 dark:border-slate-700 dark:text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setShowAddFacultyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Faculty
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">ID / Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Branch</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredFaculty.map(f => (
                                <tr key={f.rollNo}>
                                    <td className="p-4 font-mono">{f.rollNo}</td>
                                    <td className="p-4 font-bold">{f.name}</td>
                                    <td className="p-4">{f.branch}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => setShowManageFacultyModal(f)}
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium text-sm flex items-center"
                                        >
                                            <Settings className="w-4 h-4 mr-1" /> Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'audit' && (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold mb-6">System Audit Logs</h1>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Target</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {logs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="p-4 text-xs font-mono text-slate-500">{log.timestamp}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded font-bold text-xs">{log.action}</span>
                                    </td>
                                    <td className="p-4 text-sm font-mono">{log.target}</td>
                                    <td className="p-4 text-sm">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Add Faculty Modal */}
        {showAddFacultyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96 shadow-2xl animate-scale-up">
                    <h3 className="text-xl font-bold mb-4">Add New Faculty</h3>
                    <form onSubmit={handleAddFaculty} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={newFaculty.name}
                            onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Roll No / ID" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={newFaculty.rollNo}
                            onChange={e => setNewFaculty({...newFaculty, rollNo: e.target.value})}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={newFaculty.password}
                            onChange={e => setNewFaculty({...newFaculty, password: e.target.value})}
                        />
                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={() => setShowAddFacultyModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Manage Faculty Modal */}
        {showManageFacultyModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96 shadow-2xl animate-scale-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Manage Faculty</h3>
                        <button onClick={() => setShowManageFacultyModal(null)}><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    <div className="mb-4">
                        <p className="font-bold text-lg">{showManageFacultyModal.name}</p>
                        <p className="text-slate-500 text-sm">{showManageFacultyModal.rollNo}</p>
                    </div>
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                const newPass = prompt("Enter new password:");
                                if(newPass) updateFaculty(showManageFacultyModal.rollNo, { password: newPass });
                            }}
                            className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
                        >
                            <Lock className="w-4 h-4 mr-2" /> Reset Password
                        </button>
                         <button 
                            onClick={() => {
                                if(confirm("Are you sure?")) updateFaculty(showManageFacultyModal.rollNo, { isActive: false }); // Logic could vary
                            }}
                            className="w-full flex items-center p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40"
                        >
                            <UserX className="w-4 h-4 mr-2" /> Deactivate Account
                        </button>
                    </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
