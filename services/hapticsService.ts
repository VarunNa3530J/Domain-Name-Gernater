import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const haptics = {
    impact: async (style: ImpactStyle = ImpactStyle.Light) => {
        try {
            await Haptics.impact({ style });
        } catch (e) {
            // Silently fail if not on a mobile device
        }
    },

    notification: async (type: NotificationType = NotificationType.Success) => {
        try {
            await Haptics.notification({ type });
        } catch (e) {
            // Silently fail if not on a mobile device
        }
    },

    vibrate: async () => {
        try {
            await Haptics.vibrate();
        } catch (e) {
            // Silently fail
        }
    },

    selectionStart: async () => {
        try {
            await Haptics.selectionStart();
        } catch (e) {
            // Silently fail
        }
    },

    selectionChanged: async () => {
        try {
            await Haptics.selectionChanged();
        } catch (e) {
            // Silently fail
        }
    },

    selectionEnd: async () => {
        try {
            await Haptics.selectionEnd();
        } catch (e) {
            // Silently fail
        }
    }
};
