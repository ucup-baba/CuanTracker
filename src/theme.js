// Theme controllers.
// Source of truth = classes on <html> + localStorage. Tiny pub/sub sets keep
// multiple toggle instances (Header + SettingsPage) in sync.

const STORAGE_KEY = 'cuan-theme';
const SKIN_STORAGE_KEY = 'cuan-ui-skin';
const listeners = new Set();
const skinListeners = new Set();

export function getStoredTheme() {
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch {
        return null;
    }
}

export function getStoredUiSkin() {
    try {
        return localStorage.getItem(SKIN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function getInitialTheme() {
    const stored = getStoredTheme();
    if (stored === 'dark' || stored === 'light') return stored;
    return 'light'; // default keeps the current look; users opt into dark
}

export function getInitialUiSkin() {
    const stored = getStoredUiSkin();
    if (stored === 'classic' || stored === 'soft') return stored;
    return 'classic';
}

export function applyTheme(theme) {
    // NOTE: the status-bar color (<meta name="theme-color">) is owned by App.jsx,
    // which tints it to the active role's header color (same in light & dark).
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
}

export function applyUiSkin(skin) {
    const root = document.documentElement;
    if (skin === 'soft') root.classList.add('ui-soft');
    else root.classList.remove('ui-soft');
}

export function setTheme(theme) {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        /* storage may be unavailable (private mode) */
    }
    applyTheme(theme);
    listeners.forEach((fn) => fn(theme));
}

export function setUiSkin(skin) {
    const next = skin === 'soft' ? 'soft' : 'classic';
    try {
        localStorage.setItem(SKIN_STORAGE_KEY, next);
    } catch {
        /* storage may be unavailable (private mode) */
    }
    applyUiSkin(next);
    skinListeners.forEach((fn) => fn(next));
}

export function toggleTheme() {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    setTheme(next);
    return next;
}

export function toggleUiSkin() {
    const next = document.documentElement.classList.contains('ui-soft') ? 'classic' : 'soft';
    setUiSkin(next);
    return next;
}

// Subscribe to theme changes. Returns an unsubscribe fn.
export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function subscribeUiSkin(fn) {
    skinListeners.add(fn);
    return () => skinListeners.delete(fn);
}
