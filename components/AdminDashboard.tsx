import React, { useState, useEffect } from 'react';
import { UserProfile, AuditLogEntry } from '../types';
import { 
  Users, UserPlus, Trash2, LogOut, Shield, Search, School, History, Settings, X, Lock, UserX, Activity, AlertTriangle, Save, Filter, Key, Power, Unlock, Edit2, Check
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
  
  // Faculty Edit State
  const [editFacultyForm, setEditFacultyForm] = useState({ name: '', branch: '' });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");

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
    
    // Force uppercase for consistency with Login component
    const upperRollNo = newFaculty.rollNo.toUpperCase();

    currentFaculty[upperRollNo] = {
      ...newFaculty,
      rollNo: upperRollNo,
      role: 'faculty',
      branch: 'CSE-SE',
      isSetupComplete: true,
      isActive: true, // Default to active
      profilePic: ''
    };

    localStorage.setItem('sits_faculty', JSON.stringify(currentFaculty));
    logAction('CREATE_FACULTY', upperRollNo, `Created faculty account for ${newFaculty.name}`);
    
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

  const deleteFaculty = (rollNo: string) => {
    if(confirm(`WARNING: Are you sure you want to PERMANENTLY delete faculty ${rollNo}? This action cannot be undone.`)) {
        const storedFaculty = localStorage.getItem('sits_faculty');
        if (storedFaculty) {
            const facMap = JSON.parse(storedFaculty);
            const facName = facMap[rollNo]?.name;
            delete facMap[rollNo];
            localStorage.setItem('sits_faculty', JSON.stringify(facMap));
            setFaculty(Object.values(facMap));
            logAction('DELETE_FACULTY', rollNo, `Deleted faculty account: ${facName}`);
            setShowManageFacultyModal(null);
        }
    }
  };

  const updateFaculty = (rollNo: string, updates: Partial<UserProfile>) => {
      const storedFaculty = localStorage.getItem('sits_faculty');
      if (storedFaculty) {
          const facMap = JSON.parse(storedFaculty);
          if (facMap[rollNo]) {
              // Calculate diffs for audit log
              const oldData = facMap[rollNo];
              const changes: string[] = [];
              Object.keys(updates).forEach(key => {
                  const k = key as keyof UserProfile;
                  if (oldData[k] !== updates[k]) {
                      changes.push(`${key}: '${oldData[k]}' -> '${updates[k]}'`);
                  }
              });

              facMap[rollNo] = { ...facMap[rollNo], ...updates };
              localStorage.setItem('sits_faculty', JSON.stringify(facMap));
              setFaculty(Object.values(facMap));
              
              if (changes.length > 0) {
                  logAction('UPDATE_FACULTY', rollNo, `Updated: ${changes.join(', ')}`);
              }
              
              // Only close modal if it wasn't a specific field update from the manage modal actions
              if(updates.name || updates.branch) {
                  setShowManageFacultyModal(null);
              }
          }
      }
  };

  const handleEditFacultySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(showManageFacultyModal) {
          updateFaculty(showManageFacultyModal.rollNo, {
              name: editFacultyForm.name,
              branch: editFacultyForm.branch
          });
          alert("Faculty details updated.");
      }
  };

  const openManageModal = (f: UserProfile) => {
      setEditFacultyForm({ name: f.name, branch: f.branch });
      setShowManageFacultyModal(f);
  };
  
  const handleResetPassword = (rollNo: string) => {
      const newPass = prompt("Enter new password for this faculty member:");
      if(newPass && newPass.length >= 4) {
          updateFaculty(rollNo, { password: newPass });
          alert("Password updated successfully.");
      } else if (newPass) {
          alert("Password must be at least 4 characters.");
      }
  };

  const toggleFacultyStatus = (f: UserProfile) => {
      const action = f.isActive ? "deactivate" : "activate";
      if(confirm(`Are you sure you want to ${action} ${f.name}?`)) {
          updateFaculty(f.rollNo, { isActive: !f.isActive });
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

  const filteredLogs = logs.filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(auditSearch.toLowerCase()) || 
                            log.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
                            log.actor.toLowerCase().includes(auditSearch.toLowerCase());
      const matchesFilter = auditFilter === 'all' ? true : log.action.includes(auditFilter);
      return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 dark:bg-slate-950 text-white flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-6 border-b border-slate-700 bg-slate-900">
            <h2 className="text-xl font-bold flex items-center text-indigo-400"><Shield className="mr-2" /> Admin Panel</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">System Control</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <button 
                onClick={() => setActiveTab('overview')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'overview' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                <School className="w-5 h-5 mr-3" /> Overview
            </button>
            <button 
                onClick={() => setActiveTab('students')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'students' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                <Users className="w-5 h-5 mr-3" /> Students
            </button>
            <button 
                onClick={() => setActiveTab('faculty')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'faculty' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                <UserPlus className="w-5 h-5 mr-3" /> Faculty
            </button>
            <button 
                onClick={() => setActiveTab('audit')} 
                className={`w-full flex items-center p-3 rounded-lg transition-all hover:translate-x-1 duration-200 ${activeTab === 'audit' ? 'bg-indigo-600 shadow-lg shadow-indigo-900/50' : 'hover:bg-slate-700 text-slate-300'}`}
            >
                <History className="w-5 h-5 mr-3" /> Audit Logs
            </button>
        </nav>
        <div className="p-4 border-t border-slate-700 bg-slate-900">
            <div className="flex items-center mb-4 px-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm mr-2">A</div>
                <div>
                    <p className="text-sm font-bold">Administrator</p>
                    <p className="text-xs text-slate-500">Super User</p>
                </div>
            </div>
            <button onClick={onLogout} className="w-full flex items-center justify-center p-2 text-red-400 hover:bg-red-900/20 border border-red-900/30 rounded-lg transition-all">
                <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        {/* ... (Overview, Students, Audit sections remain same) ... */}
        {activeTab === 'overview' && (
            <div className="bg-slate-800 text-white p-8 pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -translate-y-10 translate-x-10 blur-3xl"></div>
                <div className="relative z-10 animate-slide-up">
                    <h1 className="text-3xl font-bold mb-2">System Dashboard</h1>
                    <p className="text-slate-300">Welcome back, Admin. System is running smoothly.</p>
                </div>
            </div>
        )}

        <div className={`p-8 ${activeTab === 'overview' ? '-mt-10 relative z-20' : ''}`}>
        
        {activeTab === 'overview' && (
            <div className="animate-fade-in space-y-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:-translate-y-1 transition-transform card-hover-effect">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Total Students</h3>
                                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">{students.length}</p>
                            </div>
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full w-3/4"></div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:-translate-y-1 transition-transform card-hover-effect">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Active Now</h3>
                                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">{activeStudentsCount}</p>
                            </div>
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Activity className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${(activeStudentsCount / (students.length || 1)) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:-translate-y-1 transition-transform card-hover-effect">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">Faculty Members</h3>
                                <p className="text-4xl font-bold text-slate-800 dark:text-white mt-1">{faculty.length}</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                <School className="w-6 h-6" />
                            </div>
                        </div>
                         <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full w-1/2"></div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'students' && (
            <div className="animate-fade-in">
                 {/* Student Tab Content */}
                 <div className="flex justify-between items-end mb-6">
                    <h1 className="text-3xl font-bold dark:text-white">Student Management</h1>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between bg-slate-50 dark:bg-slate-900">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search students..." 
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg outline-none text-sm w-64 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Year</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredStudents.map((student, idx) => (
                                <tr key={student.rollNo} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                    <td className="p-4 font-mono text-sm dark:text-slate-300">{student.rollNo}</td>
                                    <td className="p-4 flex items-center dark:text-white">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold mr-3 overflow-hidden">
                                            {student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                        </div>
                                        {student.name || 'Not Setup'}
                                    </td>
                                    <td className="p-4 dark:text-slate-300">{student.year} Year</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${student.isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-900/50 dark:border-slate-800'}`}>
                                            {student.isActive ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => deleteStudent(student.rollNo)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
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
                    <h1 className="text-3xl font-bold dark:text-white">Faculty Management</h1>
                    <div className="flex space-x-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search faculty..." 
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg outline-none text-sm w-64 border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setShowAddFacultyModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center shadow-lg shadow-indigo-200 dark:shadow-none transition-transform hover:scale-105">
                            <UserPlus className="w-4 h-4 mr-2" /> Add Faculty
                        </button>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">ID / Roll No</th>
                                <th className="p-4">Name</th>
                                <th className="p-4">Branch</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredFaculty.map((f, idx) => (
                                <tr key={f.rollNo} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                    <td className="p-4 font-mono dark:text-slate-300">{f.rollNo}</td>
                                    <td className="p-4 font-bold dark:text-white flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold mr-3 text-xs">
                                            {f.name.charAt(0)}
                                        </div>
                                        {f.name}
                                    </td>
                                    <td className="p-4 dark:text-slate-300">{f.branch}</td>
                                    <td className="p-4">
                                         <span className={`px-2 py-1 rounded-full text-xs font-bold border ${f.isActive !== false ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900 dark:text-red-400'}`}>
                                            {f.isActive !== false ? 'Active' : 'Deactivated'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center space-x-2">
                                        <button 
                                            onClick={() => openManageModal(f)}
                                            title="Edit Details"
                                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleResetPassword(f.rollNo)}
                                            title="Reset Password"
                                            className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => toggleFacultyStatus(f)}
                                            title={f.isActive !== false ? "Deactivate Account" : "Activate Account"}
                                            className={`p-2 rounded-lg transition-colors ${f.isActive !== false ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'}`}
                                        >
                                            {f.isActive !== false ? <Power className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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
                {/* Audit Content */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold dark:text-white">System Audit Logs</h1>
                    <div className="flex space-x-2">
                         <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search logs..." 
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 rounded-lg outline-none text-sm w-64 border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                value={auditSearch}
                                onChange={(e) => setAuditSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                             <div className="absolute left-3 top-2.5 pointer-events-none text-slate-400">
                                 <Filter className="w-4 h-4" />
                             </div>
                             <select 
                                value={auditFilter}
                                onChange={(e) => setAuditFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 rounded-lg outline-none text-sm border border-slate-200 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                             >
                                 <option value="all">All Actions</option>
                                 <option value="CREATE">Create</option>
                                 <option value="UPDATE">Update</option>
                                 <option value="DELETE">Delete</option>
                             </select>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Target</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredLogs.map((log, idx) => (
                                <tr key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                    <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{log.timestamp}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded font-bold text-xs border ${
                                            log.action.includes('DELETE') ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/50' :
                                            log.action.includes('CREATE') ? 'bg-green-50 border-green-100 text-green-600 dark:bg-green-900/20 dark:border-green-900/50' :
                                            'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-900/20 dark:border-blue-900/50'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-mono dark:text-slate-300">{log.target}</td>
                                    <td className="p-4 text-sm dark:text-slate-300">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            No logs found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        )}
        </div>

        {/* Add Faculty Modal */}
        {showAddFacultyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-96 shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Add New Faculty</h3>
                    <form onSubmit={handleAddFaculty} className="space-y-4">
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newFaculty.name}
                            onChange={e => setNewFaculty({...newFaculty, name: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Roll No / ID (Auto Uppercase)" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                            value={newFaculty.rollNo}
                            onChange={e => setNewFaculty({...newFaculty, rollNo: e.target.value.toUpperCase()})}
                        />
                        <input 
                            type="password" 
                            placeholder="Password" 
                            required 
                            className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newFaculty.password}
                            onChange={e => setNewFaculty({...newFaculty, password: e.target.value})}
                        />
                        <div className="flex justify-end space-x-2 pt-2">
                            <button type="button" onClick={() => setShowAddFacultyModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Create</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Manage Faculty Modal */}
        {showManageFacultyModal && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                 <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-[450px] shadow-2xl animate-scale-up border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div>
                            <h3 className="text-xl font-bold dark:text-white">Edit Faculty</h3>
                            <p className="text-sm text-slate-500">{showManageFacultyModal.rollNo}</p>
                        </div>
                        <button onClick={() => setShowManageFacultyModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                    </div>
                    
                    <form onSubmit={handleEditFacultySubmit} className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={editFacultyForm.name}
                                onChange={e => setEditFacultyForm({...editFacultyForm, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Branch</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                value={editFacultyForm.branch}
                                onChange={e => setEditFacultyForm({...editFacultyForm, branch: e.target.value})}
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center justify-center">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </button>
                    </form>

                    <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
                         <div className="grid grid-cols-1 gap-3">
                             <button 
                                onClick={() => deleteFaculty(showManageFacultyModal.rollNo)}
                                className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-sm font-medium"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                            </button>
                         </div>
                    </div>
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;