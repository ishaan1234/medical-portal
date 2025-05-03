"use client"

import Link from "next/link"
import { useState } from "react"
import type { Patient } from "@/lib/redis"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Edit, 
  Trash2, 
  Calendar, 
  SearchIcon
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { deletePatientRecord } from "@/app/actions/patient-actions"
import { toast } from "@/components/ui/use-toast"

interface PastRecordsListProps {
  patients: Patient[]
  clinicId: string
}

export function PastRecordsList({ patients, clinicId }: PastRecordsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medicalDetails?.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // Sort patients by date (newest first)
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const dateA = a.medicalDetails?.updatedAt || a.createdAt
    const dateB = b.medicalDetails?.updatedAt || b.createdAt
    return dateB - dateA
  })

  const handleDelete = async (patientId: string, patientName: string) => {
    if (confirm(`Are you sure you want to delete the medical record for ${patientName}?`)) {
      const result = await deletePatientRecord(patientId, clinicId)
      
      if (result.success) {
        toast({
          title: "Record Deleted",
          description: "The patient record has been successfully deleted.",
          className: "border-green-200 bg-green-50 text-green-800",
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    }
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">No past patient records found.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search by patient name or diagnosis..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {sortedPatients.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">No matching records found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedPatients.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <h3 className="font-medium">{patient.name}</h3>
                    <div className="text-sm text-gray-500">
                      {patient.age} years • {patient.gender} • {patient.phoneNumber}
                    </div>
                    {patient.medicalDetails?.diagnosis && (
                      <div className="mt-1 text-sm font-medium text-blue-600">
                        Diagnosis: {patient.medicalDetails.diagnosis}
                      </div>
                    )}
                    <div className="mt-1 flex items-center text-xs text-gray-400">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(patient.medicalDetails?.updatedAt || patient.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/doctor-dashboard/patient/${patient.id}/view?clinic=${clinicId}`}>
                      <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                        <FileText className="mr-1 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    
                    <Link href={`/doctor-dashboard/patient/${patient.id}/edit?clinic=${clinicId}`}>
                      <Button size="sm" variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(patient.id, patient.name)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 