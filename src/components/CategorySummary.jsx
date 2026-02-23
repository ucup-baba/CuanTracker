import React, { useMemo } from 'react';
import { formatRupiah } from '../utils';
import { X } from 'lucide-react';

const CategorySummary = ({ transactions, type, onClose }) => {
    // Hitung total per kategori
    const summaryData = useMemo(() => {
        const sums = {};
        let total = 0;

        transactions.forEach(t => {
            if (t.type === 'transfer') return;
            if (t.type !== type) return;

            const catLabel = t.category || 'Lain-lain';
            sums[catLabel] = (sums[catLabel] || 0) + t.amount;
            total += t.amount;
        });

        // Convert ke array, urutkan dari yang terbesar
        const arr = Object.keys(sums).map(key => ({
            category: key,
            amount: sums[key],
            percent: total > 0 ? (sums[key] / total) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);

        return { arr, total };
    }, [transactions, type]);

    const { arr: categories } = summaryData;

    const title = type === 'income' ? 'Ringkasan Pemasukan' : 'Ringkasan Pengeluaran';
    const bgClass = type === 'income' ? 'bg-green-100' : 'bg-red-100';
    const barClass = type === 'income' ? 'bg-green-500' : 'bg-red-500';

    return (
        <div className={`border-4 border-black p-6 md:p-8 pop-shadow-sm mb-12 relative ${bgClass}`}>
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white border-2 border-black p-2 hover:bg-black hover:text-white transition-colors"
                title="Tutup Ringkasan"
            >
                <X size={20} className="font-bold" />
            </button>

            <h2 className="text-xl md:text-2xl font-black uppercase tracking-widest bg-white inline-block px-4 py-2 border-2 border-black mb-6">
                {title}
            </h2>

            {categories.length === 0 ? (
                <p className="font-bold uppercase tracking-widest text-gray-500">Belum ada data di sini Bos.</p>
            ) : (
                <div className="space-y-6">
                    {categories.map((item, index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <div className="flex justify-between font-bold text-xs md:text-sm uppercase tracking-widest">
                                <span>{item.category}</span>
                                <span>{formatRupiah(item.amount)} ({item.percent.toFixed(1)}%)</span>
                            </div>
                            <div className="w-full bg-white border-2 border-black h-4 overflow-hidden">
                                <div
                                    className={`${barClass} h-full border-r-2 border-black transition-all duration-500`}
                                    style={{ width: `${item.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategorySummary;
