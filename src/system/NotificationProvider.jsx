/**
 * system/NotificationProvider.jsx
 * Global notification system. Call notify() from anywhere.
 *
 * USAGE:
 *   const { notify } = useNotify();
 *   notify("success", "Session complete! +150 XP");
 */

import { createContext, useContext, useState, useCallback } from "react";
import SystemNotification from "./SystemNotification";

const NotifyCtx = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  }, []);

  function remove(id) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  return (
    <NotifyCtx.Provider value={{ notify }}>
      {children}
      {/* Show latest notification only */}
      {notifications.slice(-1).map(n => (
        <SystemNotification
          key={n.id}
          type={n.type}
          message={n.message}
          onDone={() => remove(n.id)}
        />
      ))}
    </NotifyCtx.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotifyCtx);
  if (!ctx) throw new Error("useNotify must be inside NotificationProvider");
  return ctx;
}
