import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function   PatientMedicationCard({ med, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const markTaken = async () => {
    if (med.taken) {
      return; // Already taken
    }

    setLoading(true);
    
    try {
      await updateDoc(doc(db, "medicines", med.id), {
        taken: true,
        takenAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Call parent update callback if provided
      if (onUpdate) {
        onUpdate(med.id, { taken: true });
      }
    } catch (error) {
      console.error("Error marking medicine as taken:", error);
      alert("Failed to mark as taken. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Determine if medicine is overdue
  const isOverdue = () => {
    if (med.taken || !med.time) return false;
    
    const now = new Date();
    const [hours, minutes] = med.time.split(':').map(Number);
    const medTime = new Date();
    medTime.setHours(hours, minutes, 0, 0);
    
    return now > medTime;
  };

  const overdue = isOverdue();

  return (
    <div className={`p-4 mb-3 shadow rounded w-72 ${
      med.taken 
        ? 'bg-green-50 border-l-4 border-green-500' 
        : overdue 
          ? 'bg-red-50 border-l-4 border-red-500'
          : 'bg-white border-l-4 border-blue-500'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
        {med.taken ? (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            ✓ Taken
          </span>
        ) : overdue ? (
          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
            Overdue
          </span>
        ) : (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Pending
          </span>
        )}
      </div>
      
      <div className="space-y-1 text-sm text-gray-600">
        <p><span className="font-medium text-gray-700">Dosage:</span> {med.dosage}</p>
        <p><span className="font-medium text-gray-700">Scheduled:</span> {formatTime(med.time)}</p>
        
        {med.taken && med.takenAt && (
          <p className="text-green-600">
            <span className="font-medium">Taken at:</span>{" "}
            {med.takenAt.toDate ? 
              med.takenAt.toDate().toLocaleTimeString() : 
              "Just now"
            }
          </p>
        )}
      </div>

      {!med.taken && (
        <button
          onClick={markTaken}
          disabled={loading}
          className={`w-full mt-4 px-4 py-2 rounded text-white font-medium transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : overdue 
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {loading ? 'Updating...' : 'Mark as Taken'}
        </button>
      )}
    </div>
  );
}
