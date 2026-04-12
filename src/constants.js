// Default categories in case Firestore is empty.
export const defaultCategories = {
    "Makan & Minum": {
        icon: "Coffee",
        color: "bg-orange-400",
        subCategories: ["Makan Berat", "Kopi & Jajan", "Belanja Bulanan"]
    },
    "Transportasi": {
        icon: "Car",
        color: "bg-blue-400",
        subCategories: ["Bensin & Tol", "Ojek Online", "Parkir"]
    },
    "Tagihan & Cicilan": {
        icon: "Receipt",
        color: "bg-red-400",
        subCategories: ["Listrik & Air", "Internet & Pulsa", "Cicilan Paylater"]
    },
    "Hiburan & Gaya": {
        icon: "Gamepad2",
        color: "bg-purple-400",
        subCategories: ["Langganan Streaming", "Nonton Bioskop", "Hobi & Mainan", "Perawatan Diri"]
    },
    "Lain-lain": {
        icon: "Package",
        color: "bg-gray-400",
        subCategories: ["Sedekah", "Biaya Tak Terduga", "Lainnya"]
    }
};

// Default income categories in case Firestore is empty.
export const defaultIncomeCategories = {
    "Gaji": {
        icon: "Briefcase",
        color: "bg-green-400",
        subCategories: ["Gaji Bulanan", "Bonus", "THR"]
    },
    "Freelance": {
        icon: "Monitor",
        color: "bg-teal-400",
        subCategories: ["Proyek", "Jasa", "Konsultasi"]
    },
    "Investasi": {
        icon: "TrendingUp",
        color: "bg-blue-400",
        subCategories: ["Dividen", "Saham", "Crypto"]
    },
    "Hadiah": {
        icon: "Gift",
        color: "bg-pink-400",
        subCategories: ["Hadiah", "Cashback", "Undian"]
    },
    "Lain-lain Masuk": {
        icon: "Wallet",
        color: "bg-gray-400",
        subCategories: ["Transfer Masuk", "Lainnya"]
    }
};

// Available colors for the user to choose from in Settings
export const availableColors = [
    "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-400",
    "bg-teal-400", "bg-blue-400", "bg-indigo-400", "bg-purple-400",
    "bg-pink-400", "bg-rose-400", "bg-gray-400", "bg-slate-400",
    "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500",
    "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
    "bg-pink-500", "bg-rose-500", "bg-gray-500", "bg-slate-500",
];

// Default expense categories for Asrama Putra wallet
export const defaultAsramaCategories = {
    "Dapur & Makan": {
        icon: "Utensils",
        color: "bg-orange-400",
        subCategories: ["Belanja Bahan", "Gas", "Air Galon"]
    },
    "Kebersihan": {
        icon: "Scissors",
        color: "bg-teal-400",
        subCategories: ["Sabun & Pel", "Tisu", "Sampah"]
    },
    "Tagihan": {
        icon: "Receipt",
        color: "bg-red-400",
        subCategories: ["Listrik", "Air", "WiFi"]
    },
    "Perawatan": {
        icon: "Wrench",
        color: "bg-blue-400",
        subCategories: ["Perbaikan", "Cat", "Alat"]
    },
    "Lain-lain": {
        icon: "Package",
        color: "bg-gray-400",
        subCategories: ["Keperluan Mendadak", "Lainnya"]
    }
};

// Default income categories for Asrama Putra wallet
export const defaultAsramaIncomeCategories = {
    "Iuran": {
        icon: "Landmark",
        color: "bg-green-400",
        subCategories: ["Iuran Bulanan", "Iuran Khusus"]
    },
    "Dana Yayasan": {
        icon: "Shield",
        color: "bg-blue-400",
        subCategories: ["Bantuan Operasional", "Dana Darurat"]
    },
    "Lain-lain Masuk": {
        icon: "Wallet",
        color: "bg-gray-400",
        subCategories: ["Donasi", "Lainnya"]
    }
};

// Default expense categories for Asrama Putri wallet
export const defaultPutriCategories = {
    "Dapur & Makan": {
        icon: "Utensils",
        color: "bg-rose-400",
        subCategories: ["Belanja Bahan", "Gas", "Air Galon"]
    },
    "Kebersihan": {
        icon: "Scissors",
        color: "bg-pink-400",
        subCategories: ["Sabun & Pel", "Tisu", "Sampah"]
    },
    "Tagihan": {
        icon: "Receipt",
        color: "bg-red-400",
        subCategories: ["Listrik", "Air", "WiFi"]
    },
    "Perawatan": {
        icon: "Wrench",
        color: "bg-purple-400",
        subCategories: ["Perbaikan", "Cat", "Alat"]
    },
    "Lain-lain": {
        icon: "Package",
        color: "bg-gray-400",
        subCategories: ["Keperluan Mendadak", "Lainnya"]
    }
};

