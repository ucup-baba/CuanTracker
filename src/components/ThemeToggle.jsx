import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { getInitialTheme, toggleTheme, subscribe } from '../theme';

// Light/Dark switch. Styling follows the brutalist button language and inverts
// automatically in dark mode via the global .dark overrides in index.css.
const ThemeToggle = ({ className = '', size = 20 }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => subscribe(setTheme), []);

    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className={`flex items-center justify-center bg-white text-black border-4 border-black pop-shadow-sm hover:bg-gray-100 transition-colors ${className}`}
        >
            {isDark ? <Sun size={size} strokeWidth={2.5} /> : <Moon size={size} strokeWidth={2.5} />}
        </button>
    );
};

export default ThemeToggle;
