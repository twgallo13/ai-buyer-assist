import { useEffect, useState } from 'react';
import { getSettings, updateSettings, applyTheme, type Theme } from '../lib/settings';

export default function ThemeToggle() {
    const [mode, setMode] = useState<Theme>(getSettings().theme);

    const handleThemeChange = (newMode: Theme) => {
        setMode(newMode);
        applyTheme(newMode);
        updateSettings({ theme: newMode });
    };

    useEffect(() => {
        // Initialize theme on mount
        applyTheme(mode);
    }, []);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
        }}>
            <label style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
            }}>
                Theme
            </label>
            <select
                value={mode}
                onChange={(e) => handleThemeChange(e.target.value as Theme)}
                aria-label="Theme mode"
                style={{
                    padding: 'var(--space-1) var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--input-border)',
                    backgroundColor: 'var(--card)',
                    color: 'var(--text)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                }}
            >
                <option value="light">Light (Eggshell)</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
            </select>
        </div>
    );
}