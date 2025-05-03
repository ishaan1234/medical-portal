import Link from "next/link"
import { notFound } from "next/navigation"
import { getPatient } from "@/lib/redis"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit } from "lucide-react"
import { PrintButton } from "./print-button"

interface PatientViewPageProps {
  params: {
    id: string
  },
  searchParams: {
    clinic?: string
  }
}

export default async function PatientViewPage({ params, searchParams }: PatientViewPageProps) {
  // Fix the params.id error by using proper async pattern
  const patientId = decodeURIComponent(await Promise.resolve(params.id))
  const clinicId = searchParams.clinic || 'clinic1';
  
  const patient = await getPatient(patientId, clinicId)

  if (!patient || !patient.medicalDetails) {
    notFound()
  }

  const formattedDate = new Date(patient.medicalDetails.updatedAt || patient.createdAt).toLocaleString()

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex items-center">
        <Link href={`/doctor-dashboard/past-records?clinic=${clinicId}`}>
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Records
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Patient Record</h1>
      </div>

      <Card className="mb-8">
        <CardHeader className="bg-gray-50 pb-4 pt-6">
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              <div className="text-sm text-gray-500">
                {patient.age} years • {patient.gender} • {patient.phoneNumber}
              </div>
            </div>
            <div className="mt-2 sm:mt-0">
              <div className="text-right text-sm text-gray-500">
                <div>Record ID: {patient.id}</div>
                <div>Last Updated: {formattedDate}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-medium text-gray-700">Symptoms</h3>
            <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {patient.medicalDetails.symptoms || "No symptoms recorded"}
            </p>
          </div>
          
          <div>
            <h3 className="mb-2 font-medium text-gray-700">Diagnosis</h3>
            <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {patient.medicalDetails.diagnosis || "No diagnosis recorded"}
            </p>
          </div>
          
          <div>
            <h3 className="mb-2 font-medium text-gray-700">Prescription</h3>
            <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {patient.medicalDetails.prescription || "No prescription recorded"}
            </p>
          </div>
          
          <div>
            <h3 className="mb-2 font-medium text-gray-700">Additional Notes</h3>
            <p className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm">
              {patient.medicalDetails.notes || "No additional notes"}
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 px-6 py-4">
          <PrintButton />
          
          <Link href={`/doctor-dashboard/patient/${patient.id}/edit?clinic=${clinicId}`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="mr-2 h-4 w-4" />
              Edit Record
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
} 