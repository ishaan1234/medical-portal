"use client"

import { useState } from "react"
import type { Patient } from "@/lib/redis"
import { movePatientToDoctor, removePatientFromQueue } from "@/app/actions/patient-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowRight, Clock, X } from "lucide-react"
import { useRouter } from "next/navigation"

interface PatientListProps {
  patients: Patient[]
  listType: "waiting" | "doctor"
  clinicId: string
}

export function PatientList({ patients, listType, clinicId }: PatientListProps) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleMoveToDoctor = async (id: string) => {
    setPendingId(id)

    try {
      const result = await movePatientToDoctor(id, clinicId)

      if (result.success) {
        toast({
          title: "Patient moved",
          description: "Patient has been moved to the doctor's room.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move patient.",
        variant: "destructive",
      })
    } finally {
      setPendingId(null)
    }
  }

  const handleRemovePatient = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the queue?`)) {
      try {
        setRemovingId(id)
        const result = await removePatientFromQueue(id, clinicId)
        
        if (result.success) {
          toast({
            title: "Patient Removed",
            description: "The patient has been removed from the queue.",
            className: "border-green-200 bg-green-50 text-green-800",
            duration: 3000,
          })
          router.refresh()
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred.",
          variant: "destructive",
        })
      } finally {
        setRemovingId(null)
      }
    }
  }

  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          No patients {listType === "waiting" ? "in waiting room" : "with doctor"}.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <Card key={patient.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{patient.name}</h3>
                <div className="text-sm text-gray-500">
                  {patient.age} years • {patient.gender} • {patient.phoneNumber}
                </div>
                <div className="mt-1 flex items-center text-xs text-gray-400">
                  <Clock className="mr-1 h-3 w-3" />
                  {new Date(patient.createdAt).toLocaleTimeString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => handleRemovePatient(patient.id, patient.name)}
                  disabled={removingId === patient.id || pendingId === patient.id}
                >
                  <X className="h-4 w-4" />
                </Button>

                {listType === "waiting" && (
                  <Button
                    size="sm"
                    onClick={() => handleMoveToDoctor(patient.id)}
                    disabled={pendingId === patient.id || removingId === patient.id}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {pendingId === patient.id ? (
                      "Moving..."
                    ) : (
                      <>
                        Send to Doctor <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
