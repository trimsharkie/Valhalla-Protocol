import { app } from "./firebase.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const auth = getAuth(app);

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const authMessage = document.getElementById("authMessage");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    authMessage.textContent = "";
  } catch (error) {
    authMessage.textContent = "Login mislukt: " + error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.currentUser = user;

    loginScreen.style.display = "none";
    appScreen.style.display = "block";

    console.log("Ingelogd als:", user.email);
    console.log("User ID:", user.uid);

    if (typeof loadUserData === "function") {
      loadUserData();
    }

  } else {
    window.currentUser = null;

    loginScreen.style.display = "block";
    appScreen.style.display = "none";

    console.log("Uitgelogd");
  }
});