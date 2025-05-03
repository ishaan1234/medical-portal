import { Suspense } from "react"
import Link from "next/link"
import { getDoctorRoomPatients, getClinicById } from "@/lib/redis"
import { logout } from "@/app/actions/auth-actions"
import { PatientList } from "./patient-list"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { AddPatientButton } from "./add-patient-button"

// Make page dynamic to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DoctorDashboard({ searchParams }: { searchParams: { clinic?: string } }) {
  // Get clinic from URL params
  const clinicId = searchParams.clinic || '';
  
  // Default clinic name
  let clinicName = 'Your Clinic';
  
  try {
    // Get clinic details from Redis
    if (clinicId) {
      const clinic = await getClinicById(clinicId);
      if (clinic) {
        clinicName = clinic.name;
      }
    }
  } catch (error) {
    console.error(`Error fetching clinic name for ${clinicId}:`, error);
  }

  // If no clinic ID provided, redirect to login
  if (!clinicId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Clinic Selected</h1>
          <p className="mb-6">Please log in with your clinic credentials</p>
          <Link href="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full bg-blue-500 p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">MediPortal</span>
          </Link>
          <div>
            <form action={logout}>
              <button className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600">
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-500">{clinicName}</p>
            </div>
            <div className="mt-4 flex items-center space-x-3 md:mt-0">
              <AddPatientButton clinicId={clinicId} />
              <Link href={`/doctor-dashboard/past-records?clinic=${clinicId}`}>
                <Button variant="outline" className="gap-2">
                  <History className="h-4 w-4" />
                  View Past Records
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Patients Waiting for Consultation</h2>
            <Suspense fallback={<div>Loading patients...</div>}>
              <DoctorPatients clinicId={clinicId} />
            </Suspense>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white px-6 py-4">
        <div className="mx-auto max-w-7xl text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} MediPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

async function DoctorPatients({ clinicId }: { clinicId: string }) {
  console.log(`Fetching doctor patients for clinic: ${clinicId}`)
  // Force dynamic (no-cache) to ensure we get fresh data each time
  const patients = await getDoctorRoomPatients(clinicId)
  console.log(`Retrieved ${patients.length} patients for doctor dashboard in clinic ${clinicId}`)
  return <PatientList patients={patients} clinicId={clinicId} />
}
