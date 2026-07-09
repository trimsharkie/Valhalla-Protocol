import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

window.loadCloudData = async function () {
    if (!window.currentUser) return null;

    const ref = doc(db, "users", window.currentUser.uid, "data", "valhalla");
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data();
};

window.saveCloudData = async function (data) {
    if (!window.currentUser) return;

    const ref = doc(db, "users", window.currentUser.uid, "data", "valhalla");

    await setDoc(ref, {
        ...data,
        updatedAt: serverTimestamp()
    }, { merge: true });
};