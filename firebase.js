import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_kQ6L1c2VCHJF4C1IWfdJwnCSNGC0uok",
  authDomain: "valhalla-protocol.firebaseapp.com",
  projectId: "valhalla-protocol",
  storageBucket: "valhalla-protocol.firebasestorage.app",
  messagingSenderId: "659167858813",
  appId: "1:659167858813:web:ddacceb4e8ec83d3a66114"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);