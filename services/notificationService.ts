import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Diagnostic logs for UI display
(window as any).PUSH_LOGS = (window as any).PUSH_LOGS || [];
const logPush = (msg: string) => {
    const entry = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(entry);
    (window as any).PUSH_LOGS.push(entry);
    // Keep only last 20 logs
    if ((window as any).PUSH_LOGS.length > 20) (window as any).PUSH_LOGS.shift();
};

export const initializePushNotifications = async (userId: string) => {
    if (!Capacitor.isNativePlatform()) {
        logPush('Skipped: Not native platform');
        return;
    }

    logPush('Initializing...');

    try {
        // 1. Check/Request local notification permissions
        let localPerm = await LocalNotifications.checkPermissions();
        if (localPerm.display !== 'granted') {
            await LocalNotifications.requestPermissions();
        }

        // 2. Check/Request push permissions
        let permStatus = await PushNotifications.checkPermissions();
        logPush(`Initial Perm: ${permStatus.receive}`);

        if (permStatus.receive === 'prompt' || (Capacitor.getPlatform() === 'android' && permStatus.receive === 'denied')) {
            logPush('Requesting permissions...');
            permStatus = await PushNotifications.requestPermissions();
            logPush(`New Perm: ${permStatus.receive}`);
        }

        if (permStatus.receive !== 'granted') {
            logPush('ERROR: Perm denied');
            return;
        }

        // 2. Add listeners
        await addPushListeners(userId);

        // 3. Register with FCM
        logPush('Registering with FCM...');
        await PushNotifications.register();
        logPush('Register call sent');
    } catch (e: any) {
        logPush(`FATAL ERROR: ${e.message || JSON.stringify(e)}`);
    }
};

const addPushListeners = async (userId: string) => {
    // On registration success
    await PushNotifications.addListener('registration', async (token) => {
        logPush(`SUCCESS: Token received: ${token.value.substring(0, 10)}...`);

        if (userId) {
            try {
                await setDoc(doc(db, 'users', userId), {
                    fcmToken: token.value,
                    lastTokenUpdate: new Date().toISOString(),
                    platform: Capacitor.getPlatform()
                }, { merge: true });
                logPush('Firestore: Token synced');
            } catch (e: any) {
                logPush(`Firestore ERROR: ${e.message}`);
            }
        } else {
            logPush('Firestore: SKIPPED (No UID)');
        }
    });

    // On registration error
    await PushNotifications.addListener('registrationError', (error) => {
        logPush(`Reg ERROR: ${error.error}`);
    });

    // Incoming
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        logPush(`Foreground Recv: ${notification.title}`);
    });
};

export const showLocalNotification = async (title: string, body: string) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title,
                    body,
                    id: Math.floor(Math.random() * 10000),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 second later
                    sound: undefined,
                    attachments: undefined,
                    actionTypeId: '',
                    extra: null
                }
            ]
        });
        console.log('[Push] Local notification scheduled');
    } catch (e) {
        console.error('[Push] Local notification error:', e);
    }
};
