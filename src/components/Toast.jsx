import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

const Toast = ({ message, isOpen, onClose }) => {
    // Add a local state to handle the animation out
    const [isRendered, setIsRendered] = useState(isOpen);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setIsAnimatingOut(false);
            const timer = setTimeout(() => {
                handleClose();
            }, 3000); // Auto close after 3 seconds
            return () => clearTimeout(timer);
        } else if (isRendered) {
            handleClose();
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            setIsRendered(false);
            setIsAnimatingOut(false);
            onClose();
        }, 300); // Match transition duration
    };

    if (!isRendered) return null;

    return (
        <div className={`fixed top-4 left-[calc(50%+10px)] md:left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${isAnimatingOut ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <div className="bg-white border-4 border-black p-3 md:p-4 flex items-center gap-3 shadow-[4px_4px_0_0_#000] relative min-w-[280px] md:min-w-[320px] max-w-[90vw]">
                <div className="text-green-500 bg-green-100 p-1 rounded-full border-2 border-green-500 shrink-0">
                    <CheckCircle2 size={20} className="md:w-6 md:h-6" />
                </div>
                <div className="flex-1 font-bold text-sm md:text-base">
                    {message}
                </div>
                <button
                    onClick={handleClose}
                    className="p-1 hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-black rounded-sm shrink-0"
                >
                    <X size={16} className="md:w-5 md:h-5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
