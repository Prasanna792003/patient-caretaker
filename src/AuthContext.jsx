import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          // Check if user document exists
          if (userSnap.exists()) {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userSnap.data()?.role || null,
              caretakerId: userSnap.data()?.caretakerId || null,
              createdAt: userSnap.data()?.createdAt || null
            };
            setUser(userData);
            setError(null);
          } else {
            // User is authenticated but no Firestore profile exists
            console.warn("User authenticated but no profile found in Firestore");
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: null,
              caretakerId: null,
              createdAt: null
            });
            setError("User profile not found. Please contact support.");
          }
        } else {
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");
        // Still set basic user info if Firebase auth succeeded
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: null,
            caretakerId: null,
            createdAt: null
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isPatient: user?.role === "patient",
    isCaretaker: user?.role === "caretaker"
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
