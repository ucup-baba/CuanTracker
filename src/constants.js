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

// Default expense categories for Asrama wallet
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

// Default income categories for Asrama wallet
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

// Wallet definitions
export const WALLETS = {
    pribadi: { id: "pribadi", label: "Pribadi", icon: "Wallet", color: "bg-yellow-400", emoji: "💰" },
    asrama: { id: "asrama", label: "Asrama", icon: "Home", color: "bg-indigo-400", emoji: "🏠" }
};
