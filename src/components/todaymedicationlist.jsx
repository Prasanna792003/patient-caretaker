import PatientMedicationCard from "./patientmedicationcard";

export default function TodayMedicationList({ medicines }) {
  // Separate taken and pending medicines
  const pendingMeds = medicines.filter(m => !m.taken);
  const takenMeds = medicines.filter(m => m.taken);
  console.log(medicines)
  return (
    <div>
      <h2 className="font-bold text-xl mb-4 text-gray-800">Today's Medicines</h2>

      {medicines.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-gray-500">No medicines scheduled for today.</p>
          <p className="text-sm text-gray-400 mt-2">
            Your caretaker will add medications for you.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Medicines */}
          {pendingMeds.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">
                Pending ({pendingMeds.length})
              </h3>
              <div className="flex flex-wrap gap-4">
                {pendingMeds.map((med) => (
                  <PatientMedicationCard key={med.id} med={med} />
                ))}
              </div>
            </div>
          )}

          {/* Taken Medicines */}
          {takenMeds.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-3">
                Completed ({takenMeds.length})
              </h3>
              <div className="flex flex-wrap gap-4 opacity-70">
                {takenMeds.map((med) => (
                  <PatientMedicationCard key={med.id} med={med} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
