import { Redis } from "@upstash/redis"

// Initialize Redis client with credentials from environment variables
export const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

// Helper function to safely parse JSON
function safeParseJSON(str: any): any {
  if (typeof str === 'object') {
    console.log("Already an object, no parsing needed:", str);
    return str;
  }
  
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error("Failed to parse JSON:", str);
    return null;
  }
}

// Helper function to decode a potentially URL-encoded ID
function decodePatientId(id: string): string {
  try {
    // First try decoding in case it's URL-encoded
    return decodeURIComponent(id);
  } catch (e) {
    console.log("ID was not URL-encoded:", id);
    return id;
  }
}

// Helper function to get clinic-specific Redis keys
export function getClinicKeys(clinicId: string) {
  return {
    patients: `clinic:${clinicId}:patients`,
    waitingRoom: `clinic:${clinicId}:waiting_room`,
    doctorRoom: `clinic:${clinicId}:doctor_room`
  };
}

// Patient types
export type PatientStatus = "waiting" | "with-doctor" | "completed"

// File attachment type
export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  contentType: string;
  timestamp: number;
}

export interface Patient {
  id: string
  name: string
  phoneNumber: string
  age: number
  gender: string
  status: PatientStatus
  createdAt: number
  clinicId: string
  medicalDetails?: {
    symptoms?: string
    diagnosis?: string
    prescription?: string
    notes?: string
    updatedAt?: number
    attachments?: FileAttachment[]
  }
}

// For debugging - clear Redis data
export async function clearAllData(clinicId: string) {
  try {
    const keys = getClinicKeys(clinicId);
    await redis.del(keys.patients);
    await redis.del(keys.waitingRoom);
    await redis.del(keys.doctorRoom);
    console.log(`All Redis data cleared for clinic ${clinicId}`);
  } catch (error) {
    console.error(`Failed to clear data for clinic ${clinicId}:`, error);
  }
}

// For debugging - clear Redis data for a specific clinic
export async function clearClinicData(clinicId: string): Promise<boolean> {
  try {
    console.log(`Clearing all data for clinic ${clinicId}`);
    
    const keys = getClinicKeys(clinicId);
    
    // Delete all clinic-specific keys
    await redis.del(keys.patients);
    await redis.del(keys.waitingRoom);
    await redis.del(keys.doctorRoom);
    
    // Also clear legacy non-prefixed keys if they exist
    await redis.del("patients");
    await redis.del("doctor_room");
    await redis.del("waiting_room");
    
    // Verify all data is cleared
    const patientCount = await redis.hlen(keys.patients);
    const waitingCount = await redis.llen(keys.waitingRoom);
    const doctorCount = await redis.llen(keys.doctorRoom);
    
    console.log(`After clearing - Patients: ${patientCount}, Waiting: ${waitingCount}, Doctor: ${doctorCount}`);
    
    return true;
  } catch (error) {
    console.error(`Failed to clear data for clinic ${clinicId}:`, error);
    return false;
  }
}

// Helper function to migrate data from old non-prefixed keys to clinic-prefixed keys
export async function migrateToClinicKeys(): Promise<boolean> {
  try {
    console.log("Checking for legacy data to migrate to clinic-prefixed keys");
    
    // Check if legacy keys exist
    const legacyPatients = await redis.hgetall("patients") || {};
    const legacyDoctorRoom = await redis.lrange("doctor_room", 0, -1);
    const legacyWaitingRoom = await redis.lrange("waiting_room", 0, -1);
    
    if (Object.keys(legacyPatients).length > 0 || legacyDoctorRoom.length > 0 || legacyWaitingRoom.length > 0) {
      console.log("Found legacy data, migrating to clinic1...");
      
      const clinic1Keys = getClinicKeys("clinic1");
      
      // Migrate patients
      for (const id in legacyPatients) {
        await redis.hset(clinic1Keys.patients, { [id]: legacyPatients[id] });
      }
      
      // Migrate doctor room
      for (const id of legacyDoctorRoom) {
        await redis.lpush(clinic1Keys.doctorRoom, id);
      }
      
      // Migrate waiting room
      for (const id of legacyWaitingRoom) {
        await redis.lpush(clinic1Keys.waitingRoom, id);
      }
      
      // Delete legacy keys after migration
      if (Object.keys(legacyPatients).length > 0) await redis.del("patients");
      if (legacyDoctorRoom.length > 0) await redis.del("doctor_room");
      if (legacyWaitingRoom.length > 0) await redis.del("waiting_room");
      
      console.log("Migration completed");
    } else {
      console.log("No legacy data found to migrate");
    }
    
    return true;
  } catch (error) {
    console.error("Error during migration:", error);
    return false;
  }
}

