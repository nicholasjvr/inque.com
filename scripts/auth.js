import { auth, db, storage } from "../script.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements for Auth
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const authModal = document.getElementById("authModal");
  const authCloseBtn = document.querySelector(".auth-close-button");
  const loginForm = document.getElementById("loginForm");
  const signUpForm = document.getElementById("signUpForm");
  const showSignUp = document.getElementById("showSignUp");
  const showLogin = document.getElementById("showLogin");
  const authModalTitle = document.getElementById("authModalTitle");
  const userInfo = document.getElementById("userInfo");
  const userEmailSpan = document.getElementById("userEmail");

  // DOM Elements for Profile Banner & Edit
  const profilePicContainer = document.querySelector(".profile-pic-container");
  const profileName = document.querySelector(".profile-name");
  const profileBio = document.querySelector(".profile-bio");
  const profileLvl = document.getElementById("profileLvl");
  const profileType = document.getElementById("profileType");
  const profileRole = document.getElementById("profileRole");
  const editProfileBtn = document.getElementById("editProfileBtn");
  const editProfileModal = document.getElementById("editProfileModal");
  const editProfileForm = document.getElementById("editProfileForm");
  const editPhotoInput = document.getElementById("editPhoto");
  const editProfileCloseBtn = document.querySelector(
    ".edit-profile-close-button"
  );

  let currentUserProfile = null;
  let selectedFile = null;

  const defaultProfile = {
    name: "Hi, I'm Nicholas @nicholasjvr", //add github icon here as well as instagram icon as well.
    bio: "Welcome to inque. share your projects connect with others.",
    lvl: "please view //add something here",
    type: "project file is still in development",
    role: "ROLE • DEV",
    photoURL:
      "https://i.pinimg.com/originals/3c/69/1d/3c691d9047d7fb33383a8b417c8e9b67.jpg",
  };

  const updateProfileBanner = (profileData) => {
    currentUserProfile = profileData;
    profileName.textContent = profileData.name;
    profileBio.textContent = profileData.bio;
    profileLvl.textContent = profileData.lvl;
    profileType.textContent = profileData.type;
    profileRole.textContent = profileData.role;
    profilePicContainer.style.backgroundImage = `url(${
      profileData.photoURL || defaultProfile.photoURL
    })`;
  };

  // Toggle forms
  showSignUp.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    signUpForm.style.display = "block";
    authModalTitle.textContent = "Sign Up";
  });

  showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    signUpForm.style.display = "none";
    loginForm.style.display = "block";
    authModalTitle.textContent = "Login";
  });

  // Open/Close Modal
  loginBtn.addEventListener("click", () => {
    authModal.style.display = "block";
  });

  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", () => {
      authModal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.style.display = "none";
    }
  });

  // Handle Auth State Changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      let userProfile = defaultProfile;
      if (userDoc.exists()) {
        userProfile = { ...defaultProfile, ...userDoc.data() };
      }

      updateProfileBanner(userProfile);

      userEmailSpan.textContent = user.email;
      userInfo.style.display = "flex";
      loginBtn.style.display = "none";
      authModal.style.display = "none"; // Close modal on successful auth
    } else {
      // User is signed out
      currentUserProfile = null;
      updateProfileBanner(defaultProfile); // Revert to default
      userEmailSpan.textContent = "";
      userInfo.style.display = "none";
      loginBtn.style.display = "block";
    }
  });

  // Sign Up
  signUpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signUpEmail").value;
    const password = document.getElementById("signUpPassword").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create a default profile in Firestore
      const newUserProfile = {
        name: email.split("@")[0],
        bio: "A new user ready to create amazing things.",
        lvl: "LVL • 1",
        type: "TYPE • NEWB",
        role: "ROLE • USER",
        photoURL: defaultProfile.photoURL,
      };
      await setDoc(doc(db, "users", user.uid), newUserProfile);

      console.log("Signed up and profile created:", user);
    } catch (error) {
      alert(error.message);
      console.error("Sign up error:", error);
    }
  });

  // Login
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log("Logged in:", userCredential.user);
      })
      .catch((error) => {
        alert(error.message);
        console.error("Login error:", error);
      });
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out.");
      })
      .catch((error) => {
        console.error("Sign out error:", error);
      });
  });

  // Edit Profile Logic
  if (editProfileBtn && editProfileModal && editProfileForm) {
    editProfileBtn.addEventListener("click", () => {
      if (!currentUserProfile) return;
      document.getElementById("editName").value = currentUserProfile.name;
      document.getElementById("editBio").value = currentUserProfile.bio;
      selectedFile = null; // Reset file selection
      editProfileModal.style.display = "block";
    });

    editPhotoInput.addEventListener("change", (e) => {
      selectedFile = e.target.files[0];
    });

    editProfileCloseBtn.addEventListener("click", () => {
      editProfileModal.style.display = "none";
    });

    editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newName = document.getElementById("editName").value;
      const newBio = document.getElementById("editBio").value;
      const user = auth.currentUser;

      if (user) {
        try {
          let photoURL = currentUserProfile.photoURL;

          // If a new photo was selected, upload it
          if (selectedFile) {
            const storageRef = ref(storage, `profile_pictures/${user.uid}`);
            await uploadBytes(storageRef, selectedFile);
            photoURL = await getDownloadURL(storageRef);
          }

          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            name: newName,
            bio: newBio,
            photoURL: photoURL,
          });

          // Manually update the banner right away for a better UX
          updateProfileBanner({
            ...currentUserProfile,
            name: newName,
            bio: newBio,
            photoURL: photoURL,
          });

          editProfileModal.style.display = "none";
        } catch (error) {
          alert(error.message);
          console.error("Error updating profile: ", error);
        }
      }
    });
  }
});
