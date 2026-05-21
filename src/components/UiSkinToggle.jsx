import React, { useEffect, useState } from 'react';
import { Brush, Sparkles } from 'lucide-react';
import { getInitialUiSkin, setUiSkin, subscribeUiSkin } from '../theme';

const UiSkinToggle = () => {
    const [skin, setSkin] = useState(getInitialUiSkin);

    useEffect(() => subscribeUiSkin(setSkin), []);

    const isSoft = skin === 'soft';

    return (
        <div className="grid grid-cols-2 gap-2 shrink-0">
            <button
                type="button"
                onClick={() => setUiSkin('classic')}
                title="Gaya Pop Classic"
                aria-pressed={!isSoft}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black font-black uppercase tracking-wider text-[11px] transition-all ${!isSoft ? 'bg-yellow-400 text-black pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
            >
                <Brush size={14} strokeWidth={2.5} />
                Pop
            </button>
            <button
                type="button"
                onClick={() => setUiSkin('soft')}
                title="Gaya Santai Soft"
                aria-pressed={isSoft}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 border-3 border-black font-black uppercase tracking-wider text-[11px] transition-all ${isSoft ? 'bg-green-300 text-black pop-shadow-sm' : 'bg-white text-gray-400 hover:bg-gray-100'}`}
            >
                <Sparkles size={14} strokeWidth={2.5} />
                Soft
            </button>
        </div>
    );
};

export default UiSkinToggle;
