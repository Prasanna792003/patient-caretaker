import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      // Get user profile to determine role
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      
      if (!userDoc.exists()) {
        setError("User profile not found. Please contact support.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // Navigate based on role
      if (userData.role === "patient") {
        navigate("/pdashboard");
      } else if (userData.role === "caretaker") {
        navigate("/cdashboard");
      } else {
        setError("Invalid user role. Please contact support.");
      }

    } catch (err) {
      console.error("Login error:", err);
      
      // User-friendly error messages
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address.");
          break;
        case "auth/user-not-found":
          setError("No account found with this email.");
          break;
        case "auth/wrong-password":
          setError("Incorrect password.");
          break;
        case "auth/invalid-credential":
          setError("Invalid email or password.");
          break;
        case "auth/too-many-requests":
          setError("Too many failed attempts. Please try again later.");
          break;
        default:
          setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Medicare Login</h2>

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
          />
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
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="mt-4 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => !loading && navigate("/signup")}
          >
            Sign up here
          </span>
        </p>
      </form>
    </div>
  );
}
