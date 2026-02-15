import Dbheader from "./components/dbheader";
import TodayMedicationList from "./components/todaymedicationlist";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not authenticated or not a patient
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "patient") {
      navigate("/cdashboard");
      return;
    }
  }, [user, navigate]);

  // Subscribe to medicines in real-time
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "medicines"),
      where("patientId", "==", user.uid)
    );

    // Real-time listener for medicines
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const meds = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort by time
        meds.sort((a, b) => {
          if (!a.time) return 1;
          if (!b.time) return -1;
          return a.time.localeCompare(b.time);
        });

        setMedicines(meds);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching medicines:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Calculate medication stats
  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.taken).length;
  const pendingMeds = totalMeds - takenMeds;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading your medications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Dbheader title="Patient Dashboard" />
      
      <div className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-3xl font-bold text-blue-500">{totalMeds}</p>
            <p className="text-sm text-gray-500">Total Medications</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-3xl font-bold text-green-500">{takenMeds}</p>
            <p className="text-sm text-gray-500">Taken Today</p>
          </div>
          <div className="bg-white p-4 rounded shadow text-center">
            <p className="text-3xl font-bold text-orange-500">{pendingMeds}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
        </div>

        {/* Medications List */}
        <TodayMedicationList medicines={medicines} />
      </div>
    </div>
  );
}
