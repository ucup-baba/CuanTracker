import React from 'react';
import * as Icons from 'lucide-react';

// Render an icon by its string name dynamically
export const CategoryIcon = ({ iconName, size = 24, className = "" }) => {
    // Determine if the requested icon exists in the lucide-react library
    const IconComponent = Icons[iconName] || Icons.DollarSign;

    return <IconComponent size={size} className={className} />;
};

// Not strictly needed anymore if we pass `colorClass` directly from the categories config, 
// but we keep a fallback just in case.
export const getCategoryColor = (colorClass) => {
    return colorClass || "bg-black text-white";
}
