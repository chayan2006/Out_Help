import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, VertexAIBackend } from "firebase/vertexai";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDKwWet5vNKkiYAwkJGEmBovm-M1e0pYgE",
  authDomain: "outhelp-eae53.firebaseapp.com",
  projectId: "outhelp-eae53",
  storageBucket: "outhelp-eae53.firebasestorage.app",
  messagingSenderId: "1063935531965",
  appId: "1:1063935531965:web:ee183c084613a5b063d0d4",
  measurementId: "G-4B3CWK0M6F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize App Check
// CRITICAL: App Check is ENFORCED in the Firebase Console.
// We enable the DEBUG TOKEN using the token provided by the user.
// try {
//   // @ts-ignore
//   self.FIREBASE_APPCHECK_DEBUG_TOKEN = "3F10A2CD-8448-4D8B-BE53-916A7DE9FACE";
//
//   initializeAppCheck(app, {
//     // Using a placeholder key for the provider, but the Debug Token will take precedence on localhost.
//     provider: new ReCaptchaV3Provider('6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'),
//     isTokenAutoRefreshEnabled: true
//   });
//   console.log("App Check initialized with DEBUG TOKEN.");
// } catch (e) {
//   console.error("App Check failed to initialize:", e);
// }

// Log initialization status
// Export services
export const auth = getAuth(app);
console.log("Firebase initialized:", app.name);

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// Initialize Firestore with modern persistence settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const vertexAI = getAI(app, {
  backend: new VertexAIBackend()
});

export { analytics };
export default app;
