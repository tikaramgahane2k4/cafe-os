import { createContext, useContext, useMemo } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const notificationCenter = useNotifications({
    page: 1,
    limit: 6,
    autoRefresh: true,
    pollMs: 30000,
  });

  const value = useMemo(() => notificationCenter, [notificationCenter]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsCenter() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotificationsCenter must be used inside NotificationsProvider');
  }

  return context;
}
