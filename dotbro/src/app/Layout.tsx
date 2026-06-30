import React from 'react';
import { useRouterStore, Route } from '../stores/router.store';
import { MessageCircle, User, Brain, Settings } from '../components/ui/Icons';
import '../styles/layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentRoute, navigate } = useRouterStore();

  const navItems = [
    { route: '/' as Route, label: 'Chat', icon: <MessageCircle size={18} /> },
    { route: '/contacts' as Route, label: 'Contacts', icon: <User size={18} /> },
    { route: '/memory' as Route, label: 'Memory', icon: <Brain size={18} /> },
  ];

  return (
    <div className="dotbro-layout">
      <aside className="dotbro-sidebar">
        <div className="dotbro-sidebar__header tauri-drag-region" data-tauri-drag-region>
          <span>DOTBRO</span>
        </div>
        <nav className="dotbro-sidebar__nav">
          {navItems.map((item) => (
            <button
              key={item.route}
              className={`dotbro-sidebar__nav-item ${
                currentRoute === item.route ? 'dotbro-sidebar__nav-item--active' : ''
              }`}
              onClick={() => navigate(item.route)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="dotbro-sidebar__footer">
          <button
            className={`dotbro-sidebar__nav-item ${
              currentRoute === '/settings' ? 'dotbro-sidebar__nav-item--active' : ''
            }`}
            onClick={() => navigate('/settings')}
            style={{ width: '100%' }}
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>
      <main className="dotbro-content">
        <div className="tauri-drag-region" data-tauri-drag-region style={{ height: 'var(--titlebar-height)', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 999 }} />
        {children}
      </main>
    </div>
  );
};
