import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase.js";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("All fields are required.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // Create user profile in Firestore with complete data structure
      const userData = {
        email: email,
        role: role,
        caretakerId: null,  // For patients - will be set when caretaker assigns
        assignedAt: null,   // Timestamp when caretaker was assigned
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", res.user.uid), userData);

      // Navigate to login after successful signup
      navigate("/login");

    } catch (err) {
      console.error("Signup error:", err);

      // User-friendly error messages
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("An account with this email already exists.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/weak-password":
          setError("Password is too weak. Use at least 6 characters.");
          break;
        default:
          setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSignup} className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 p-3 w-full rounded text-gray-800 bg-white placeholder-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 p-3 w-full rounded text-gray-800 bg-white placeholder-gray-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            minLength={6}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="border border-gray-300 p-3 w-full rounded text-gray-800 bg-white placeholder-gray-400"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />

          <div className="flex justify-center gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="radio"
                value="patient"
                checked={role === "patient"}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="w-4 h-4"
              />
              <span>Patient</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-gray-700">
              <input
                type="radio"
                value="caretaker"
                checked={role === "caretaker"}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
                className="w-4 h-4"
              />
              <span>Caretaker</span>
            </label>
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-3 p-2 bg-red-50 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-3 mt-4 rounded text-white font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => !loading && navigate("/login")}
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
}
