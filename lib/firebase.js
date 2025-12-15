import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Enable offline persistence for Firestore (like Messenger - shows cached data when offline)
// This automatically caches all Firestore data in IndexedDB and allows queries to work offline
// Note: enableIndexedDbPersistence() shows a deprecation warning but still works fine.
// The new FirestoreSettings.cache API will be used in a future update when Firebase provides better migration docs.
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db)
    .then(() => {
      console.log('[Firestore] ✅ Offline persistence enabled - data will be cached and available offline (like Messenger)')
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('[Firestore] Offline persistence already enabled in another tab')
      } else if (err.code === 'unimplemented') {
        // Browser doesn't support IndexedDB persistence
        console.warn('[Firestore] Browser does not support offline persistence')
      } else {
        console.error('[Firestore] Error enabling offline persistence:', err)
      }
    })

  // Set Firebase Auth persistence to LOCAL for PWA - keeps user logged in across app restarts
  // This ensures users stay logged in when using the PWA, even after closing and reopening
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('[Firebase Auth] ✅ Local persistence enabled - users will stay logged in across sessions (PWA support)')
    })
    .catch((err) => {
      console.error('[Firebase Auth] Error setting persistence:', err)
    })
}

export { app, db, auth, storage }