// Default income categories for Asrama Putri wallet
export const defaultPutriIncomeCategories = {
    "Iuran": {
        icon: "Landmark",
        color: "bg-pink-400",
        subCategories: ["Iuran Bulanan", "Iuran Khusus"]
    },
    "Dana Yayasan": {
        icon: "Shield",
        color: "bg-purple-400",
        subCategories: ["Bantuan Operasional", "Dana Darurat"]
    },
    "Lain-lain Masuk": {
        icon: "Wallet",
        color: "bg-gray-400",
        subCategories: ["Donasi", "Lainnya"]
    }
};

// Wallet definitions
export const WALLETS = {
    pribadi: { id: "pribadi", label: "Pribadi", icon: "Wallet", color: "bg-yellow-400" },
    asrama: { id: "asrama", label: "Asrama", icon: "Home", color: "bg-indigo-400" },
    putri: { id: "putri", label: "Asrama Putri", icon: "Home", color: "bg-rose-400" },
};

// Role definitions based on email
export const ROLE_CONFIG = {
    putra: {
        emails: ["ucupbaba0704@gmail.com", "superbq@bqmail.com"],
        wallets: ["pribadi", "asrama"],
        label: "Putra",
        // Firestore collection names
        transactionCollection: "globalTransactions",
        settingsPrefix: "global",
        cashMatchCollection: "globalCashMatches",
        debtCollection: "globalDebts",
        // Theme
        theme: {
            bgPage: "bg-pink-100",
            bgPageColor: "#fdf2f8",
            dotColor: "#000",
            accentPrimary: "bg-yellow-400",
            accentText: "text-yellow-400",
            accentHover: "hover:bg-yellow-400",
            headerBg: "bg-yellow-400",
            marqueeText: "AWAS KANKER (KANTONG KERING)",
            marqueeBg: "bg-red-500",
            loadingText: "Memeriksa Bos...",
            loadingText2: "Menyiapkan Data...",
            loginSubtitle: "Area Terlarang. Khusus Bos Besar.",
            sectionTitle: "Dosa & Pahala",
        }
    },
    putri: {
        emails: ["bqputri2023@gmail.com", "patrabq.group@gmail.com"],
        wallets: ["putri"],
        label: "Putri",
        transactionCollection: "putriTransactions",
        settingsPrefix: "putri",
        cashMatchCollection: "putriCashMatches",
        debtCollection: "putriDebts",
        theme: {
            bgPage: "bg-purple-50",
            bgPageColor: "#faf5ff",
            dotColor: "#c084fc",
            accentPrimary: "bg-rose-400",
            accentText: "text-rose-400",
            accentHover: "hover:bg-rose-400",
            headerBg: "bg-rose-400",
            marqueeText: "JANGAN BOROS YA UKHTI ♡",
            marqueeBg: "bg-pink-500",
            loadingText: "Sebentar ya...",
            loadingText2: "Menyiapkan Data...",
            loginSubtitle: "Khusus Pengurus Putri.",
            sectionTitle: "Catatan Keuangan",
        }
    },
    pengurus: {
        emails: [],
        wallets: [],
        label: "Pengurus",
        theme: {
            bgPage: "bg-slate-100",
            bgPageColor: "#f1f5f9",
            dotColor: "#64748b",
            accentPrimary: "bg-emerald-500",
            accentText: "text-emerald-500",
            accentHover: "hover:bg-emerald-500",
            headerBg: "bg-emerald-500",
            marqueeText: "DASHBOARD PENGURUS — BAITUL QOWWAM",
            marqueeBg: "bg-emerald-700",
            loadingText: "Memverifikasi Akses...",
            loadingText2: "Memuat Dashboard...",
            loginSubtitle: "Akses Khusus Pengurus.",
            sectionTitle: "Ringkasan Keuangan",
        }
    }
};

// Admin email for pengurus approval
export const ADMIN_EMAIL = 'baitulqowwam2011@gmail.com';

// Helper: get role from email
export function getRoleFromEmail(email) {
    if (!email) return null;
    for (const [role, config] of Object.entries(ROLE_CONFIG)) {
        if (config.emails && config.emails.includes(email)) return role;
    }
    // Any unrecognized email is treated as pengurus (needs approval)
    return 'pengurus';
}

// Helper: get all allowed emails
export function getAllAllowedEmails() {
    return Object.values(ROLE_CONFIG).flatMap(c => c.emails);
}
