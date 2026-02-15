import Dbheader from "./components/dbheader";
import AddMedicationForm from "./components/medicationform";
import MedicationList from "./components/medicationlist";
import { useEffect, useState, useCallback } from "react";
import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  addDoc, 
  serverTimestamp,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { 
  sendMissedMedicineAlert, 
  getMissedMedicines, 
  wasAlertSentToday 
} from "./services/emailService";

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientMedicines, setPatientMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caretakerEmail, setCaretakerEmail] = useState("");
  
  // Missed medication alerts state
  const [missedMedicines, setMissedMedicines] = useState([]);
  const [alertsSent, setAlertsSent] = useState(0);
  const [checkingAlerts, setCheckingAlerts] = useState(false);

  // Redirect if not authenticated or not a caretaker
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "caretaker") {
      navigate("/pdashboard");
      return;
    }
    setCaretakerEmail(user.email);
  }, [user, navigate]);

  // Fetch unassigned patients
  useEffect(() => {
    if (!user) return;

    const fetchUnassignedPatients = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("caretakerId", "==", null)
        );

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUnassignedPatients(list);
      } catch (error) {
        console.error("Error fetching unassigned patients:", error);
      }
    };

    fetchUnassignedPatients();
  }, [user]);

  // Fetch patients assigned to this caretaker
  useEffect(() => {
    if (!user) return;

    const fetchAssignedPatients = async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "patient"),
          where("caretakerId", "==", user.uid)
        );

        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(list)
        setAssignedPatients(list);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching assigned patients:", error);
        setLoading(false);
      }
    };

    fetchAssignedPatients();
  }, [user]);

  // Subscribe to medicines for selected patient
  useEffect(() => {
    if (!selectedPatient) {
      setPatientMedicines([]);
      return;
    }

    const q = query(
      collection(db, "medicines"),
      where("patientId", "==", selectedPatient)
    );

    // Real-time listener for medicines
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatientMedicines(meds);
    }, (error) => {
      console.error("Error listening to medicines:", error);
    });

    return () => unsubscribe();
  }, [selectedPatient]);

  // Check for missed medications and send alerts
  const checkMissedMedications = useCallback(async () => {
    if (!user || assignedPatients.length === 0) return;
    
    setCheckingAlerts(true);
    let allMissed = [];
    let sentCount = 0;

    try {
      // Check each assigned patient's medicines
      for (const patient of assignedPatients) {
        const q = query(
          collection(db, "medicines"),
          where("patientId", "==", patient.id),
          where("taken", "==", false)
        );

        const snapshot = await getDocs(q);
        const medicines = snapshot.docs.map(doc => ({
          id: doc.id,
          patientEmail: patient.email,
          ...doc.data()
        }));

        const missed = getMissedMedicines(medicines);
        
        // Send alerts for each missed medicine that hasn't been alerted today
        for (const med of missed) {
          if (!wasAlertSentToday(med)) {
            const result = await sendMissedMedicineAlert({
              caretakerEmail: user.email,
              patientEmail: med.patientEmail,
              medicineName: med.name,
              dosage: med.dosage,
              scheduledTime: med.time
            });

            if (result.success) {
              // Update lastAlertSent in Firestore
              await updateDoc(doc(db, "medicines", med.id), {
                lastAlertSent: serverTimestamp()
              });
              sentCount++;
            }
          }
          
          allMissed.push({
            ...med,
            patientEmail: med.patientEmail
          });
        }
      }

      setMissedMedicines(allMissed);
      setAlertsSent(sentCount);
      
      if (sentCount > 0) {
        console.log(`Sent ${sentCount} missed medication alerts`);
      }
    } catch (error) {
      console.error("Error checking missed medications:", error);
    } finally {
      setCheckingAlerts(false);
    }
  }, [user, assignedPatients]);

  // Check for missed medications when dashboard loads and patients are fetched
  useEffect(() => {
    if (!loading && assignedPatients.length > 0) {
      checkMissedMedications();
    }
  }, [loading, assignedPatients.length, checkMissedMedications]);

  // Assign patient to this caretaker
  const assignPatient = async (patientId) => {
    try {
      await updateDoc(doc(db, "users", patientId), {
        caretakerId: user.uid,
        assignedAt: serverTimestamp()
      });

      // Move patient from unassigned to assigned list
      const patient = unassignedPatients.find(p => p.id === patientId);
      if (patient) {
        setUnassignedPatients(prev => prev.filter(p => p.id !== patientId));
        setAssignedPatients(prev => [...prev, { ...patient, caretakerId: user.uid }]);
      }

      alert("Patient assigned successfully! 🎉");
      setSelectedPatient(patientId);
    } catch (error) {
      console.error("Error assigning patient:", error);
      alert("Failed to assign patient. Please try again.");
    }
  };

  // Add medicine for selected patient
  const addMedicine = async (med) => {
    if (!selectedPatient) {
      alert("Please select a patient first");
      return;
    }

    try {
      // Get patient email for notifications
      const patientDoc = await getDoc(doc(db, "users", selectedPatient));
      const patientData = patientDoc.data();

      // Complete medicine data structure
      const medicineData = {
        // Medicine details
        name: med.name,
        dosage: med.dosage,
        time: med.time,  // Format: "HH:MM" (24-hour format)
        
        // Patient info
        patientId: selectedPatient,
        patientEmail: patientData?.email || null,
        
        // Caretaker info (for alerts)
        caretakerId: user.uid,
        caretakerEmail: caretakerEmail,
        
        // Status tracking
        taken: false,
        takenAt: null,
        
        // Alert tracking
        lastAlertSent: null,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "medicines"), medicineData);
      alert("Medicine added successfully! ✅");
    } catch (error) {
      console.error("Error adding medicine:", error);
      throw error; // Re-throw to be handled by the form
    }
  };

  // Select a patient to manage
  const selectPatient = (patientId) => {
    setSelectedPatient(patientId);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const selectedPatientData = assignedPatients.find(p => p.id === selectedPatient);

  return (
    <div className="min-h-screen bg-gray-100">
      <Dbheader title="Caretaker Dashboard" />

      <div className="p-6">
        {/* Missed Medications Alert Banner */}
        {missedMedicines.length > 0 && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-red-800">
                  Missed Medications Alert
                </h3>
                <p className="text-sm text-red-600 mb-3">
                  {missedMedicines.length} medication(s) have not been taken today
                  {alertsSent > 0 && ` • ${alertsSent} email alert(s) sent`}
                </p>
                <div className="space-y-2">
                  {missedMedicines.map((med, index) => (
                    <div key={index} className="bg-white p-3 rounded border border-red-200">
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        Patient: {med.patientEmail} • Scheduled: {formatTime(med.time)} • Dosage: {med.dosage}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={checkMissedMedications}
                  disabled={checkingAlerts}
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium disabled:bg-gray-400"
                >
                  {checkingAlerts ? 'Checking...' : 'Refresh & Send Alerts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unassigned Patients Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-800">Unassigned Patients</h2>
          
          {unassignedPatients.length === 0 ? (
            <p className="text-gray-500">No unassigned patients available</p>
          ) : (
            <div className="space-y-2">
              {unassignedPatients.map(p => (
                <div key={p.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{p.email}</p>
                    <p className="text-sm text-gray-500">Patient ID: {p.id.slice(0, 8)}...</p>
                  </div>
                  <button
                    onClick={() => assignPatient(p.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium"
                  >
                    Assign to Me
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Assigned Patients Section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-gray-800">My Patients</h2>
          
          {assignedPatients.length === 0 ? (
            <p className="text-gray-500">No patients assigned yet. Assign a patient from the list above.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {assignedPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPatient(p.id)}
                  className={`p-3 rounded shadow font-medium ${
                    selectedPatient === p.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {p.email}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Medicine Management Section */}
        {selectedPatient && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-3 text-gray-800">
              Managing: {selectedPatientData?.email}
            </h2>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Add Medicine Form */}
              <div>
                <AddMedicationForm 
                  addMedicine={addMedicine} 
                  disabled={!selectedPatient}
                />
              </div>

              {/* Medicine List */}
              <div className="flex-1">
                <MedicationList medicines={patientMedicines} />
              </div>
            </div>
          </section>
        )}

        {!selectedPatient && assignedPatients.length > 0 && (
          <p className="text-gray-500 mt-4">
            Select a patient from "My Patients" to manage their medications.
          </p>
        )}
      </div>
    </div>
  );
}
