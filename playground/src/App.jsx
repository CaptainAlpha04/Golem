import { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Playground } from './pages/Playground.jsx';
import { Docs }       from './pages/Docs.jsx';
import { Toolbar }    from './components/Toolbar.jsx';
import { THEMES, DEFAULT_THEME } from './themes.js';

// ── Theme context ─────────────────────────────────────────────────────────

export const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

// ── Shared layout (toolbar + page outlet) ────────────────────────────────

function Layout() {
  const { theme } = useTheme();
  return (
    <div className="app" style={theme.ui}>
      <Toolbar />
      <Outlet />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [themeId, setThemeId] = useState(DEFAULT_THEME);
  const ctx = { themeId, theme: THEMES[themeId], setThemeId, themes: THEMES };

  return (
    <ThemeCtx.Provider value={ctx}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"     element={<Playground />} />
            <Route path="/docs" element={<Docs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeCtx.Provider>
  );
}
