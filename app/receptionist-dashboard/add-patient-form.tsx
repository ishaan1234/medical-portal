"use client"

import type React from "react"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { createPatient } from "@/app/actions/patient-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={pending}>
      {pending ? "Adding..." : "Add Patient to Waiting Room"}
    </Button>
  )
}

interface AddPatientFormProps {
  clinicId: string
}

export function AddPatientForm({ clinicId }: AddPatientFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    phoneNumber: "",
    age: "",
    gender: "male",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenderChange = (value: string) => {
    setFormState((prev) => ({ ...prev, gender: value }))
  }

  const handleSubmit = async (formData: FormData) => {
    formData.append("clinicId", clinicId)
    
    const result = await createPatient(formData)

    if (result.success) {
      toast({
        title: "Patient added",
        description: `${result.patient?.name || 'Patient'} has been added to the waiting room.`,
      })

      setFormState({
        name: "",
        phoneNumber: "",
        age: "",
        gender: "male",
      })
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
      <CardContent className="pt-6">
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="clinicId" value={clinicId} />
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" value={formState.name} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" name="phoneNumber" value={formState.phoneNumber} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" type="number" value={formState.age} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label>Gender</Label>
            <RadioGroup
              name="gender"
              value={formState.gender}
              onValueChange={handleGenderChange}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
