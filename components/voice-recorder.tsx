"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2, Check, EditIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"

interface VoiceRecorderProps {
  onTranscriptionComplete: (data: {
    symptoms?: string
    diagnosis?: string
    prescription?: string
    notes?: string
  }) => void
}

export function VoiceRecorder({ onTranscriptionComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rawTranscription, setRawTranscription] = useState<string | null>(null)
  const [transcriptionPreview, setTranscriptionPreview] = useState<{
    symptoms?: string
    diagnosis?: string
    prescription?: string
    notes?: string
  } | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      setError(null)
      setRawTranscription(null)
      setTranscriptionPreview(null)
      setShowPreview(false)
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessing(true)
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

          // Convert blob to base64
          const reader = new FileReader()
          reader.readAsDataURL(audioBlob)
          reader.onloadend = async () => {
            const base64Audio = reader.result as string
            const base64Data = base64Audio.split(",")[1]

            // Send to server for processing
            const formData = new FormData()
            formData.append("audio", base64Data)

            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error("Failed to transcribe audio")
            }

            const { text, analysis } = await response.json()
            
            // Store the raw transcription
            setRawTranscription(text)
            
            // Store preview data
            if (analysis) {
              setTranscriptionPreview(analysis)
              setShowPreview(true)
            }
            
            toast({
              title: "Transcription complete",
              description: "Your dictation has been processed. You can now fill the form or make edits.",
            })
          }
        } catch (err) {
          console.error("Error processing audio:", err)
          setError("Failed to process audio. Please try again.")
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }
  
  const applyTranscription = () => {
    if (transcriptionPreview) {
      onTranscriptionComplete(transcriptionPreview)
      setShowPreview(false)
      
      toast({
        title: "Form updated",
        description: "The medical form has been filled with your dictation.",
      })
    }
  }
  
  const editBeforeApplying = () => {
    // Just apply what we have and let the user edit in the form
    applyTranscription()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-2">
        {isProcessing ? (
          <Button disabled className="rounded-full w-12 h-12 p-0">
            <Loader2 className="h-6 w-6 animate-spin" />
          </Button>
        ) : isRecording ? (
          <Button onClick={stopRecording} variant="destructive" className="rounded-full w-12 h-12 p-0">
            <Square className="h-6 w-6" />
          </Button>
        ) : (
          <Button onClick={startRecording} className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700">
            <Mic className="h-6 w-6" />
          </Button>
        )}
        <span className="text-sm">
          {isProcessing ? "Processing..." : isRecording ? "Recording... Click to stop" : "Click to record"}
        </span>
      </div>
      
      {showPreview && transcriptionPreview && (
        <Card className="w-full mt-4 mb-2 border-blue-200 bg-blue-50">
          <CardContent className="p-3 space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-blue-800">Transcription Preview</h4>
            </div>
            
            {transcriptionPreview.symptoms && (
              <div className="pl-2 border-l-2 border-blue-300">
                <span className="font-medium text-blue-700">Symptoms:</span> 
                <span className="text-gray-700">{" "}{transcriptionPreview.symptoms.substring(0, 100)}
                {transcriptionPreview.symptoms.length > 100 ? "..." : ""}</span>
              </div>
            )}
            
            {transcriptionPreview.diagnosis && (
              <div className="pl-2 border-l-2 border-blue-300">
                <span className="font-medium text-blue-700">Diagnosis:</span> 
                <span className="text-gray-700">{" "}{transcriptionPreview.diagnosis.substring(0, 100)}
                {transcriptionPreview.diagnosis.length > 100 ? "..." : ""}</span>
              </div>
            )}
            
            {transcriptionPreview.prescription && (
              <div className="pl-2 border-l-2 border-blue-300">
                <span className="font-medium text-blue-700">Prescription:</span> 
                <span className="text-gray-700">{" "}{transcriptionPreview.prescription.substring(0, 100)}
                {transcriptionPreview.prescription.length > 100 ? "..." : ""}</span>
              </div>
            )}
            
            {transcriptionPreview.notes && (
              <div className="pl-2 border-l-2 border-blue-300">
                <span className="font-medium text-blue-700">Notes:</span> 
                <span className="text-gray-700">{" "}{transcriptionPreview.notes.substring(0, 100)}
                {transcriptionPreview.notes.length > 100 ? "..." : ""}</span>
              </div>
            )}
            
            <div className="flex justify-between mt-2 pt-2 border-t border-blue-200">
              <Button size="sm" variant="outline" onClick={editBeforeApplying} className="text-xs h-8">
                <EditIcon className="h-3 w-3 mr-1" /> Edit in form
              </Button>
              <Button size="sm" onClick={applyTranscription} className="text-xs h-8 bg-blue-600 hover:bg-blue-700">
                <Check className="h-3 w-3 mr-1" /> Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
