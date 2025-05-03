"use client"

import { useState, useEffect } from "react"
import { Patient } from "@/lib/redis"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface PatientHistoryProps {
  patientName: string
  patientPhone: string
  clinicId: string
}

export function PatientHistory({ patientName, patientPhone, clinicId }: PatientHistoryProps) {
  const [history, setHistory] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const response = await fetch(`/api/patient-history?name=${encodeURIComponent(patientName)}&phone=${encodeURIComponent(patientPhone)}&clinic=${encodeURIComponent(clinicId)}`)
        
        if (response.ok) {
          const data = await response.json()
          setHistory(data)
        } else {
          console.error("Failed to fetch patient history")
        }
      } catch (error) {
        console.error("Error fetching patient history:", error)
      } finally {
        setLoading(false)
      }
    }

    if (patientName && patientPhone && clinicId) {
      fetchHistory()
    }
  }, [patientName, patientPhone, clinicId])

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileText className="mr-2 h-5 w-5" />
            Patient Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileText className="mr-2 h-5 w-5" />
            Patient Medical History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-500">No previous medical records found for this patient.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <FileText className="mr-2 h-5 w-5" />
          Patient Medical History ({history.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list">
          <TabsList className="mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-2">
            {history.map((record, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {record.medicalDetails?.diagnosis || "No diagnosis recorded"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {record.medicalDetails?.prescription ? `Prescription: ${record.medicalDetails.prescription.substring(0, 50)}${record.medicalDetails.prescription.length > 50 ? '...' : ''}` : "No prescription"}
                  </div>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {new Date(record.medicalDetails?.updatedAt || record.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="detailed">
            <Accordion type="single" collapsible className="w-full">
              {history.map((record, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-sm">
                    <div className="flex w-full items-center justify-between pr-4 text-left">
                      <span>{record.medicalDetails?.diagnosis || "No diagnosis recorded"}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(record.medicalDetails?.updatedAt || record.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-2 px-1 pt-2 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-700">Symptoms:</h4>
                        <p className="text-gray-600">
                          {record.medicalDetails?.symptoms || "No symptoms recorded"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">Diagnosis:</h4>
                        <p className="text-gray-600">
                          {record.medicalDetails?.diagnosis || "No diagnosis recorded"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">Prescription:</h4>
                        <p className="text-gray-600">
                          {record.medicalDetails?.prescription || "No prescription recorded"}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700">Notes:</h4>
                        <p className="text-gray-600">
                          {record.medicalDetails?.notes || "No additional notes"}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 