// Patient operations
export async function addPatient(
  patient: Omit<Patient, "id" | "createdAt">, 
  clinicId: string
): Promise<Patient> {
  try {
    // Create a consistent ID format
    const timestamp = Date.now();
    const id = `patient:${timestamp}`;
    const keys = getClinicKeys(clinicId);

    const newPatient: Patient = {
      ...patient,
      id,
      createdAt: timestamp,
      clinicId,
    }

    console.log(`Adding patient to Redis for clinic ${clinicId}:`, JSON.stringify(newPatient));
    console.log(`Using Redis hash key: ${keys.patients}`);
    
    // Store patient data with consistent key format
    await redis.hset(keys.patients, { [id]: JSON.stringify(newPatient) });
    console.log(`Successfully added patient to ${keys.patients} with ID ${id}`);

    // Add to appropriate list based on status
    if (patient.status === "waiting") {
      // Ensure we're using the same ID format in both the hash and the list
      await redis.lpush(keys.waitingRoom, id);
      console.log(`Added patient ${id} to waiting room: ${keys.waitingRoom}`);
      
      // Verify the patient was added
      const waitingRoomPatients = await redis.lrange(keys.waitingRoom, 0, -1);
      console.log(`Current waiting room patients for clinic ${clinicId}:`, waitingRoomPatients);
    } else if (patient.status === "with-doctor") {
      // Ensure we're using the same ID format in both the hash and the list
      await redis.lpush(keys.doctorRoom, id);
      console.log(`Added patient ${id} to doctor room: ${keys.doctorRoom}`);
      
      // Verify the patient was added to the doctor room list
      const doctorRoomPatients = await redis.lrange(keys.doctorRoom, 0, -1);
      console.log(`Current doctor room patients for clinic ${clinicId}:`, doctorRoomPatients);
    }

    return newPatient;
  } catch (error) {
    console.error(`Error adding patient for clinic ${clinicId}:`, error);
    throw error;
  }
}

export async function updatePatientStatus(
  id: string, 
  status: PatientStatus,
  clinicId: string
): Promise<Patient | null> {
  try {
    // Decode ID in case it's URL-encoded
    const decodedId = decodePatientId(id);
    const keys = getClinicKeys(clinicId);
    
    console.log(`Updating status for patient ${id} in clinic ${clinicId}, decoded to: ${decodedId}`);
    
    const patientJson = await redis.hget(keys.patients, decodedId)
    console.log(`Retrieved patient ${decodedId}:`, patientJson);

    if (!patientJson) return null

    let patient: Patient;
    
    // If it's already an object, use it directly
    if (typeof patientJson === 'object') {
      patient = patientJson as unknown as Patient;
    } else {
      // If it's a string, parse it
      patient = safeParseJSON(patientJson as string);
      if (!patient) return null;
    }

    const oldStatus = patient.status

    // Update patient status
    patient.status = status
    
    console.log(`Updating patient ${decodedId} status to ${status} in clinic ${clinicId}`);
    
    // Always stringify when storing in Redis
    await redis.hset(keys.patients, { [decodedId]: JSON.stringify(patient) })

    // Update room lists
    if (oldStatus === "waiting" && status === "with-doctor") {
      await redis.lrem(keys.waitingRoom, 0, decodedId)
      await redis.lpush(keys.doctorRoom, decodedId)
    } else if (oldStatus === "with-doctor" && status === "completed") {
      await redis.lrem(keys.doctorRoom, 0, decodedId)
    }

    return patient
  } catch (error) {
    console.error(`Error updating patient ${id} status in clinic ${clinicId}:`, error);
    return null;
  }
}

export async function updatePatientMedicalDetails(
  id: string,
  medicalDetails: Patient["medicalDetails"],
  clinicId: string
): Promise<Patient | null> {
  try {
    // Decode ID in case it's URL-encoded
    const decodedId = decodePatientId(id);
    const keys = getClinicKeys(clinicId);
    
    console.log(`Updating medical details for patient ${id} in clinic ${clinicId}, decoded to: ${decodedId}`);
    
    const patientJson = await redis.hget(keys.patients, decodedId)
    console.log(`Retrieved patient ${decodedId} for medical details update:`, patientJson);

    if (!patientJson) return null

    let patient: Patient;
    
    // If it's already an object, use it directly
    if (typeof patientJson === 'object') {
      patient = patientJson as unknown as Patient;
    } else {
      // If it's a string, parse it
      patient = safeParseJSON(patientJson as string);
      if (!patient) return null;
    }

    // Update medical details
    patient.medicalDetails = {
      ...patient.medicalDetails,
      ...medicalDetails,
      updatedAt: Date.now(),
    }

    console.log(`Updating medical details for patient ${decodedId} in clinic ${clinicId}`);

    // Always stringify when storing in Redis
    await redis.hset(keys.patients, { [decodedId]: JSON.stringify(patient) })

    return patient
  } catch (error) {
    console.error(`Error updating medical details for patient ${id} in clinic ${clinicId}:`, error);
    return null;
  }
}

