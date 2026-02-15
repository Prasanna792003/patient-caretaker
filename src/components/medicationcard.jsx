export default function MedicationCard({ med }) {
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

  return (
    <div className={`bg-white p-4 shadow rounded w-full max-w-sm ${
      med.taken ? 'border-l-4 border-green-500' : 'border-l-4 border-blue-500'
    }`}>
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-800">{med.name}</h3>
        {med.taken && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
            ✓ Taken
          </span>
        )}
      </div>
      
      <div className="mt-2 space-y-1 text-sm text-gray-600">
        <p><span className="font-medium text-gray-700">Dosage:</span> {med.dosage}</p>
        <p><span className="font-medium text-gray-700">Time:</span> {formatTime(med.time)}</p>
      </div>

      {med.taken && med.takenAt && (
        <p className="text-xs text-green-600 mt-2">
          Taken at: {med.takenAt.toDate ? 
            med.takenAt.toDate().toLocaleTimeString() : 
            "Just now"
          }
        </p>
      )}
    </div>
  );
}
