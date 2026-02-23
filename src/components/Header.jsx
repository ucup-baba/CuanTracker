import React from 'react';
import { DollarSign, LogOut, Settings as SettingsIcon } from 'lucide-react';

const Header = ({ onLogout, userEmail, onOpenSettings }) => {
    return (
        <nav className="bg-yellow-400 border-b-4 border-black py-4 sticky top-0 z-50">
            <div className="container mx-auto px-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-black text-white p-2 rotate-12 border-2 border-white pop-shadow-sm">
                        <DollarSign size={32} />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Cuan<br />Tracker.</h1>
                </div>
                <div className="hidden md:flex items-center gap-4">
                    <button
                        onClick={onOpenSettings}
                        className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow hover:bg-yellow-300 transition-colors"
                        title="Pengaturan Kategori"
                    >
                        <SettingsIcon size={20} />
                    </button>
                    <span className="font-bold uppercase tracking-widest text-sm bg-black text-white px-3 py-1">
                        {userEmail}
                    </span>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 bg-white text-black font-black uppercase px-6 py-3 border-4 border-black pop-shadow hover:bg-red-500 hover:text-white transition-colors"
                    >
                        Keluar <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Header;