export async function getPatient(id: string, clinicId: string): Promise<Patient | null> {
  try {
    // Decode ID in case it's URL-encoded
    const decodedId = decodePatientId(id);
    const keys = getClinicKeys(clinicId);
    
    console.log(`Getting patient details for ID ${id} in clinic ${clinicId}, decoded to: ${decodedId}`);
    
    const patientJson = await redis.hget(keys.patients, decodedId)
    console.log(`Retrieved individual patient ${decodedId} from clinic ${clinicId}:`, patientJson);
    
    if (!patientJson) {
      // Try alternate lookup methods if the direct lookup fails
      console.log(`Patient not found with ID ${decodedId} in clinic ${clinicId}, trying all patients lookup`);
      
      // List all patients for debugging
      const allPatients = await redis.hgetall(keys.patients) || {};
      console.log(`All patients in clinic ${clinicId}:`, Object.keys(allPatients));
      
      return null;
    }
    
    // If it's already an object, use it directly
    if (typeof patientJson === 'object') {
      return patientJson as unknown as Patient;
    }
    
    // If it's a string, parse it
    return safeParseJSON(patientJson as string);
  } catch (error) {
    console.error(`Error getting patient ${id} from clinic ${clinicId}:`, error);
    return null;
  }
}

export async function getWaitingRoomPatients(clinicId: string): Promise<Patient[]> {
  try {
    const keys = getClinicKeys(clinicId);
    const patientIds = await redis.lrange(keys.waitingRoom, 0, -1)
    console.log(`Waiting room patient IDs for clinic ${clinicId}:`, patientIds);
    return getPatientsByIds(patientIds, clinicId);
  } catch (error) {
    console.error(`Error getting waiting room patients for clinic ${clinicId}:`, error);
    return [];
  }
}

export async function getDoctorRoomPatients(clinicId: string): Promise<Patient[]> {
  try {
    const keys = getClinicKeys(clinicId);
    console.log(`Getting doctor room patients for clinic ${clinicId} using key ${keys.doctorRoom}`);
    
    const patientIds = await redis.lrange(keys.doctorRoom, 0, -1)
    console.log(`Doctor room patient IDs for clinic ${clinicId}:`, patientIds);
    
    if (patientIds.length === 0) {
      console.log(`No patients found in doctor room for clinic ${clinicId}`);
      // List all Redis keys for debugging
      const allKeys = await redis.keys(`clinic:${clinicId}:*`);
      console.log(`All keys for clinic ${clinicId}:`, allKeys);
    }
    
    const patients = await getPatientsByIds(patientIds, clinicId);
    console.log(`Retrieved ${patients.length} patients for doctor room in clinic ${clinicId}`);
    return patients;
  } catch (error) {
    console.error(`Error getting doctor room patients for clinic ${clinicId}:`, error);
    return [];
  }
}

async function getPatientsByIds(ids: string[], clinicId: string): Promise<Patient[]> {
  if (ids.length === 0) return [];

  const patients: Patient[] = [];
  const keys = getClinicKeys(clinicId);
  
  console.log(`Getting patients by IDs for clinic ${clinicId}: ${ids.join(', ')}`);
  
  // First, try to get all patients at once
  const allPatients = await redis.hgetall(keys.patients) || {};
  console.log(`All patients in Redis for clinic ${clinicId}:`, Object.keys(allPatients));

  for (const id of ids) {
    try {
      // Decode ID in case it's URL-encoded
      const decodedId = decodePatientId(id);
      console.log(`Retrieving patient with ID: ${id}, decoded: ${decodedId}`);
      
      const patientJson = await redis.hget(keys.patients, decodedId);
      
      if (patientJson) {
        console.log(`Found patient data for ID ${decodedId}`);
        let patient: Patient;
        
        // If it's already an object, use it directly
        if (typeof patientJson === 'object') {
          patient = patientJson as unknown as Patient;
          patients.push(patient);
        } else {
          // If it's a string, parse it
          patient = safeParseJSON(patientJson as string);
          if (patient) {
            patients.push(patient);
          } else {
            console.error(`Failed to parse patient data for ID ${decodedId}`);
          }
        }
      } else {
        console.warn(`No patient found with ID ${decodedId} in clinic ${clinicId}`);
      }
    } catch (error) {
      console.error(`Error getting patient ${id} from clinic ${clinicId}:`, error);
    }
  }

  console.log(`Returning ${patients.length} patients from ${ids.length} IDs for clinic ${clinicId}`);
  return patients;
}

