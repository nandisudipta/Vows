import React, { useEffect } from 'react';
import { Layout } from './Layout';
import { useRouterStore } from '../stores/router.store';
import { useSettingsStore } from '../stores/settings.store';
import { ChatView } from './views/ChatView';
import { ContactsView } from './views/ContactsView';
import { MemoryView } from './views/MemoryView';
import { SettingsView } from './views/SettingsView';

export const App: React.FC = () => {
  const { currentRoute } = useRouterStore();
  const { loadSettings, getTheme } = useSettingsStore();

  useEffect(() => {
    // Load app configurations from SQLite
    loadSettings().then(() => {
      // Apply theme preference
      const theme = getTheme();
      document.documentElement.setAttribute('data-theme', theme);
    });
  }, [loadSettings, getTheme]);

  const renderView = () => {
    switch (currentRoute) {
      case '/':
        return <ChatView />;
      case '/contacts':
        return <ContactsView />;
      case '/memory':
        return <MemoryView />;
      case '/settings':
        return <SettingsView />;
      default:
        return <ChatView />;
    }
  };

  return <Layout>{renderView()}</Layout>;
};
export default App;
