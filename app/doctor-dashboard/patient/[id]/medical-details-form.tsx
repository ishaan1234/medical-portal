"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { updateMedicalDetails, completePatientVisit } from "@/app/actions/patient-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { VoiceRecorder } from "@/components/voice-recorder"
import { CheckCircle, Mic } from "lucide-react"
import type { Patient } from "@/lib/redis"

interface MedicalDetailsFormProps {
  patientId: string
  initialData?: Patient["medicalDetails"]
  isEdit?: boolean
  clinicId: string
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={pending}>
      {pending ? "Saving..." : "Save Medical Details"}
    </Button>
  )
}

function CompleteButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)
    await onClick()
    setIsPending(false)
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={disabled || isPending}>
      {isPending ? "Completing..." : "Complete Visit"}
    </Button>
  )
}

export function MedicalDetailsForm({ patientId, initialData, isEdit = false, clinicId }: MedicalDetailsFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [formState, setFormState] = useState({
    symptoms: initialData?.symptoms || "",
    diagnosis: initialData?.diagnosis || "",
    prescription: initialData?.prescription || "",
    notes: initialData?.notes || "",
  })
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const [recentlyAutofilled, setRecentlyAutofilled] = useState<Record<string, boolean>>({
    symptoms: false,
    diagnosis: false,
    prescription: false,
    notes: false
  })

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
    
    // Reset highlighting for the field being edited manually
    if (recentlyAutofilled[name as keyof typeof recentlyAutofilled]) {
      setRecentlyAutofilled(prev => ({
        ...prev,
        [name]: false
      }))
    }
    
    // Reset saved state when form changes
    if (savedSuccessfully) {
      setSavedSuccessfully(false)
    }
  }

  const handleVoiceInput = (data: {
    symptoms?: string
    diagnosis?: string
    prescription?: string
    notes?: string
  }) => {
    // Track which fields were auto-filled
    const filledFields: Record<string, boolean> = {
      symptoms: false,
      diagnosis: false,
      prescription: false,
      notes: false
    }
    
    // Update form state with auto-filled data
    setFormState((prev) => {
      const newState = { ...prev }
      
      if (data.symptoms) {
        newState.symptoms = data.symptoms
        filledFields.symptoms = true
      }
      
      if (data.diagnosis) {
        newState.diagnosis = data.diagnosis
        filledFields.diagnosis = true
      }
      
      if (data.prescription) {
        newState.prescription = data.prescription
        filledFields.prescription = true
      }
      
      if (data.notes) {
        newState.notes = data.notes
        filledFields.notes = true
      }
      
      return newState
    })
    
    // Highlight auto-filled fields
    setRecentlyAutofilled(filledFields)
    
    // Remove highlighting after 5 seconds
    setTimeout(() => {
      setRecentlyAutofilled({
        symptoms: false,
        diagnosis: false,
        prescription: false,
        notes: false
      })
    }, 5000)

    toast({
      title: "Voice input processed",
      description: "The medical details have been filled from your dictation.",
    })
  }

  const saveForm = async (formData: FormData) => {
    // Add clinicId to form data
    formData.append("clinicId", clinicId)
    
    try {
      const result = await updateMedicalDetails(patientId, formData)

      if (result.success) {
        setSavedSuccessfully(true)
        
        // Show a more prominent success notification with a simple title
        toast({
          title: "Success!",
          description: "Medical details saved successfully!",
          className: "border-green-200 bg-green-50 text-green-800",
          duration: 3000, // Auto dismiss after 3 seconds
        })
        
        // If editing from past records, redirect back to records page after saving
        if (isEdit) {
          setTimeout(() => {
            router.push(`/doctor-dashboard/past-records?clinic=${clinicId}`)
          }, 1500)
        }
        
        return result
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
        
        return result
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Submission Error",
        description: "There was a problem submitting the form. Please try again.",
        variant: "destructive",
      })
      
      return { success: false, message: "An error occurred while saving" }
    }
  }
  
  // Form action that doesn't return anything (void)
  const handleSubmit = async (formData: FormData) => {
    await saveForm(formData)
  }

  const handleCompleteVisit = async () => {
    // First save the form data
    if (formRef.current) {
      const formData = new FormData(formRef.current)
      
      // Add the required fields
      formData.append("symptoms", formState.symptoms)
      formData.append("diagnosis", formState.diagnosis)
      formData.append("prescription", formState.prescription)
      formData.append("notes", formState.notes)
      formData.append("clinicId", clinicId)
      
      // Save the form data first
      const saveResult = await saveForm(formData)
      
      // If saving failed, don't complete the visit
      if (!saveResult?.success) {
        return
      }
    }
    
    // Then complete the visit
    const result = await completePatientVisit(patientId, clinicId)

    if (result.success) {
      toast({
        title: "Visit Completed",
        description: "Medical details saved and patient visit completed.",
        className: "border-green-200 bg-green-50 text-green-800",
      })
      router.push(`/doctor-dashboard?clinic=${clinicId}`)
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <form ref={formRef} action={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <input type="hidden" name="clinicId" value={clinicId} />
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Medical Record</h3>
            {!isEdit && <VoiceRecorder onTranscriptionComplete={handleVoiceInput} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms" className="flex items-center">
              Symptoms
              {recentlyAutofilled.symptoms && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center">
                  <Mic className="h-3 w-3 mr-1" /> Auto-filled
                </span>
              )}
            </Label>
            <Textarea
              id="symptoms"
              name="symptoms"
              value={formState.symptoms}
              onChange={handleChange}
              rows={3}
              placeholder="Patient's symptoms..."
              className={recentlyAutofilled.symptoms ? "border-blue-300 bg-blue-50" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="flex items-center">
              Diagnosis
              {recentlyAutofilled.diagnosis && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center">
                  <Mic className="h-3 w-3 mr-1" /> Auto-filled
                </span>
              )}
            </Label>
            <Textarea
              id="diagnosis"
              name="diagnosis"
              value={formState.diagnosis}
              onChange={handleChange}
              rows={3}
              placeholder="Your diagnosis..."
              className={recentlyAutofilled.diagnosis ? "border-blue-300 bg-blue-50" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prescription" className="flex items-center">
              Prescription
              {recentlyAutofilled.prescription && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center">
                  <Mic className="h-3 w-3 mr-1" /> Auto-filled
                </span>
              )}
            </Label>
            <Textarea
              id="prescription"
              name="prescription"
              value={formState.prescription}
              onChange={handleChange}
              rows={3}
              placeholder="Medications prescribed..."
              className={recentlyAutofilled.prescription ? "border-blue-300 bg-blue-50" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center">
              Additional Notes
              {recentlyAutofilled.notes && (
                <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center">
                  <Mic className="h-3 w-3 mr-1" /> Auto-filled
                </span>
              )}
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formState.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes or instructions..."
              className={recentlyAutofilled.notes ? "border-blue-300 bg-blue-50" : ""}
            />
          </div>
          
          {savedSuccessfully && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Details saved successfully!
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <SubmitButton />
          {!isEdit && (
            <CompleteButton onClick={handleCompleteVisit} disabled={!formState.diagnosis || !formState.prescription} />
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
