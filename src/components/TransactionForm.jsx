import React, { useState, useEffect } from 'react';
import { CategoryIcon } from './CategoryIcon';

const TransactionForm = ({ onAddTransaction, categories, incomeCategories }) => {
    const [text, setText] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('expense');
    const [category, setCategory] = useState('');
    const [subCategory, setSubCategory] = useState('');

    // Tentukan kategori yang aktif berdasarkan type transaksi
    const activeCategories = type === 'expense' ? categories : incomeCategories;

    useEffect(() => {
        if (category && activeCategories[category]) {
            setSubCategory(activeCategories[category].subCategories[0] || "");
        } else {
            setSubCategory('');
        }
    }, [category, activeCategories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text || !amount) return;

        // Validasi input angka valid
        if (Number(amount) <= 0) {
            alert('Masukkan nominal yang benar (lebih dari 0)!');
            return;
        }

        if (!category || !subCategory) {
            alert('Pilih Kategori dan Sub-Kategori dulu Bos!');
            return;
        }

        onAddTransaction({
            id: Math.floor(Math.random() * 100000000),
            text,
            amount: Number(amount),
            type,
            category,
            subCategory,
            date: new Date().toISOString().split('T')[0]
        });

        // Reset form
        setText('');
        setAmount('');
        setCategory('');
        setSubCategory('');
    };

    return (
        <div className="bg-white border-4 border-black p-8 pop-shadow">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 border-b-4 border-black pb-4">Ngapain Aja<br />Duitnya?</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Pilihan Jenis Transaksi */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setType('expense');
                            setCategory('');
                            setSubCategory('');
                        }}
                        className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-lg transition-all ${type === 'expense' ? 'bg-red-500 text-white pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        Keluar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setType('income');
                            setCategory('');
                            setSubCategory('');
                        }}
                        className={`flex-1 py-4 border-4 border-black font-black uppercase tracking-widest text-lg transition-all ${type === 'income' ? 'bg-green-400 text-black pop-shadow scale-105' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        Masuk
                    </button>
                </div>

                {/* Pilihan Kategori dengan Ikon */}
                <div className="space-y-4">
                    <div>
                        <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">
                            Kategori {type === 'income' ? 'Pemasukan' : 'Utama'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {Object.keys(activeCategories).map(cat => {
                                const catData = activeCategories[cat];
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`p-3 border-4 border-black flex flex-col items-center justify-center gap-2 transition-transform ${category === cat ? `${catData.color || 'bg-yellow-400'} text-black pop-shadow scale-105 z-10` : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:-translate-y-1'}`}
                                        title={cat}
                                    >
                                        <CategoryIcon iconName={catData.icon} size={32} />
                                        <span className="text-[10px] md:text-xs font-black uppercase text-center mt-1">{cat}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pilihan Sub-Kategori */}
                    {category && activeCategories[category] && activeCategories[category].subCategories && activeCategories[category].subCategories.length > 0 && (
                        <div>
                            <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Sub-Kategori</label>
                            <div className="flex flex-wrap gap-2">
                                {activeCategories[category].subCategories.map(sub => (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => setSubCategory(sub)}
                                        className={`px-4 py-2 border-4 border-black font-black uppercase text-sm transition-all ${subCategory === sub ? 'bg-yellow-400 text-black pop-shadow-sm scale-105' : 'bg-white text-gray-500 hover:bg-gray-100 hover:-translate-y-1'}`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Keterangan */}
                <div>
                    <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Keterangan Detail</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Contoh: Beli Kopi Susu Mantap"
                        className="w-full bg-yellow-50 border-4 border-black p-4 font-bold text-xl uppercase placeholder:text-gray-400 focus:outline-none focus:bg-yellow-100 pop-shadow-sm transition-colors"
                        required
                    />
                </div>

                {/* Input Jumlah */}
                <div>
                    <label className="block font-black uppercase tracking-widest mb-2 text-sm bg-black text-white inline-block px-3 py-1">Jumlah (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl">Rp</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="50000"
                            className="w-full bg-yellow-50 border-4 border-black p-4 pl-14 font-bold text-xl focus:outline-none focus:bg-yellow-100 pop-shadow-sm transition-colors"
                            required
                        />
                    </div>
                </div>

                {/* Tombol Submit */}
                <button
                    type="submit"
                    className="w-full bg-black text-white font-black uppercase tracking-widest text-2xl py-6 border-4 border-black hover:bg-yellow-400 hover:text-black transition-colors pop-shadow mt-4"
                >
                    CATAT SEKARANG!
                </button>
            </form>
        </div>
    );
};

export default TransactionForm;
