import React from 'react';
import { Info } from 'lucide-react';

const AlertModal = ({ isOpen, title = "PERHATIAN", message, onClose, closeText = "OKE, MENGERTI" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border-4 border-black p-6 md:p-8 max-w-sm w-full pop-shadow transform transition-transform duration-200">
                <div className="flex items-center gap-4 mb-4 text-yellow-500">
                    <Info size={36} strokeWidth={3} />
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black">{title}</h2>
                </div>
                <p className="font-bold uppercase tracking-widest text-sm text-gray-700 mb-8 leading-relaxed">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="w-full py-3 border-4 border-black bg-yellow-400 font-black uppercase text-black hover:bg-black hover:text-white transition-colors pop-shadow-sm"
                >
                    {closeText}
                </button>
            </div>
        </div>
    );
};

export default AlertModal;
