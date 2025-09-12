import { useEffect, useState } from 'react';
import { applyTheme, getStoredTheme, setStoredTheme } from '../lib/theme';
import type { ThemeMode } from '../lib/theme';

export default function ThemeToggle() {
    const [mode, setMode] = useState<ThemeMode>(getStoredTheme());

    const handleThemeChange = (newMode: ThemeMode) => {
        setMode(newMode);
        applyTheme(newMode);
        setStoredTheme(newMode);
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
                onChange={(e) => handleThemeChange(e.target.value as ThemeMode)}
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