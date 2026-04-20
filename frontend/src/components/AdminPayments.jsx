import React, { useState, useEffect } from 'react';
import api from '@/utils/httpMethods';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileSearch,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Database,
  ExternalLink,
  Ban
} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/payments/pending');
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (paymentId) => {
    try {
      toast.loading('Verifying transaction...', { id: 'verify-toast' });
      await api.post('/admin/payments/verify', {
        paymentId,
        status: 'verified'
      });
      toast.success('Node Upgraded: License Verified', { id: 'verify-toast' });
      fetchPayments();
    } catch (error) {
      toast.error('Verification failed', { id: 'verify-toast' });
    }
  };

  const handleReject = async () => {
    try {
      toast.loading('Processing rejection...', { id: 'reject-toast' });
      await api.post('/admin/payments/verify', {
        paymentId: selectedPayment._id,
        status: 'rejected',
        rejectionReason
      });
      toast.success('Request Terminated: Access Denied', { id: 'reject-toast' });
      setShowRejectModal(false);
      setSelectedPayment(null);
      setRejectionReason('');
      fetchPayments();
    } catch (error) {
      toast.error('Rejection sequence failed', { id: 'reject-toast' });
    }
  };

  return (
    <div className="page-body space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-amber mb-1">
            <Clock size={18} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Verification Buffer</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-text">Pending Authorizations</h1>
          <p className="text-text2 text-sm max-w-xl">Audit manual license upgrades and verify incoming financial data streams.</p>
        </div>
        
        <div className="px-4 py-2 bg-bg2 border border-border/10 rounded-xl flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-text3">Queue Depth:</span>
           </div>
           <span className="text-sm font-black text-amber font-mono">{payments.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-2xl border border-border/5 bg-bg2/30">
          <div className="loader-mini !w-10 !h-10 mb-4 opacity-50"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text3">Synchronizing Data Stream...</p>
        </div>
      ) : (!payments || payments.length === 0) ? (
        <div className="py-32 text-center glass-panel rounded-3xl border border-dashed border-border flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-green/5 border border-green/10 flex items-center justify-center mb-6">
            <ShieldCheck size={40} className="text-green opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-text mb-2">Protocol Clear</h3>
          <p className="text-text3 text-sm max-w-xs">All manual payment nodes have been resolved. No pending authorizations required.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          {payments && payments.map((payment) => (
            <div key={payment._id} className="card glass-panel !p-0 overflow-hidden flex flex-col group hover:border-accent/40 transition-all shadow-2xl relative">
              <div className="absolute top-0 right-0 p-1">
                <div className="text-[8px] font-black uppercase tracking-widest text-text3 opacity-30 select-none">License Protocol v3.2</div>
              </div>
              
              <div className="p-6 border-b border-border/10 bg-bg3/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-bg4 border border-border/10 flex items-center justify-center text-accent font-black text-lg shadow-inner group-hover:rotate-3 transition-transform">
                    {payment.userId?.firstName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-black text-text text-lg leading-tight tracking-tight">
                      {payment.userId?.firstName || 'Anonymous'} {payment.userId?.lastName || 'Entity'}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-text3 uppercase mt-0.5 tracking-tighter">
                      UID: {payment.userId?._id?.slice(-8) || 'Unknown'} • {payment.userId?.email || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-green font-mono tracking-tighter">
                    <span className="text-xs mr-1 opacity-50">₹</span>
                    {payment.amount}
                  </div>
                  <div className={`acc-type-badge !inline-flex !mt-1 ${payment.period === 'yearly' ? 'investment' : 'purple'}`}>
                    {payment.period.toUpperCase()} NODE
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-bg2/40 p-4 rounded-2xl border border-border/5">
                  <div className="space-y-1.5 font-mono">
                    <div className="text-[10px] font-bold text-text3 uppercase flex items-center gap-1.5 tracking-widest">
                      <Database size={12} />
                      Transaction Hash
                    </div>
                    <div className="bg-bg4/50 px-3 py-2 rounded-lg text-xs font-bold text-accent break-all border border-border/10 group-hover:border-accent/20 transition-all select-all">
                      {payment.transactionId}
                    </div>
                  </div>
                  <div className="space-y-1.5 font-mono">
                    <div className="text-[10px] font-bold text-text3 uppercase flex items-center gap-1.5 tracking-widest">
                      <Activity size={12} />
                      Timestamp
                    </div>
                    <div className="px-1 py-1 rounded-lg text-xs font-bold text-text leading-relaxed">
                      {dayjs(payment.createdAt).format('YYYY.MM.DD • HH:mm:ss')}
                      <div className="text-[9px] text-text3 uppercase mt-0.5 opacity-50 tracking-tighter italic">Source: Manual Verification Handshake</div>
                    </div>
                  </div>
                </div>

                {payment.evidence && (
                  <div className="group/evidence relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/20 to-purple/20 rounded-2xl blur opacity-30 group-hover/evidence:opacity-50 transition-opacity"></div>
                    <div className="relative p-4 bg-bg2/60 border border-border/20 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-glow flex items-center justify-center text-accent">
                          <FileSearch size={22} />
                        </div>
                        <div>
                          <div className="text-xs font-black text-text uppercase tracking-widest leading-none">Evidence Attached</div>
                          <div className="text-[10px] text-text3 mt-1 underline decoration-text3/20 decoration-dashed underline-offset-4 tracking-tighter">Documentation / Transfer proof viewable</div>
                        </div>
                      </div>
                      <a 
                        href={payment.evidence} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-outline !py-2 !px-4 hover:bg-accent hover:text-white hover:border-accent transition-all"
                      >
                        <ExternalLink size={14} className="mr-1.5" />
                        Examine
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-bg3/30 border-t border-border/10 flex gap-3">
                <button 
                  onClick={() => handleVerify(payment._id)}
                  className="flex-[2] btn-primary hover:shadow-[0_0_20px_rgba(91,141,239,0.3)] !m-0 transition-shadow"
                >
                  <CheckCircle2 size={18} />
                  <span>Execute Approval</span>
                </button>
                <button 
                  onClick={() => {
                    setSelectedPayment(payment);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 btn-outline !py-2.5 !m-0 hover:bg-red/10 hover:text-red hover:border-red transition-all"
                >
                  <Ban size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Override Modal (Rejection Modal) */}
      {showRejectModal && (
        <div className="modal-overlay animate-in fade-in duration-300">
          <div className="modal glass-shimmer relative !max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowRejectModal(false)}
              className="modal-close group"
            >
              <XCircle size={18} className="group-hover:rotate-90 transition-transform" />
            </button>
            <div className="flex items-center gap-3 mb-1">
              <Ban className="text-red" size={24} />
               <div>
                  <h3 className="modal-title !mb-0 font-black">Deny License Request</h3>
               </div>
            </div>
            <p className="modal-sub">Specify the policy violation or reason for authorization failure.</p>
            
            <div className="space-y-4">
               <div className="form-group">
                  <label className="form-label">Failure logs / Reason</label>
                  <textarea 
                    className="form-input min-h-[140px] !bg-bg4 !border-dashed resize-none font-mono text-xs leading-relaxed"
                    placeholder="E.g. [INVALID_HASH] Transaction ID not indexed in bank records..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
               </div>
            </div>

            <div className="modal-actions !mt-8">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="btn-cancel font-bold uppercase tracking-widest text-[10px]"
              >
                Sync Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={!rejectionReason}
                className="btn-danger flex items-center justify-center gap-2 !w-auto !px-6 font-bold uppercase tracking-widest text-[10px] disabled:opacity-30 disabled:grayscale transition-all"
              >
                <XCircle size={14} />
                Terminate Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
