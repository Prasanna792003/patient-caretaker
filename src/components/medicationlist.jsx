import MedicationCard from "./medicationcard";

export default function MedicationList({ medicines }) {
  // Separate taken and pending medicines
  const pendingMeds = medicines.filter(m => !m.taken);
  const takenMeds = medicines.filter(m => m.taken);

  return (
    <div>
      <h2 className="font-bold text-xl mb-4 text-gray-800">Medication List</h2>

      {medicines.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-center">
          <p className="text-gray-500">No medicines added yet for this patient.</p>
          <p className="text-sm text-gray-400 mt-2">
            Use the form to add medications.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Medicines */}
          {pendingMeds.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Pending ({pendingMeds.length})
              </h3>
              <div className="space-y-3">
                {pendingMeds.map((med) => (
                  <MedicationCard key={med.id} med={med} />
                ))}
              </div>
            </div>
          )}

          {/* Taken Medicines */}
          {takenMeds.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                Taken ({takenMeds.length})
              </h3>
              <div className="space-y-3 opacity-60">
                {takenMeds.map((med) => (
                  <MedicationCard key={med.id} med={med} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
