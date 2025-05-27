import React from 'react';
import { useTheme } from '../context/ThemeContext';

function ShareModal() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <h1>Current Theme: {theme}</h1>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}

export default ShareModal; 