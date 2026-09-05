import { ref, onValue, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { rtdb } from './config';

/**
 * Использует Firebase Realtime Database для отслеживания online/offline
 * статуса пользователя — использует встроенный спец-путь `.info/connected`,
 * который RTDB обновляет мгновенно при разрыве соединения (даже при
 * закрытии вкладки), в отличие от Firestore.
 */
export function initPresence(uid: string) {
  const statusRef = ref(rtdb, `status/${uid}`);
  const connectedRef = ref(rtdb, '.info/connected');

  return onValue(connectedRef, (snap) => {
    if (snap.val() === false) return;

    onDisconnect(statusRef)
      .set({ state: 'offline', lastChanged: serverTimestamp() })
      .then(() => {
        set(statusRef, { state: 'online', lastChanged: serverTimestamp() });
      });
  });
}

export function subscribeToPresence(uid: string, cb: (online: boolean) => void) {
  const statusRef = ref(rtdb, `status/${uid}`);
  return onValue(statusRef, (snap) => {
    cb(snap.val()?.state === 'online');
  });
}
