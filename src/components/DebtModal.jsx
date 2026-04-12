import React, { useState } from 'react';
import { X, Plus, Calendar, FileText, CheckCircle2, DollarSign, HandCoins, Users } from 'lucide-react';
import { db, doc, updateDoc, addDoc, collection } from '../firebase';
import { formatRupiah } from '../utils';

export default function DebtModal({ isOpen, onClose, addTransaction, debts = [] }) {
    const [activeTab, setActiveTab] = useState('utang'); // 'utang' | 'piutang'
    const [showAddForm, setShowAddForm] = useState(false);
    const [formState, setFormState] = useState({
        personName: '',
        amount: '',
        notes: '',
        date: new Date().toISOString().split('T')[0]
    });

    const [payModal, setPayModal] = useState(null); // stores the debt object being paid
    const [payAmount, setPayAmount] = useState('');

    if (!isOpen) return null;

    // Type definition:
    // 'utang': User owes money to someone.
    // 'piutang': Someone owes money to the user.
    const filteredDebts = debts.filter(d => d.type === activeTab && d.status === 'active');

    const handleAmountChange = (e, setter, stateField = null) => {
        let value = e.target.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('id-ID');
        }
        if (setter && !stateField) {
            setter(value);
        } else if (setter && stateField) {
            setter(prev => ({ ...prev, [stateField]: value }));
        }
    };

    const handleAddDebt = async (e) => {
        e.preventDefault();
        const rawAmount = parseInt(formState.amount.replace(/\./g, ''), 10);
        if (!rawAmount || !formState.personName) return;

        try {
            const newDebt = {
                type: activeTab,
                personName: formState.personName,
                amount: rawAmount,
                remaining: rawAmount,
                notes: formState.notes,
                date: formState.date,
                status: 'active',
                paymentHistory: [],
                createdAt: Date.now()
            };

            await addDoc(collection(db, 'globalDebts'), newDebt);

            // Add corresponding transaction to 'Pribadi' wallet
            if (activeTab === 'utang') {
                // Pinjam Uang (Uang Masuk ke Pribadi)
                addTransaction({
                    text: `Pinjaman dari ${formState.personName}`,
                    amount: rawAmount,
                    type: 'income',
                    wallet: 'pribadi', // Hardcode ke dompet pribadi untuk saat ini
                    category: 'Utang PIutang',
                    subCategory: 'Terima Pinjaman',
                    date: formState.date
                });
            } else {
                // Kasih Pinjam (Uang Keluar dari Pribadi)
                addTransaction({
                    text: `Beri pinjaman ke ${formState.personName}`,
                    amount: rawAmount,
                    type: 'expense',
                    wallet: 'pribadi',
                    category: 'Utang Piutang',
                    subCategory: 'Beri Pinjaman',
                    date: formState.date
                });
            }

            setShowAddForm(false);
            setFormState({ personName: '', amount: '', notes: '', date: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error('Error adding debt:', error);
            alert('Gagal menyimpan data!');
        }
    };

    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (!payModal) return;
        
        const rawAmount = parseInt(payAmount.replace(/\./g, ''), 10);
        if (!rawAmount || rawAmount <= 0) return;

        // Ensure we don't overpay
        const actualPayment = Math.min(rawAmount, payModal.remaining);

        try {
            const debtRef = doc(db, 'globalDebts', payModal.id);
            const newRemaining = Math.max(0, payModal.remaining - actualPayment);
            const newStatus = newRemaining === 0 ? 'lunas' : 'active';
            
            const paymentObj = {
                date: new Date().toISOString().split('T')[0],
                amount: actualPayment,
                timestamp: Date.now()
            };

            await updateDoc(debtRef, {
                remaining: newRemaining,
                status: newStatus,
                paymentHistory: [...(payModal.paymentHistory || []), paymentObj]
            });

            // Add transaction to main wallet
            if (payModal.type === 'utang') {
                // Bayar Utang (Uang Keluar)
                addTransaction({
                    text: `Bayar utang ke ${payModal.personName}`,
                    amount: actualPayment,
                    type: 'expense',
                    wallet: 'pribadi',
                    category: 'Utang Piutang',
                    subCategory: 'Bayar Utang',
                    date: paymentObj.date
                });
            } else {
                // Terima Cicilan (Uang Masuk)
                addTransaction({
                    text: `Terima cicilan dari ${payModal.personName}`,
                    amount: actualPayment,
                    type: 'income',
                    wallet: 'pribadi',
                    category: 'Utang Piutang',
                    subCategory: 'Terima Cicilan',
                    date: paymentObj.date
                });
            }

            setPayModal(null);
            setPayAmount('');
        } catch (error) {
            console.error('Error paying debt:', error);
            alert('Gagal memproses pembayaran!');
        }
    };

    const totalActive = filteredDebts.reduce((acc, curr) => acc + curr.remaining, 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#f4f4f0] w-full max-w-2xl rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-[#bc95d4] p-4 border-b-4 border-black flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <HandCoins className="w-6 h-6" />
                        </div>
                        <h2 className="font-black text-xl md:text-2xl uppercase tracking-tighter">Catatan<br className="md:hidden" /> Utang & Piutang</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-black/10 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b-4 border-black font-black uppercase text-xs sm:text-sm tracking-tighter divide-x-4 divide-black">
                    <button
                        className={`flex-1 py-4 text-center transition-colors px-2 ${activeTab === 'utang' ? 'bg-[#ff90e8] border-b-4 border-black -mb-1' : 'bg-gray-100'}`}
                        onClick={() => setActiveTab('utang')}
                    >
                        Utang Saya <br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-black/70">(Bayar Nanti)</span>
                    </button>
                    <button
                        className={`flex-1 py-4 text-center transition-colors px-2 ${activeTab === 'piutang' ? 'bg-[#ff90e8] border-b-4 border-black -mb-1' : 'bg-gray-100'}`}
                        onClick={() => setActiveTab('piutang')}
                    >
                        Piutang Orang <br className="sm:hidden"/><span className="text-[10px] sm:text-xs text-black/70">(Uang Di Luar)</span>
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 bg-[url('/grid.svg')]">
                    
                    {/* Summary Card */}
                    <div className="bg-white p-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
                        <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-500 mb-1">Total {activeTab === 'utang' ? 'Utang Aktif' : 'Piutang Aktif'}</p>
                        <p className="text-4xl font-black tracking-tighter">{formatRupiah(totalActive)}</p>
                    </div>

                    {/* Action Button */}
                    {!showAddForm && !payModal && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full mb-6 bg-[#ffd800] p-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-[#ffed4a] transition-all font-black uppercase tracking-widest text-lg flex items-center justify-center gap-2"
                        >
                            <Plus className="w-6 h-6 border-2 border-black rounded-full p-0.5 bg-white" />
                            Catat {activeTab === 'utang' ? 'Utang' : 'Piutang'} Baru
                        </button>
                    )}

                    {/* Add Form */}
                    {showAddForm && (
                        <div className="bg-white p-5 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 relative">
                            <button 
                                onClick={() => setShowAddForm(false)}
                                className="absolute -top-3 -right-3 bg-red-400 text-white p-1 rounded-full border-2 border-black"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Form {activeTab === 'utang' ? 'Utang Baru' : 'Piutang Baru'}
                            </h3>
                            <form onSubmit={handleAddDebt} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Nama Orang/Pihak</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formState.personName}
                                        onChange={(e) => setFormState(prev => ({...prev, personName: e.target.value}))}
                                        className="w-full p-3 rounded-xl border-2 border-black font-medium focus:ring-2 focus:ring-[#ff90e8] outline-none"
                                        placeholder="Misal: Budi / Bank BCA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Jumlah (Rp)</label>
                                    <input 
                                        type="text"
                                        required
                                        value={formState.amount}
                                        onChange={(e) => handleAmountChange(e, setFormState, 'amount')}
                                        className="w-full p-3 rounded-xl border-2 border-black font-black text-xl text-right focus:ring-2 focus:ring-[#ff90e8] outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Tanggal</label>
                                        <input 
                                            type="date"
                                            required
                                            value={formState.date}
                                            onChange={(e) => setFormState(prev => ({...prev, date: e.target.value}))}
                                            className="w-full p-3 rounded-xl border-2 border-black font-medium outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Catatan</label>
                                        <input 
                                            type="text"
                                            value={formState.notes}
                                            onChange={(e) => setFormState(prev => ({...prev, notes: e.target.value}))}
                                            className="w-full p-3 rounded-xl border-2 border-black font-medium outline-none"
                                            placeholder="Opsional"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-black text-white p-4 rounded-xl font-black hover:bg-gray-800 transition-colors"
                                >
                                    Simpan & Masukkan ke {activeTab === 'utang' ? 'Pemasukan' : 'Pengeluaran'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* List Items */}
                    {!showAddForm && (
                        <div className="space-y-4">
                            {filteredDebts.length === 0 ? (
                                <div className="text-center py-12 bg-white/50 rounded-2xl border-4 border-dashed border-black/20">
                                    <p className="font-black uppercase tracking-widest text-gray-400">Belum ada catatan {activeTab} aktif.</p>
                                </div>
                            ) : (
                                filteredDebts.map(debt => {
                                    const progress = ((debt.amount - debt.remaining) / debt.amount) * 100;
                                    
                                    return (
                                        <div key={debt.id} className="bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-transform hover:-translate-y-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-black text-lg flex items-center gap-2">
                                                        <Users className="w-5 h-5 text-[#bc95d4]" />
                                                        {debt.personName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 font-bold flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" /> {debt.date} {debt.notes && `• ${debt.notes}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-gray-500">Total Pinjaman:</span>
                                                    <p className="font-black">{formatRupiah(debt.amount)}</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-100 p-3 rounded-xl border-2 border-black mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-sm">Sisa {activeTab === 'utang' ? 'Utang' : 'Piutang'}</span>
                                                    <span className="font-black text-red-500">{formatRupiah(debt.remaining)}</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-300 rounded-full border-2 border-black overflow-hidden flex">
                                                    <div 
                                                        className="bg-[#2ecc71] h-full"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setPayModal(debt)}
                                                className="w-full py-2 bg-[#2ecc71] rounded-xl border-2 border-black font-black text-white hover:bg-[#27ae60] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all"
                                            >
                                                {activeTab === 'utang' ? 'Bayar Cicilan' : 'Terima Pembayaran'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {payModal && (
                <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba-[#ff90e8]] p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-xl">
                                {activeTab === 'utang' ? 'Bayar Utang' : 'Terima Pembayaran'}
                            </h3>
                            <button onClick={() => { setPayModal(null); setPayAmount(''); }}>
                                <X className="w-6 h-6 hover:bg-gray-100 rounded-lg" />
                            </button>
                        </div>

                        <div className="bg-pink-100 p-3 rounded-xl border-2 border-black mb-4 flex justify-between items-center">
                            <span className="font-bold">Ke: {payModal.personName}</span>
                            <span className="font-black">Sisa: {formatRupiah(payModal.remaining)}</span>
                        </div>

                        <form onSubmit={handlePayDebt}>
                            <label className="block text-sm font-bold mb-2">Jumlah Pembayaran</label>
                            <input 
                                type="text"
                                required
                                value={payAmount}
                                onChange={(e) => handleAmountChange(e, setPayAmount)}
                                className="w-full p-4 rounded-xl border-4 border-black font-black text-2xl text-center focus:outline-none focus:ring-4 focus:ring-[#ff90e8] mb-4"
                                placeholder="0"
                            />
                            <button
                                type="submit"
                                className="w-full bg-[#ff90e8] py-4 rounded-xl border-4 border-black font-black text-lg hover:bg-pink-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all"
                            >
                                Konfirmasi Pembayaran
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
