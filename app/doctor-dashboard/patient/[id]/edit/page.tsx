import Link from "next/link"
import { notFound } from "next/navigation"
import { getPatient } from "@/lib/redis"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { MedicalDetailsForm } from "../medical-details-form"

interface EditPatientPageProps {
  params: {
    id: string
  },
  searchParams: {
    clinic?: string
  }
}

export default async function EditPatientPage({ params, searchParams }: EditPatientPageProps) {
  // Fix the params.id error by using proper async pattern
  const patientId = decodeURIComponent(await Promise.resolve(params.id))
  const clinicId = searchParams.clinic || 'clinic1';
  
  const patient = await getPatient(patientId, clinicId)

  if (!patient) {
    notFound()
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center">
        <Link href={`/doctor-dashboard/past-records?clinic=${clinicId}`}>
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Records
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Medical Record</h1>
      </div>

      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-lg font-medium">Patient: {patient.name}</h2>
          <p className="text-sm text-gray-500">
            {patient.age} years • {patient.gender} • {patient.phoneNumber}
          </p>
        </div>
        
        <MedicalDetailsForm 
          patientId={patientId} 
          initialData={patient.medicalDetails} 
          isEdit={true}
          clinicId={clinicId}
        />
      </div>
    </div>
  )
} 