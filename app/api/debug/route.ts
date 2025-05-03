import { NextRequest, NextResponse } from "next/server"
import { redis, getClinicKeys, clearClinicData, migrateToClinicKeys, getAllClinics } from "@/lib/redis"

// Disable caching for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get("clinic") || "clinic1"
    const action = searchParams.get("action")
    
    if (action === "listClinics") {
      console.log("Fetching all registered clinics")
      const clinics = await getAllClinics()
      
      // For security, don't send passwords in the response
      const safeClinicData = clinics.map(clinic => ({
        id: clinic.id,
        name: clinic.name,
        adminUsername: clinic.adminUsername,
        createdAt: clinic.createdAt,
        address: clinic.address,
        phone: clinic.phone,
        email: clinic.email
      }))
      
      return NextResponse.json({
        count: clinics.length,
        clinics: safeClinicData
      })
    }
    
    console.log(`Debug API: Fetching data for clinic ${clinicId}`)
    
    // First migrate any legacy data to the clinic-prefixed format
    await migrateToClinicKeys()
    
    const keys = getClinicKeys(clinicId)
    
    // Get all Redis keys for this clinic
    const allKeys = await redis.keys(`clinic:${clinicId}:*`)
    
    // Also get any remaining global keys (without clinic prefix)
    const globalKeys = await redis.keys("patients") || []
    globalKeys.push(...(await redis.keys("doctor_room") || []))
    globalKeys.push(...(await redis.keys("waiting_room") || []))
    
    // Get patient data
    const patients = await redis.hgetall(keys.patients) || {}
    
    // Convert patients from stringified JSON to objects
    const parsedPatients: any = {}
    for (const id in patients) {
      try {
        parsedPatients[id] = JSON.parse(patients[id] as string)
      } catch (error) {
        parsedPatients[id] = patients[id]
      }
    }
    
    // Get waiting room and doctor room lists
    const waitingRoom = await redis.lrange(keys.waitingRoom, 0, -1)
    const doctorRoom = await redis.lrange(keys.doctorRoom, 0, -1)
    
    // Also check legacy data
    const legacyDoctorRoom = await redis.lrange("doctor_room", 0, -1)
    
    return NextResponse.json({
      clinic: clinicId,
      keys: [...allKeys, ...globalKeys],
      patients: parsedPatients,
      waitingRoom,
      doctorRoom,
      legacyData: {
        doctorRoom: legacyDoctorRoom
      }
    })
  } catch (error) {
    console.error("Debug API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch debug data" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clinicId = searchParams.get("clinic") || "clinic1"
    
    console.log(`Debug API: Clearing data for clinic ${clinicId}`)
    
    const success = await clearClinicData(clinicId)
    
    if (success) {
      return NextResponse.json({
        message: `Successfully cleared all data for clinic ${clinicId}`
      })
    } else {
      return NextResponse.json(
        { error: `Failed to clear data for clinic ${clinicId}` },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Debug API error during clear:", error)
    return NextResponse.json(
      { error: "Failed to clear clinic data" },
      { status: 500 }
    )
  }
} 