import { useEffect, useCallback } from 'react';

const REMINDER_KEY = 'bkk_last_reminder';
const ENABLED_KEY = 'bkk_reminders_enabled';

/** Check if reminders are enabled */
export function isRemindersEnabled(): boolean {
    return localStorage.getItem(ENABLED_KEY) === 'true';
}

/** Toggle reminder preference */
export function setRemindersEnabled(enabled: boolean): void {
    localStorage.setItem(ENABLED_KEY, String(enabled));
}

/**
 * Hook that checks if the user has logged today and sends a browser notification
 * reminder if they haven't. Only fires once per day.
 */
export function useNotifications(hasLoggedToday: boolean) {
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const result = await Notification.requestPermission();
        return result === 'granted';
    }, []);

    const checkAndRemind = useCallback(async () => {
        if (!isRemindersEnabled()) return;
        if (hasLoggedToday) return;

        const today = new Date().toDateString();
        const lastReminder = localStorage.getItem(REMINDER_KEY);
        if (lastReminder === today) return; // Already reminded today

        // Only remind after 6 PM local time
        const hour = new Date().getHours();
        if (hour < 18) return;

        const granted = await requestPermission();
        if (!granted) return;

        new Notification('BKK Budget Buddy 💸', {
            body: "You haven't logged your expenses today! Tap to open.",
            icon: '/favicon.svg',
            tag: 'daily-reminder',
        });

        localStorage.setItem(REMINDER_KEY, today);
    }, [hasLoggedToday, requestPermission]);

    useEffect(() => {
        // Check on mount and then every 30 minutes
        checkAndRemind();
        const interval = setInterval(checkAndRemind, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkAndRemind]);

    return { requestPermission, isEnabled: isRemindersEnabled, setEnabled: setRemindersEnabled };
}
