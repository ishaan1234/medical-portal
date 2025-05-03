import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPatient, type Patient } from "@/lib/redis"
import { logout } from "@/app/actions/auth-actions"
import { MedicalDetailsForm } from "./medical-details-form"
import { PatientHistory } from "./patient-history"
import { ArrowLeft } from "lucide-react"

interface PatientDetailPageProps {
  params: {
    id: string
  },
  searchParams: {
    clinic?: string
  }
}

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  // Fix the params.id error by using proper async pattern
  const patientId = await Promise.resolve(params.id);
  const clinicId = searchParams.clinic || 'clinic1';
  
  const patient = await getPatient(patientId, clinicId);
  
  if (!patient) {
    // If we can't find the patient, show a not found page
    console.error(`Patient not found with ID: ${patientId} in clinic: ${clinicId}`);
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
          <div className="mb-6">
            <Link href={`/doctor-dashboard?clinic=${clinicId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          {patient ? (
            <PatientDetails patient={patient} clinicId={clinicId} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg text-center">
              <h2 className="text-xl font-semibold text-yellow-700 mb-2">Patient Not Found</h2>
              <p className="text-yellow-600">The patient you're looking for could not be found. This could be due to an incorrect ID or the patient record may have been removed.</p>
              <Link href={`/doctor-dashboard?clinic=${clinicId}`} className="mt-4 inline-block text-blue-600 hover:underline">
                Return to Dashboard
              </Link>
            </div>
          )}
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

function PatientDetails({ patient, clinicId }: { patient: Patient, clinicId: string }) {
  return (
    <>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Patient: {patient.name}</h1>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-medium text-gray-900">Patient Information</h2>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-gray-900">{patient.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="text-gray-900">{patient.phoneNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="text-gray-900">{patient.age} years</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="text-gray-900">{patient.gender}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Patient's Medical History based on name and phone */}
      <PatientHistory patientName={patient.name} patientPhone={patient.phoneNumber} clinicId={clinicId} />

      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Medical Details</h2>
        <MedicalDetailsForm patientId={patient.id} initialData={patient.medicalDetails} clinicId={clinicId} />
      </div>
    </>
  )
}
