# Medicare App - Database Schema

This document describes the Firestore database structure used by the Medicare application.

## Collections

### 1. `users` Collection

Stores user profile information for both patients and caretakers.

```javascript
{
  // Document ID: Firebase Auth UID
  
  email: string,              // User's email address
  role: "patient" | "caretaker",  // User type
  
  // Patient-specific fields
  caretakerId: string | null, // UID of assigned caretaker (null if unassigned)
  assignedAt: Timestamp | null, // When caretaker was assigned
  
  // Timestamps
  createdAt: Timestamp,       // Account creation time
  updatedAt: Timestamp        // Last profile update
}
```

**Example Patient Document:**
```json
{
  "email": "patient@example.com",
  "role": "patient",
  "caretakerId": "abc123xyz",
  "assignedAt": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Example Caretaker Document:**
```json
{
  "email": "caretaker@example.com",
  "role": "caretaker",
  "caretakerId": null,
  "assignedAt": null,
  "createdAt": "2024-01-05T09:00:00Z",
  "updatedAt": "2024-01-05T09:00:00Z"
}
```

---

### 2. `medicines` Collection

Stores medication records assigned to patients.

```javascript
{
  // Document ID: Auto-generated

  // Medicine details
  name: string,               // Medicine name (e.g., "Aspirin")
  dosage: string,             // Dosage info (e.g., "1 tablet", "5ml")
  time: string,               // Scheduled time in "HH:MM" 24-hour format
  
  // Patient info
  patientId: string,          // UID of the patient
  patientEmail: string | null, // Patient's email for reference
  
  // Caretaker info
  caretakerId: string,        // UID of the caretaker who added this
  caretakerEmail: string,     // Caretaker's email for reference
  
  // Status tracking
  taken: boolean,             // Whether medicine was taken
  takenAt: Timestamp | null,  // When medicine was marked as taken
  
  // Timestamps
  createdAt: Timestamp,       // When medicine was added
  updatedAt: Timestamp        // Last update time
}
```

**Example Medicine Document:**
```json
{
  "name": "Metformin",
  "dosage": "500mg tablet",
  "time": "08:00",
  "patientId": "patient123",
  "patientEmail": "patient@example.com",
  "caretakerId": "caretaker456",
  "caretakerEmail": "caretaker@example.com",
  "taken": false,
  "takenAt": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

---

## Firestore Security Rules

Recommended security rules for the database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own profile during signup
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own profile
      // Caretakers can update patient's caretakerId field
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        (resource.data.role == 'patient' && 
         request.resource.data.diff(resource.data).affectedKeys().hasOnly(['caretakerId', 'assignedAt']))
      );
      
      // Caretakers can list unassigned patients
      allow list: if request.auth != null;
    }
    
    // Medicines collection
    match /medicines/{medicineId} {
      // Allow read if user is the patient or caretaker
      allow read: if request.auth != null && (
        resource.data.patientId == request.auth.uid ||
        resource.data.caretakerId == request.auth.uid
      );
      
      // Allow create if user is a caretaker
      allow create: if request.auth != null && 
        request.resource.data.caretakerId == request.auth.uid;
      
      // Allow update for patients (marking taken) or caretakers
      allow update: if request.auth != null && (
        resource.data.patientId == request.auth.uid ||
        resource.data.caretakerId == request.auth.uid
      );
    }
  }
}
```

---

## Indexes

Required composite indexes for efficient queries:

### medicines Collection
1. `patientId` (Ascending) + `time` (Ascending)
2. `caretakerId` (Ascending) + `createdAt` (Descending)

### users Collection
1. `role` (Ascending) + `caretakerId` (Ascending)

---

## Data Flow

### Patient Registration
1. User signs up with email/password
2. Firebase Auth creates user
3. App creates Firestore profile in `users` with `role: "patient"`, `caretakerId: null`

### Caretaker Assigns Patient
1. Caretaker views unassigned patients (`role == "patient"` AND `caretakerId == null`)
2. Caretaker clicks "Assign"
3. App updates patient's `caretakerId` to caretaker's UID

### Adding Medicine
1. Caretaker selects patient
2. Caretaker fills medicine form
3. App creates document in `medicines` with complete data structure

### Patient Takes Medicine
1. Patient views their medicines (`patientId == user.uid`)
2. Patient clicks "Mark as Taken"
3. App updates medicine: `taken: true`, `takenAt: serverTimestamp()`
