import Login from "./authen/Login";
import Signup from "./authen/Signup";
import { Routes, Route, Navigate } from "react-router-dom";
import PatientDashboard from "./patientdashboard";
import CaretakerDashboard from "./caretakerdashboard";
import { useAuth } from "./AuthContext";
import './App.css';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch - redirect to appropriate dashboard
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "patient") {
      return <Navigate to="/pdashboard" replace />;
    } else if (user.role === "caretaker") {
      return <Navigate to="/cdashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Public Route - redirects authenticated users to dashboard
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (user) {
    if (user.role === "patient") {
      return <Navigate to="/pdashboard" replace />;
    } else if (user.role === "caretaker") {
      return <Navigate to="/cdashboard" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/pdashboard"
        element={
          <ProtectedRoute allowedRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cdashboard"
        element={
          <ProtectedRoute allowedRole="caretaker">
            <CaretakerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
