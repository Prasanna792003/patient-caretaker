import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../AuthContext";

export default function Dbheader({ title }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      
      // Clear any local storage data
      localStorage.clear();
      
      // Navigate to login page
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };
  console.log(user)
  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        {user?.email && (
          <p className="text-sm text-gray-500">{user.email}</p>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {user?.role && (
          <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded capitalize">
            {user.role}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors font-medium"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
