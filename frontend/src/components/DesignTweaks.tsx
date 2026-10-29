import { useState, useEffect, useRef } from 'react';
import { COLOR_PRESETS, applyPrimaryColor, initPrimaryColor, type ColorPreset } from '../utils/themePresets';

interface DesignTweaksProps {
  align?: 'left' | 'right';
  id?: string;
}

export function DesignTweaks({ align = 'right', id = 'tweaksToggleBtn' }: DesignTweaksProps) {
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<string>('#442C43');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialHex = initPrimaryColor();
    setActiveColor(initialHex);

    const handleExternalColorChange = (e: Event) => {
      const customEv = e as CustomEvent<ColorPreset>;
      if (customEv.detail?.hex) {
        setActiveColor(customEv.detail.hex);
      }
    };

    window.addEventListener('integrum-color-change', handleExternalColorChange);
    return () => window.removeEventListener('integrum-color-change', handleExternalColorChange);
  }, []);

  useEffect(() => {
    if (!tweaksOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setTweaksOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [tweaksOpen]);

  const handleSelect = (preset: ColorPreset) => {
    setActiveColor(preset.hex);
    applyPrimaryColor(preset);
  };

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      <button
        type="button"
        className="btn btn-xs btn-outline"
        id={id}
        onClick={() => setTweaksOpen(!tweaksOpen)}
        title="Design Tweaks: Change Primary Color"
        aria-label="Design Tweaks"
        aria-expanded={tweaksOpen}
        style={{
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11.5px',
          fontWeight: 700,
        }}
      >
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: activeColor,
            border: '1px solid var(--border)',
            display: 'inline-block',
          }}
        />
        <span>Tweaks</span>
      </button>

      {tweaksOpen && (
        <div
          className="card glass"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            [align === 'left' ? 'left' : 'right']: 0,
            width: '230px',
            padding: '14px 16px',
            borderRadius: 'var(--radius-lg)',
            zIndex: 100,
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-1)' }}>Brand Tweaks</strong>
            <button
              type="button"
              onClick={() => setTweaksOpen(false)}
              aria-label="Close tweaks panel"
              style={{ fontSize: '11px', color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-2)', marginBottom: '8px' }}>
            Primary Color Accent:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {COLOR_PRESETS.map((preset) => {
              const isSelected = activeColor.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handleSelect(preset)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-pill)',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    background: isSelected ? 'var(--primary-light)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: isSelected ? 700 : 500,
                    color: 'var(--text-1)',
                    transition: 'all var(--dur-1) var(--ease)',
                  }}
                >
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: preset.hex,
                      display: 'inline-block',
                      flexShrink: 0,
                      border: '1px solid rgba(0,0,0,0.1)',
                    }}
                  />
                  <span style={{ flex: 1 }}>{preset.name}</span>
                  {isSelected && <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 800 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface ThemeToggleProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  id?: string;
  style?: React.CSSProperties;
}

export function ThemeToggle({
  darkMode,
  onToggleDarkMode,
  id = 'darkModeToggle',
  style,
}: ThemeToggleProps) {
  return (
    <button
      className="theme-btn btn btn-xs btn-outline"
      id={id}
      onClick={onToggleDarkMode}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11.5px',
        fontWeight: 700,
        ...style,
      }}
    >
      <span>{darkMode ? '☀️' : '🌙'}</span>
      <span>{darkMode ? 'Light' : 'Dark'}</span>
    </button>
  );
}
