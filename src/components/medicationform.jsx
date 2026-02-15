import { useState } from "react";

export default function AddMedicationForm({ addMedicine, disabled = false }) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !dosage || !time) {
      alert("Please fill all fields");
      return;
    }

    if (!addMedicine) {
      console.error("addMedicine function not provided");
      alert("Error: Cannot add medicine. Please try again.");
      return;
    }

    setLoading(true);
    
    try {
      await addMedicine({ name, dosage, time });
      
      // Clear form on success
      setName("");
      setDosage("");
      setTime("");
    } catch (error) {
      console.error("Error adding medicine:", error);
      alert("Failed to add medicine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded shadow w-80">
      <h2 className="font-bold mb-4 text-gray-800 text-lg">Add Medication</h2>

      <input
        placeholder="Medicine name"
        className="border border-gray-300 p-2 w-full mb-3 rounded text-gray-800 bg-white placeholder-gray-400"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading || disabled}
        required
      />

      <input
        placeholder="Dosage (e.g., 1 tablet, 5ml)"
        className="border border-gray-300 p-2 w-full mb-3 rounded text-gray-800 bg-white placeholder-gray-400"
        value={dosage}
        onChange={(e) => setDosage(e.target.value)}
        disabled={loading || disabled}
        required
      />

      <input
        type="time"
        className="border border-gray-300 p-2 w-full mb-3 rounded text-gray-800 bg-white"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        disabled={loading || disabled}
        required
      />

      <button 
        type="submit"
        className={`w-full p-2 rounded text-white font-medium ${
          loading || disabled 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        disabled={loading || disabled}
      >
        {loading ? 'Adding...' : disabled ? 'Select a patient first' : 'Add Medicine'}
      </button>
    </form>
  );
}
