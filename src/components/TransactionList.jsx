import React from 'react';
import { Trash2, TrendingUp } from 'lucide-react';
import { formatRupiah } from '../utils';
import { CategoryIcon, getCategoryColor } from './CategoryIcon';

const TransactionList = ({ transactions, deleteTransaction, categories, incomeCategories }) => {
    return (
        <div className="space-y-4">
            {transactions.length === 0 ? (
                <div className="bg-white border-4 border-black p-8 text-center border-dashed">
                    <p className="font-black uppercase tracking-widest text-gray-400 text-xl">Belum ada catatan.</p>
                </div>
            ) : (
                transactions.map((t) => (
                    <div
                        key={t.id}
                        className={`group flex justify-between items-center bg-white border-4 border-black p-4 md:p-6 pop-shadow-sm hover:translate-x-2 transition-transform ${t.type === 'income' ? 'border-l-[12px] border-l-green-400' : 'border-l-[12px] border-l-red-500'}`}
                    >
                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Ikon Kategori */}
                            {t.type === 'expense' && t.category && categories[t.category] ? (
                                <div className={`p-3 border-4 border-black ${getCategoryColor(categories[t.category].color)} pop-shadow-sm hidden sm:block`}>
                                    <CategoryIcon iconName={categories[t.category].icon} size={28} />
                                </div>
                            ) : t.type === 'income' && t.category && incomeCategories[t.category] ? (
                                <div className={`p-3 border-4 border-black ${getCategoryColor(incomeCategories[t.category].color)} pop-shadow-sm hidden sm:block`}>
                                    <CategoryIcon iconName={incomeCategories[t.category].icon} size={28} />
                                </div>
                            ) : t.type === 'income' ? (
                                <div className="p-3 border-4 border-black bg-green-400 pop-shadow-sm hidden sm:block">
                                    <TrendingUp size={28} />
                                </div>
                            ) : null}

                            <div>
                                <h4 className="font-black uppercase tracking-tight text-xl md:text-2xl">{t.text}</h4>

                                {/* Tag Sub-Kategori untuk Expense */}
                                {t.type === 'expense' && t.category && categories[t.category] && t.subCategory && (
                                    <div className="mt-2 mb-1">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-yellow-300 text-black px-2 py-1 border-2 border-black hover:-translate-y-0.5 transition-transform">
                                            {t.subCategory}
                                        </span>
                                    </div>
                                )}

                                {/* Tag Sub-Kategori untuk Income */}
                                {t.type === 'income' && t.category && incomeCategories[t.category] && t.subCategory && (
                                    <div className="mt-2 mb-1">
                                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest bg-green-200 text-black px-2 py-1 border-2 border-black hover:-translate-y-0.5 transition-transform">
                                            {t.subCategory}
                                        </span>
                                    </div>
                                )}

                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">{t.date}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`font-black text-xl md:text-3xl tracking-tighter whitespace-nowrap ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                            </span>
                            <button
                                onClick={() => deleteTransaction(t.id)}
                                className="bg-black text-white p-3 border-2 border-black hover:bg-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                title="Hapus"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default TransactionList;