export async function getPatientHistoryByNameAndPhone(name: string, phoneNumber: string, clinicId: string): Promise<Patient[]> {
  try {
    console.log(`Searching for patient history with name: ${name} and phone: ${phoneNumber} in clinic ${clinicId}`);
    
    // Get all patients
    const keys = getClinicKeys(clinicId);
    const allPatients = await redis.hgetall(keys.patients) || {};
    
    // Filter patients by matching name and phone number
    const matchingPatients: Patient[] = [];
    
    for (const key in allPatients) {
      let patient: Patient;
      
      // Parse patient data if needed
      if (typeof allPatients[key] === 'string') {
        patient = safeParseJSON(allPatients[key]);
      } else {
        patient = allPatients[key] as unknown as Patient;
      }
      
      // Check if name and phone match and has medical details
      if (patient && 
          patient.name === name && 
          patient.phoneNumber === phoneNumber && 
          patient.medicalDetails) {
        matchingPatients.push(patient);
      }
    }
    
    // Sort by most recent first
    matchingPatients.sort((a, b) => {
      const dateA = a.medicalDetails?.updatedAt || a.createdAt;
      const dateB = b.medicalDetails?.updatedAt || b.createdAt;
      return dateB - dateA;
    });
    
    console.log(`Found ${matchingPatients.length} history records for ${name} in clinic ${clinicId}`);
    return matchingPatients;
  } catch (error) {
    console.error(`Error getting patient history for ${name} in clinic ${clinicId}:`, error);
    return [];
  }
}

// Clinic type definition
export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: number;
  adminUsername: string;
  adminPassword: string;
}

// Function to register a new clinic
export async function registerClinic(clinicData: Omit<Clinic, "id" | "createdAt">): Promise<Clinic> {
  try {
    // Generate a clinic ID based on the timestamp
    const clinicId = `clinic:${Date.now()}`;
    const timestamp = Date.now();

    const newClinic: Clinic = {
      ...clinicData,
      id: clinicId,
      createdAt: timestamp,
    };

    console.log(`Registering new clinic: ${clinicData.name}`);
    
    // Store clinic data
    await redis.hset("clinics", { [clinicId]: JSON.stringify(newClinic) });
    
    // Initialize clinic data stores
    const keys = getClinicKeys(clinicId);
    // Empty initialization to ensure keys exist
    await redis.hset(keys.patients, { "init": JSON.stringify({ temp: true }) });
    await redis.hdel(keys.patients, "init");
    
    // Return the created clinic
    return newClinic;
  } catch (error) {
    console.error("Error registering clinic:", error);
    throw error;
  }
}

// Get all registered clinics
export async function getAllClinics(): Promise<Clinic[]> {
  try {
    const clinicData = await redis.hgetall("clinics") || {};
    const clinics: Clinic[] = [];
    
    for (const id in clinicData) {
      try {
        let clinic: Clinic;
        
        // Check if the data is already an object
        if (typeof clinicData[id] === 'object') {
          clinic = clinicData[id] as unknown as Clinic;
        } else {
          // If it's a string, parse it
          clinic = JSON.parse(clinicData[id] as string);
        }
        
        clinics.push(clinic);
      } catch (error) {
        console.error(`Error parsing clinic data for ${id}:`, error);
      }
    }
    
    return clinics;
  } catch (error) {
    console.error("Error getting clinics:", error);
    return [];
  }
}

// Get a clinic by ID
export async function getClinicById(id: string): Promise<Clinic | null> {
  try {
    const clinicJson = await redis.hget("clinics", id);
    if (!clinicJson) return null;
    
    // Check if the data is already an object
    if (typeof clinicJson === 'object') {
      return clinicJson as unknown as Clinic;
    }
    
    // If it's a string, parse it
    return JSON.parse(clinicJson as string);
  } catch (error) {
    console.error(`Error getting clinic ${id}:`, error);
    return null;
  }
}
