// auth.js

import { app } from "./firebase.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const auth = getAuth(app);

const loginScreen =
    document.getElementById("loginScreen");

const appScreen =
    document.getElementById("appScreen");

const loginBtn =
    document.getElementById("loginBtn");

const registerBtn =
    document.getElementById("registerBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const authMessage =
    document.getElementById("authMessage");

registerBtn.addEventListener("click", async () => {

    const email =
        document.getElementById("loginEmail").value;

    const password =
        document.getElementById("loginPassword").value;

    try {

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        authMessage.textContent =
            "⚔️ Account aangemaakt";

    } catch (error) {

        authMessage.textContent =
            error.message;
    }

});

loginBtn.addEventListener("click", async () => {

    const email =
        document.getElementById("loginEmail").value;

    const password =
        document.getElementById("loginPassword").value;

    try {

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

    } catch (error) {

        authMessage.textContent =
            error.message;
    }

});

logoutBtn.addEventListener("click", async () => {

    await signOut(auth);

});

onAuthStateChanged(auth, (user) => {

    if (user) {

        loginScreen.style.display = "none";
        appScreen.style.display = "block";

    } else {

        loginScreen.style.display = "block";
        appScreen.style.display = "none";
    }

});