import { NextRequest, NextResponse } from "next/server"
import { getPatientHistoryByNameAndPhone } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const name = searchParams.get("name")
    const phone = searchParams.get("phone")
    const clinic = searchParams.get("clinic")

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone number are required" },
        { status: 400 }
      )
    }

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      )
    }

    const patientHistory = await getPatientHistoryByNameAndPhone(name, phone, clinic)
    return NextResponse.json(patientHistory)
  } catch (error) {
    console.error("Error fetching patient history:", error)
    return NextResponse.json(
      { error: "Failed to fetch patient history" },
      { status: 500 }
    )
  }
} 