import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Ban, Unlock, Clock, Shield, Trash2, Users, AlertTriangle } from 'lucide-react';
import { db, collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from '../firebase';

const formatDate = (ts) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function PengurusAccountManager({ onClose }) {
    const [users, setUsers] = useState([]);
    const [activeSection, setActiveSection] = useState('pending');
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'pengurusUsers'), orderBy('requestedAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const pending = users.filter(u => u.status === 'pending');
    const approved = users.filter(u => u.status === 'approved');
    const blocked = users.filter(u => u.status === 'blocked');

    const handleApprove = async (userId) => {
        await updateDoc(doc(db, 'pengurusUsers', userId), {
            status: 'approved',
            approvedAt: serverTimestamp()
        });
        setConfirmAction(null);
    };

    const handleBlock = async (userId) => {
        await updateDoc(doc(db, 'pengurusUsers', userId), {
            status: 'blocked',
            blockedAt: serverTimestamp()
        });
        setConfirmAction(null);
    };

    const handleUnblock = async (userId) => {
        await updateDoc(doc(db, 'pengurusUsers', userId), {
            status: 'approved',
            approvedAt: serverTimestamp(),
            blockedAt: null
        });
        setConfirmAction(null);
    };

    const handleDelete = async (userId) => {
        await deleteDoc(doc(db, 'pengurusUsers', userId));
        setConfirmAction(null);
    };

    const sections = [
        { key: 'pending', label: 'Menunggu', icon: Clock, count: pending.length, color: 'bg-amber-500', data: pending },
        { key: 'approved', label: 'Aktif', icon: UserCheck, count: approved.length, color: 'bg-emerald-500', data: approved },
        { key: 'blocked', label: 'Diblokir', icon: Ban, count: blocked.length, color: 'bg-red-500', data: blocked },
    ];

    const activeData = sections.find(s => s.key === activeSection);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white border-4 border-black pop-shadow w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-emerald-500 border-b-4 border-black px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 border-2 border-black">
                            <Users size={22} strokeWidth={3} className="text-emerald-600" />
                        </div>
                        <h2 className="font-black uppercase tracking-widest text-white text-lg">Kelola Akun</h2>
                    </div>
                    <button onClick={onClose} className="bg-white text-black font-black px-3 py-1 border-2 border-black hover:bg-red-500 hover:text-white transition-colors">✕</button>
                </div>

                {/* Section Tabs */}
                <div className="flex border-b-4 border-black">
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`flex-1 py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 border-r-2 last:border-r-0 border-black transition-all ${activeSection === s.key ? `${s.color} text-white` : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                        >
                            <s.icon size={14} strokeWidth={3} />
                            {s.label}
                            {s.count > 0 && (
                                <span className={`${activeSection === s.key ? 'bg-white text-black' : 'bg-slate-200 text-slate-600'} px-1.5 py-0.5 text-[10px] font-black`}>
                                    {s.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {activeData?.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <activeData.icon size={48} className="text-slate-200 mx-auto mb-4" strokeWidth={2} />
                            <p className="font-black text-slate-300 uppercase tracking-widest text-sm">
                                {activeSection === 'pending' ? 'Tidak ada permintaan' : activeSection === 'approved' ? 'Belum ada akun aktif' : 'Tidak ada akun diblokir'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y-2 divide-slate-100">
                            {activeData?.data.map(user => (
                                <div key={user.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 bg-emerald-100 border-2 border-black flex items-center justify-center shrink-0 overflow-hidden">
                                            {user.photoURL ? (
                                                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-black text-emerald-600 text-lg">{(user.email || '?')[0].toUpperCase()}</span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-sm truncate">{user.displayName || user.email}</p>
                                            <p className="text-xs text-slate-400 font-bold truncate">{user.email}</p>
                                            <p className="text-[10px] text-slate-300 font-bold mt-0.5">
                                                {activeSection === 'pending' && `Permintaan: ${formatDate(user.requestedAt)}`}
                                                {activeSection === 'approved' && `Disetujui: ${formatDate(user.approvedAt)}`}
                                                {activeSection === 'blocked' && `Diblokir: ${formatDate(user.blockedAt)}`}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0">
                                            {activeSection === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'approve', user })}
                                                        className="bg-emerald-500 text-white p-2 border-2 border-black hover:bg-emerald-600 transition-colors pop-shadow-sm"
                                                        title="Setujui"
                                                    >
                                                        <UserCheck size={16} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'block', user })}
                                                        className="bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600 transition-colors pop-shadow-sm"
                                                        title="Blokir"
                                                    >
                                                        <Ban size={16} strokeWidth={3} />
                                                    </button>
                                                </>
                                            )}
                                            {activeSection === 'approved' && (
                                                <>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'delete', user })}
                                                        className="bg-amber-500 text-white p-2 border-2 border-black hover:bg-amber-600 transition-colors pop-shadow-sm"
                                                        title="Hapus (perlu approval ulang)"
                                                    >
                                                        <Trash2 size={16} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'block', user })}
                                                        className="bg-red-500 text-white p-2 border-2 border-black hover:bg-red-600 transition-colors pop-shadow-sm"
                                                        title="Blokir"
                                                    >
                                                        <Ban size={16} strokeWidth={3} />
                                                    </button>
                                                </>
                                            )}
                                            {activeSection === 'blocked' && (
                                                <button
                                                    onClick={() => setConfirmAction({ type: 'unblock', user })}
                                                    className="bg-emerald-500 text-white p-2 border-2 border-black hover:bg-emerald-600 transition-colors pop-shadow-sm"
                                                    title="Buka Blokir"
                                                >
                                                    <Unlock size={16} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            {confirmAction && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
                    <div className="bg-white border-4 border-black pop-shadow p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`p-2 border-2 border-black ${confirmAction.type === 'approve' ? 'bg-emerald-500' : confirmAction.type === 'unblock' ? 'bg-emerald-500' : confirmAction.type === 'delete' ? 'bg-amber-500' : 'bg-red-500'}`}>
                                <AlertTriangle size={20} strokeWidth={3} className="text-white" />
                            </div>
                            <h3 className="font-black uppercase tracking-widest text-sm">
                                {confirmAction.type === 'approve' && 'Setujui Akun?'}
                                {confirmAction.type === 'block' && 'Blokir Akun?'}
                                {confirmAction.type === 'unblock' && 'Buka Blokir?'}
                                {confirmAction.type === 'delete' && 'Hapus Akun?'}
                            </h3>
                        </div>
                        <p className="text-sm mb-2 font-bold">{confirmAction.user.email}</p>
                        <p className="text-xs text-slate-400 mb-6">
                            {confirmAction.type === 'approve' && 'Akun ini akan bisa mengakses Dashboard Pengurus.'}
                            {confirmAction.type === 'block' && 'Akun ini tidak akan bisa masuk lagi.'}
                            {confirmAction.type === 'unblock' && 'Akun ini akan bisa mengakses Dashboard Pengurus kembali.'}
                            {confirmAction.type === 'delete' && 'Akun akan dihapus dan harus meminta persetujuan lagi jika ingin masuk.'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction(null)}
                                className="flex-1 bg-white text-black font-black uppercase tracking-widest text-xs py-3 border-2 border-black hover:bg-slate-100 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    if (confirmAction.type === 'approve') handleApprove(confirmAction.user.id);
                                    else if (confirmAction.type === 'block') handleBlock(confirmAction.user.id);
                                    else if (confirmAction.type === 'unblock') handleUnblock(confirmAction.user.id);
                                    else if (confirmAction.type === 'delete') handleDelete(confirmAction.user.id);
                                }}
                                className={`flex-1 text-white font-black uppercase tracking-widest text-xs py-3 border-2 border-black transition-colors ${confirmAction.type === 'approve' || confirmAction.type === 'unblock' ? 'bg-emerald-500 hover:bg-emerald-600' : confirmAction.type === 'delete' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
                            >
                                {confirmAction.type === 'approve' && 'Setujui'}
                                {confirmAction.type === 'block' && 'Blokir'}
                                {confirmAction.type === 'unblock' && 'Buka Blokir'}
                                {confirmAction.type === 'delete' && 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
