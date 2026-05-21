import React from 'react';
import { Home, Tag, Settings as SettingsIcon, Shield, BarChart3, User, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ isPengurus, theme, onQuickInput, onOpenComparison }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const accentBg = theme?.accentPrimary || 'bg-yellow-400';

    // Determine active tab from route
    const getActiveTab = () => {
        if (location.pathname === '/kategori') return 'kategori';
        if (location.pathname === '/setting') return 'setting';
        if (location.pathname === '/laporan') return 'laporan';
        if (location.pathname === '/akun') return 'akun';
        return 'home';
    };
    const activeTab = getActiveTab();

    // === PENGURUS NAV ===
    if (isPengurus) {
        const items = [
            { id: 'home', label: 'Beranda', icon: Shield, path: '/', color: 'bg-emerald-400' },
            { id: 'laporan', label: 'Laporan', icon: BarChart3, path: '/laporan', color: 'bg-indigo-400' },
            { id: 'akun', label: 'Akun', icon: User, path: '/akun', color: 'bg-slate-400' },
        ];

        return (
            <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 pb-safe bottom-nav">
                <div className="bg-white border-t-4 border-black flex items-stretch bottom-nav-inner">
                    {items.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className="flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 relative active:scale-90 transition-transform bottom-nav-item"
                            >
                                <div className={`p-2 border-[3px] border-black ${isActive ? item.color + ' -translate-y-1 pop-shadow-sm' : 'bg-gray-100'} transition-all`}>
                                    <item.icon size={20} strokeWidth={2.5} className={isActive ? 'text-black' : 'text-gray-400'} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        );
    }

    // === PUTRA / PUTRI NAV ===
    const navItem = (item) => {
        const isActive = activeTab === item.id;
        return (
            <button
                key={item.id}
                onClick={item.action ? item.action : () => navigate(item.path)}
                className="flex-1 flex flex-col items-center justify-center py-2 pt-3 gap-0.5 relative active:scale-90 transition-transform bottom-nav-item"
            >
                <div className={`p-2 border-[3px] border-black ${isActive ? item.color + ' -translate-y-1 pop-shadow-sm' : 'bg-gray-100'} transition-all`}>
                    <item.icon size={20} strokeWidth={2.5} className={isActive ? 'text-black' : 'text-gray-400'} />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-400'}`}>
                    {item.label}
                </span>
            </button>
        );
    };

    const leftItems = [
        { id: 'home', label: 'Beranda', icon: Home, path: '/', color: accentBg },
        { id: 'kategori', label: 'Kategori', icon: Tag, path: '/kategori', color: 'bg-sky-400' },
    ];
    const rightItems = [
        { id: 'laporan', label: 'Laporan', icon: BarChart3, action: onOpenComparison, color: 'bg-indigo-400' },
        { id: 'setting', label: 'Setting', icon: SettingsIcon, path: '/setting', color: 'bg-slate-400' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50 pb-safe bottom-nav">
            <div className="bg-white border-t-4 border-black flex items-stretch bottom-nav-inner">
                {leftItems.map(navItem)}

                {/* Center: Input Cepat (raised, prominent) */}
                <div className="flex-1 flex flex-col items-center justify-start pt-1">
                    <button
                        onClick={onQuickInput}
                        className={`-mt-6 ${accentBg} text-black border-4 border-black pop-shadow-sm p-3 active:scale-95 transition-transform`}
                        title="Input Cepat (AI)"
                        aria-label="Input Cepat"
                    >
                        <Sparkles size={26} strokeWidth={2.5} />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-wider text-black mt-0.5">Catat</span>
                </div>

                {rightItems.map(navItem)}
            </div>
        </nav>
    );
};

export default BottomNav;
