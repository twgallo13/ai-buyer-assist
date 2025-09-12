import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, setStoredTheme } from '../lib/theme';
import type { ThemeMode } from '../lib/theme';

export default function ThemeToggle() {
    const [mode, setMode] = useState<ThemeMode>(getStoredTheme());

    useEffect(() => {
        applyTheme(mode);
        setStoredTheme(mode);
    }, [mode]);

    return (
        <div className="flex items-center gap-2">
            <label className="help">Theme</label>
            <select
                className="select"
                value={mode}
                onChange={(e) => setMode(e.target.value as ThemeMode)}
                aria-label="Theme mode"
            >
                <option value="light">Light (Eggshell)</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
        </div>
    );
}