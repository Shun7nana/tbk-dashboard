import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIlLzOJonKK1ttuj-QMJ9JYhuO9fW5Ee8"",
  authDomain: "tbk-dashboard.firebaseapp.com",
  projectId: "tbk-dashboard",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);