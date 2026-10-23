import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'cuan_lang';
const EVENT_NAME = 'cuan-lang-change';

export function getInitialLang() {
    if (typeof window === 'undefined') return 'id';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'id') return saved;
    return 'id';
}

export function setGlobalLang(nextLang) {
    const lang = nextLang === 'en' ? 'en' : 'id';
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, lang);
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: lang }));
    }
}

export function useLanguage(defaultOverride) {
    const [lang, setLangState] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved === 'en' || saved === 'id') return saved;
        }
        return defaultOverride || 'id';
    });

    useEffect(() => {
        const handler = (e) => {
            if (e?.detail) setLangState(e.detail);
        };
        window.addEventListener(EVENT_NAME, handler);
        return () => window.removeEventListener(EVENT_NAME, handler);
    }, []);

    const updateLang = (next) => {
        setLangState(next);
        setGlobalLang(next);
    };

    return [lang, updateLang];
}

export function LanguageToggle({ lang, setLang, className = '' }) {
    return (
        <div
            className={`inline-flex border-[3px] border-black bg-white p-0.5 pop-shadow-sm shrink-0 ${className}`}
            role="group"
            aria-label="Language"
        >
            <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                    lang === 'en' ? 'bg-black text-yellow-300' : 'bg-white text-black hover:bg-slate-100'
                }`}
            >
                <span>🇬🇧</span> EN
            </button>
            <button
                type="button"
                onClick={() => setLang('id')}
                className={`px-2.5 py-1 text-[11px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 ${
                    lang === 'id' ? 'bg-black text-yellow-300' : 'bg-white text-black hover:bg-slate-100'
                }`}
            >
                <span>🇮🇩</span> ID
            </button>
        </div>
    );
}

const CATEGORY_EN_MAP = {
    // Categories
    'Dapur & Makan': 'Kitchen & Meals',
    'Kebersihan': 'Sanitation & Hygiene',
    'Tagihan': 'Utilities & Bills',
    'Perawatan': 'Maintenance & Upkeep',
    'Lain-lain': 'Miscellaneous',
    'Iuran': 'Contributions',
    'Dana Yayasan': 'Foundation Funds',
    'Lain-lain Masuk': 'Other Income',
    'Pengiriman & Ongkir': 'Shipping & Delivery',
    'Bahan Habis Pakai': 'Consumable Supplies',
    'Peralatan': 'Equipment & Tools',
    'Cetak & Dokumentasi': 'Printing & Docs',
    'Konsumsi': 'Refreshments & Meals',
    'Dana Operasional': 'Operational Funds',
    'Reimburse': 'Reimbursements',
    'Makan & Minum': 'Food & Drinks',
    'Transportasi': 'Transportation',
    'Tagihan & Cicilan': 'Bills & Installments',
    'Hiburan & Gaya': 'Entertainment & Lifestyle',
    'Gaji': 'Salary',
    'Freelance': 'Freelance',
    'Investasi': 'Investment',
    'Hadiah': 'Gifts & Rewards',
    'Transfer Masuk': 'Incoming Transfer',
    'Transfer Keluar': 'Outgoing Transfer',
    // Subcategories
    'Belanja Bahan': 'Groceries & Ingredients',
    'Gas': 'Cooking Gas (LPG)',
    'Air Galon': 'Drinking Water (Gallon)',
    'Sabun & Pel': 'Soap & Cleaning Supplies',
    'Tisu': 'Tissue Paper',
    'Sampah': 'Waste Disposal',
    'Listrik': 'Electricity',
    'Air': 'Water Utility',
    'WiFi': 'Internet / Wi-Fi',
    'Perbaikan': 'Repairs',
    'Cat': 'Paint & Coating',
    'Alat': 'Tools & Hardware',
    'Keperluan Mendadak': 'Urgent Needs',
    'Lainnya': 'Others',
    'Iuran Bulanan': 'Monthly Contribution',
    'Iuran Khusus': 'Special Contribution',
    'Bantuan Operasional': 'Operational Grant',
    'Dana Darurat': 'Emergency Fund',
    'Donasi': 'Donation',
    'Ongkos Kirim': 'Shipping Fee',
    'Ekspedisi': 'Freight / Expedition',
    'Kurir': 'Local Courier',
    'ATK': 'Stationery (ATK)',
    'Tinta & Kertas': 'Ink & Paper',
    'Plastik & Kardus': 'Packaging & Boxes',
    'Alat Tulis': 'Writing Supplies',
    'Alat Kebersihan': 'Cleaning Equipment',
    'Elektronik': 'Electronics',
    'Fotokopi': 'Photocopy',
    'Cetak Banner': 'Banner Printing',
    'Cetak Dokumen': 'Document Printing',
    'Makan Rapat': 'Meeting Meals',
    'Snack Acara': 'Event Snacks',
    'Minuman': 'Beverages',
    'Dana Bulanan': 'Monthly Allocation',
    'Dana Khusus': 'Special Allocation',
    'Reimburse Belanja': 'Purchase Reimbursement',
    'Reimburse Transport': 'Transport Reimbursement',
    'Tanpa Sub': 'Uncategorized',
    // Wallets
    'Asrama Putra': "Boys' Dormitory",
    'Asrama Putri': "Girls' Dormitory",
    'Logistik': 'Logistics',
    'Pribadi': 'Personal',
};

export function translateLabel(text, lang) {
    if (!text || lang !== 'en') return text;
    if (CATEGORY_EN_MAP[text]) return CATEGORY_EN_MAP[text];
    if (text.startsWith('Dari ')) {
        const rest = text.slice(5);
        return `From ${CATEGORY_EN_MAP[rest] || rest}`;
    }
    if (text.startsWith('Ke ')) {
        const rest = text.slice(3);
        return `To ${CATEGORY_EN_MAP[rest] || rest}`;
    }
    return text;
}
