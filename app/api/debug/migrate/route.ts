import { NextRequest, NextResponse } from "next/server"
import { migrateToClinicKeys } from "@/lib/redis"

// Disable caching for this API route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log("Running manual migration of Redis data")
    
    const success = await migrateToClinicKeys()
    
    if (success) {
      return NextResponse.json({
        message: "Successfully migrated legacy data to clinic-prefixed format"
      })
    } else {
      return NextResponse.json(
        { error: "Migration encountered some issues" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Error during Redis data migration:", error)
    return NextResponse.json(
      { error: "Failed to migrate data" },
      { status: 500 }
    )
  }
} 