import { useState, useEffect, useCallback, RefObject } from 'react';
import { ToastItem } from '../types/types';

export const useToastNotifications = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'success') => {
      const id = Date.now();
      const newToast = {
        id,
        message,
        type,
        onClose: () => removeToast(id),
      };

      setToasts(prevToasts => [...prevToasts, newToast]);

      // Auto-remove after 3 seconds
      setTimeout(() => removeToast(id), 3000);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
