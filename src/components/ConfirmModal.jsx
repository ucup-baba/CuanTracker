import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "YA, HAPUS", cancelText = "BATAL" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white border-4 border-black p-6 md:p-8 max-w-sm w-full pop-shadow transform transition-transform duration-200">
                <div className="flex items-center gap-4 mb-4 text-red-600">
                    <AlertTriangle size={36} strokeWidth={3} />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
                </div>
                <p className="font-bold uppercase tracking-widest text-sm text-gray-700 mb-8 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 border-4 border-black bg-white font-black uppercase text-black hover:bg-gray-100 transition-colors pop-shadow-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 border-4 border-black bg-red-500 font-black uppercase text-white hover:bg-black transition-colors pop-shadow-sm"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
