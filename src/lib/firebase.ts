// Firebase configuration and initialization for IoT soil monitoring
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, query, orderByKey, limitToLast } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBNCtfOzG2Iv8bvCnzpIndVgNQrnxRh2Hc",
  authDomain: "soilg-c17f2.firebaseapp.com",
  databaseURL: "https://soilg-c17f2-default-rtdb.firebaseio.com",
  projectId: "soilg-c17f2",
  storageBucket: "soilg-c17f2.firebasestorage.app",
  messagingSenderId: "675059237959",
  appId: "1:675059237959:web:e6cddb869dba1ba8ed9d62",
  measurementId: "G-R92HDXKQKS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, onValue, query, orderByKey, limitToLast };
export default app;
