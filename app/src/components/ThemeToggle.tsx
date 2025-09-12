import { useEffect, useState } from 'react';
import { applyTheme } from '../lib/theme';
import { getSettings, updateSettings } from '../lib/settings';
import type { Theme } from '../lib/theme';

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