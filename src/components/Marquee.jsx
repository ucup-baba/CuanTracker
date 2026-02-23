import React from 'react';

const Marquee = ({ text, bg = "bg-black", textCol = "text-white" }) => (
    <div className={`relative flex overflow-x-hidden ${bg} ${textCol} py-3 whitespace-nowrap border-y-4 border-black`}>
        <div className="animate-marquee flex space-x-8 items-center">
            {[...Array(8)].map((_, i) => (
                <span key={i} className="text-2xl md:text-4xl font-black uppercase tracking-tighter mx-4">
                    {text} <span className="text-transparent border-text mx-4">✦</span>
                </span>
            ))}
        </div>
        <div className="absolute top-0 animate-marquee2 flex space-x-8 items-center py-3 whitespace-nowrap">
            {[...Array(8)].map((_, i) => (
                <span key={i} className="text-2xl md:text-4xl font-black uppercase tracking-tighter mx-4">
                    {text} <span className="text-transparent border-text mx-4">✦</span>
                </span>
            ))}
        </div>
    </div>
);

export default Marquee;
