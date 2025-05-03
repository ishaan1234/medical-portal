"use server"

import { revalidatePath } from "next/cache"
import { addPatient, updatePatientStatus, updatePatientMedicalDetails, redis, getClinicKeys } from "@/lib/redis"

export async function createPatient(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const age = Number.parseInt(formData.get("age") as string)
    const gender = formData.get("gender") as string
    const clinicId = formData.get("clinicId") as string

    if (!name || !phoneNumber || isNaN(age) || !gender) {
      return { success: false, message: "All fields are required" }
    }

    if (!clinicId) {
      return { success: false, message: "Clinic ID is required" }
    }

    const patient = await addPatient({
      name,
      phoneNumber,
      age,
      gender,
      status: "waiting",
      clinicId,
    }, clinicId)

    revalidatePath("/receptionist-dashboard")
    return { success: true, patient }
  } catch (error) {
    console.error("Error creating patient:", error)
    return { success: false, message: "Failed to create patient" }
  }
}

export async function createPatientByDoctor(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const age = Number.parseInt(formData.get("age") as string)
    const gender = formData.get("gender") as string
    const clinicId = formData.get("clinicId") as string

    console.log(`Doctor adding patient for clinic: ${clinicId} - Name: ${name}`)

    if (!name || !phoneNumber || isNaN(age) || !gender) {
      return { success: false, message: "All fields are required" }
    }

    if (!clinicId) {
      console.log("ERROR: Missing clinicId in createPatientByDoctor")
      return { success: false, message: "Clinic ID is required" }
    }

    // Create patient and directly set status to "with-doctor"
    const patient = await addPatient({
      name,
      phoneNumber,
      age,
      gender,
      status: "with-doctor", // Add directly to doctor's queue
      clinicId,
    }, clinicId)

    console.log(`Patient added successfully for clinic ${clinicId}:`, JSON.stringify(patient))

    revalidatePath("/doctor-dashboard")
    console.log(`Revalidated path: /doctor-dashboard`)
    return { success: true, patient }
  } catch (error) {
    console.error("Error creating patient by doctor:", error)
    return { success: false, message: "Failed to add patient" }
  }
}

export async function movePatientToDoctor(id: string, clinicId: string) {
  try {
    const patient = await updatePatientStatus(id, "with-doctor", clinicId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    revalidatePath("/receptionist-dashboard")
    revalidatePath("/doctor-dashboard")
    return { success: true, patient }
  } catch (error) {
    console.error("Error moving patient to doctor:", error)
    return { success: false, message: "Failed to move patient" }
  }
}

export async function completePatientVisit(id: string, clinicId: string) {
  try {
    const patient = await updatePatientStatus(id, "completed", clinicId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    revalidatePath("/doctor-dashboard")
    return { success: true, patient }
  } catch (error) {
    console.error("Error completing patient visit:", error)
    return { success: false, message: "Failed to complete patient visit" }
  }
}

export async function updateMedicalDetails(id: string, formData: FormData) {
  try {
    const symptoms = formData.get("symptoms") as string
    const diagnosis = formData.get("diagnosis") as string
    const prescription = formData.get("prescription") as string
    const notes = formData.get("notes") as string
    const clinicId = formData.get("clinicId") as string

    if (!clinicId) {
      return { success: false, message: "Clinic ID is required" }
    }

    const patient = await updatePatientMedicalDetails(id, {
      symptoms,
      diagnosis,
      prescription,
      notes,
    }, clinicId)

    if (!patient) {
      return { success: false, message: "Patient not found" }
    }

    revalidatePath("/doctor-dashboard")
    revalidatePath(`/doctor-dashboard/patient/${id}`)
    return { success: true, patient }
  } catch (error) {
    console.error("Error updating medical details:", error)
    return { success: false, message: "Failed to update medical details" }
  }
}

export async function deletePatientRecord(id: string, clinicId: string) {
  try {
    // Helper function to decode ID if needed
    const decodeId = (id: string) => {
      try {
        return decodeURIComponent(id)
      } catch (e) {
        return id
      }
    }
    
    const decodedId = decodeId(id)
    const keys = getClinicKeys(clinicId)
    
    // Get the patient first to check if it exists
    const patientJson = await redis.hget(keys.patients, decodedId)
    
    if (!patientJson) {
      return { success: false, message: "Patient record not found" }
    }
    
    // Delete the patient record
    await redis.hdel(keys.patients, decodedId)
    
    // Also remove from any lists if needed
    await redis.lrem(keys.waitingRoom, 0, decodedId)
    await redis.lrem(keys.doctorRoom, 0, decodedId)
    
    revalidatePath("/doctor-dashboard")
    revalidatePath("/doctor-dashboard/past-records")
    
    return { success: true, message: "Patient record deleted successfully" }
  } catch (error) {
    console.error("Error deleting patient record:", error)
    return { success: false, message: "Failed to delete patient record" }
  }
}

export async function removePatientFromQueue(id: string, clinicId: string) {
  try {
    // Helper function to decode ID if needed
    const decodeId = (id: string) => {
      try {
        return decodeURIComponent(id)
      } catch (e) {
        return id
      }
    }
    
    const decodedId = decodeId(id)
    const keys = getClinicKeys(clinicId)
    
    // Get the patient first to check if it exists
    const patientJson = await redis.hget(keys.patients, decodedId)
    
    if (!patientJson) {
      return { success: false, message: "Patient not found" }
    }
    
    let patient;
    if (typeof patientJson === 'object') {
      patient = patientJson as unknown as typeof patientJson;
    } else {
      patient = JSON.parse(patientJson as string);
    }
    
    // Delete the patient record
    await redis.hdel(keys.patients, decodedId)
    
    // Also remove from the appropriate list based on status
    if (patient.status === "waiting") {
      await redis.lrem(keys.waitingRoom, 0, decodedId)
      revalidatePath("/receptionist-dashboard")
    } else if (patient.status === "with-doctor") {
      await redis.lrem(keys.doctorRoom, 0, decodedId)
      revalidatePath("/doctor-dashboard")
    }
    
    return { success: true, message: "Patient removed successfully" }
  } catch (error) {
    console.error("Error removing patient:", error)
    return { success: false, message: "Failed to remove patient" }
  }
}
