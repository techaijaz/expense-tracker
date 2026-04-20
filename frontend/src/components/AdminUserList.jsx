import React, { useState, useEffect } from 'react';
import api from '@/utils/httpMethods';
import { 
  Users,
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Calendar, 
  Shield, 
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', { page, search });
      setUsers(response.data?.users || []);
      setTotalPages(response.data?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-accent mb-1">
            <Users size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Population Index</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text">User Matrix</h1>
          <p className="text-text2 text-sm">Monitor and manage access credentials across the neural network.</p>
        </div>
        
        <div className="relative group w-full md:w-96">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-text3 transition-colors group-hover:text-accent">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="Search by identity or contact..."
            className="w-full pl-12 pr-4 py-3 bg-bg2 border border-border/10 rounded-xl focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all text-sm placeholder:text-text3"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card glass-panel !p-0 overflow-hidden relative border border-border/30 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-bg3/50 border-b border-border/10">
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3">Entity / Identity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3">Access Tier</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3">Integrity Status</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3">Initialization</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3">Last Activity</th>
                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-text3 text-center">Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {loading ? (
                <tr>
                   <td colSpan="6" className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="loader-mini !w-8 !h-8 opacity-50"></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text3">Scanning Database...</span>
                      </div>
                   </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Search size={48} className="text-text3 mb-4" />
                      <h3 className="text-lg font-bold">No Entities Found</h3>
                      <p className="text-sm">No users match your current filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-bg4 border border-border/10 flex items-center justify-center overflow-hidden shadow-lg group-hover:border-accent/30 transition-colors">
                          {user.avatar ? (
                            <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="text-accent font-black text-sm">{user.firstName.charAt(0)}</span>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg2 ${user.isVerified ? 'bg-green' : 'bg-amber'}`}></div>
                      </div>
                      <div>
                        <div className="font-bold text-text group-hover:text-accent transition-colors">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-[11px] text-text3 flex items-center gap-1 font-mono uppercase tracking-tight">
                           {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`acc-type-badge !inline-flex ${user.plan === 'pro' ? 'investment' : 'bank'}`}>
                       {user.plan === 'pro' ? <Shield size={12} /> : <UserIcon size={12} />}
                       <span>{user.plan.toUpperCase()} NODE</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`flex items-center gap-2 text-xs font-bold ${user.isVerified ? 'text-green' : 'text-amber opacity-80'}`}>
                      {user.isVerified ? <CheckCircle2 size={14} /> : <Activity size={14} />}
                      <span className="uppercase tracking-wide">{user.isVerified ? 'Verified' : 'Pending'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text2 font-mono">{dayjs(user.createdAt).format('YYYY.MM.DD')}</span>
                      <span className="text-[10px] text-text3 uppercase font-medium tracking-tighter opacity-50">Log Start</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text2 underline decoration-accent/20 underline-offset-4">
                        {user.lastLoginAt ? dayjs(user.lastLoginAt).fromNow() : 'System Origin'}
                      </span>
                      <span className="text-[10px] text-text3 uppercase font-medium tracking-tighter opacity-50">Last Login Event</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button className="icon-btn mx-auto group-hover:scale-110 transition-transform">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Neural Pagination */}
        <div className="px-8 py-5 bg-bg3/30 border-t border-border/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-text3 tracking-widest uppercase">Index:</span>
              <span className="text-xs font-mono font-bold text-accent px-2 py-1 bg-accent/5 border border-accent/20 rounded">
                PAGE {page} OF {totalPages}
              </span>
            </div>
            <div className="h-4 w-px bg-border/20"></div>
            <p className="text-[10px] text-text3 uppercase font-bold tracking-tight">Total Entries: {users.length}</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-outline !py-2 !px-4 hover:bg-bg4 disabled:opacity-20 transition-all active:scale-95"
            >
              <ChevronLeft size={16} />
              <span>Previous Sequence</span>
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-outline !py-2 !px-4 hover:bg-bg4 disabled:opacity-20 transition-all active:scale-95"
            >
              <span>Next Sequence</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer Audit Rail */}
      <div className="flex items-center justify-between px-2 opacity-50">
         <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-text3">
            <ShieldCheck size={14} />
            Classified Data Stream
         </div>
         <div className="text-[10px] font-mono text-text3 uppercase tracking-tighter">
            System Synchronized: {new Date().toLocaleDateString()}
         </div>
      </div>
    </div>
  );
};

export default AdminUserList;

