import { app } from "./firebase.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword
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
    authMessage.textContent = "Toegang geweigerd. Controleer je gegevens.";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    showToast("Uitloggen mislukt.");
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.currentUser = user;

    loginScreen.style.display = "none";
    appScreen.style.display = "block";

    if (typeof loadUserData === "function") {
      loadUserData();
    }
  } else {
    window.currentUser = null;

    loginScreen.style.display = "block";
    appScreen.style.display = "none";
  }
});

window.changePassword = async function () {
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!newPassword || !confirmPassword) {
    showToast("Vul beide wachtwoorden in.");
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast("Wachtwoorden komen niet overeen.");
    return;
  }

  if (newPassword.length < 6) {
    showToast("Minimaal 6 tekens.");
    return;
  }

  try {
    await updatePassword(auth.currentUser, newPassword);

    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    showToast("Wachtwoord gewijzigd.");
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      showToast("Log opnieuw in om je wachtwoord te wijzigen.");
    } else {
      showToast("Wachtwoord wijzigen mislukt.");
    }
  }
};