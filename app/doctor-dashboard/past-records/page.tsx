import { Suspense } from "react"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { redis, getClinicKeys, getClinicById } from "@/lib/redis"
import { PastRecordsList } from "./past-records-list"
import { logout } from "@/app/actions/auth-actions"

export default function PastRecordsPage({
  searchParams,
}: {
  searchParams?: { clinic?: string };
}) {
  // Tell Next.js not to cache this component
  noStore();
  
  // Get the clinic param safely
  const clinicId = searchParams?.clinic || '';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href={`/doctor-dashboard?clinic=${clinicId}`} className="flex items-center gap-2">
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
          <div className="flex items-center gap-4">
            <Link href={`/doctor-dashboard?clinic=${clinicId}`} className="text-sm text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
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
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Past Patient Records</h1>
          </div>

          <div>
            <Suspense fallback={<div>Loading past records...</div>}>
              <PastRecordsContent clinicId={clinicId} />
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

// Move async logic to a separate component
async function PastRecordsContent({ clinicId }: { clinicId: string }) {
  // Get clinic name directly from Redis
  let clinicName = 'Unknown Clinic';
  
  try {
    if (clinicId) {
      const clinic = await getClinicById(clinicId);
      if (clinic) {
        clinicName = clinic.name;
      }
    }
  } catch (error) {
    console.error(`Error fetching clinic name for ${clinicId}:`, error);
  }
  
  return (
    <>
      <p className="text-gray-500 mb-4">{clinicName}</p>
      <PastRecords clinicId={clinicId} />
    </>
  );
}

async function PastRecords({ clinicId }: { clinicId: string }) {
  // Only proceed if we have a clinic ID
  if (!clinicId) {
    return <div>No clinic selected</div>;
  }
  
  // Get clinic-specific keys
  const keys = getClinicKeys(clinicId);
  
  // Get all patients that have medical details for this clinic
  const allPatients = await redis.hgetall(keys.patients) || {}
  
  const completedPatients = Object.values(allPatients)
    .map(patient => {
      // Handle both string and object formats
      if (typeof patient === 'string') {
        return JSON.parse(patient)
      }
      return patient
    })
    .filter(patient => patient.medicalDetails && patient.status === "completed")
  
  return <PastRecordsList patients={completedPatients} clinicId={clinicId} />
} 