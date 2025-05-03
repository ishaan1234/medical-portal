"use server"

import OpenAI from "openai"

// Configure Azure OpenAI with API keys
const TRANSCRIPTION_API_KEY = process.env.TRANSCRIPTION_API_KEY
const COMPLETION_API_KEY = process.env.COMPLETION_API_KEY

// Hardcoded endpoints for now
const TRANSCRIPTION_ENDPOINT = "https://ishaa-m4wmzkza-eastus2.openai.azure.com/openai/deployments/gpt-4o-transcribe/audio/transcriptions?api-version=2025-03-01-preview"
const COMPLETION_ENDPOINT = "https://ai-ishaang14104374ai032677685939.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview"

// Helper function to validate configuration
function validateTranscriptionConfig() {
  if (!TRANSCRIPTION_API_KEY) {
    throw new Error("Missing Azure OpenAI transcription API key")
  }
}

function validateCompletionConfig() {
  if (!COMPLETION_API_KEY) {
    throw new Error("Missing Azure OpenAI completion API key")
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    validateTranscriptionConfig()
    
    console.log("Using transcription endpoint:", TRANSCRIPTION_ENDPOINT)
    
    // Create form data
    const formData = new FormData()
    formData.append("file", audioBlob, "recording.webm")
    
    // Make a direct fetch request to Azure OpenAI using the hardcoded transcriptions endpoint
    const response = await fetch(
      TRANSCRIPTION_ENDPOINT, 
      {
        method: "POST",
        headers: {
          "api-key": TRANSCRIPTION_API_KEY!,
        },
        body: formData,
        // Disable Next.js automatic caching for this request
        cache: "no-store"
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    return result.text
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw new Error("Failed to transcribe audio")
  }
}

export async function analyzeTranscription(text: string): Promise<{
  symptoms?: string
  diagnosis?: string
  prescription?: string
  notes?: string
}> {
  try {
    validateCompletionConfig()
    
    console.log("Using completion endpoint:", COMPLETION_ENDPOINT)
    
    // For GPT completions - using the hardcoded completion endpoint
    const response = await fetch(
      COMPLETION_ENDPOINT,
      {
        method: "POST",
        headers: {
          "api-key": COMPLETION_API_KEY!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a medical assistant that extracts structured information from a doctor's dictation.
              Extract the following fields if present:
              - symptoms: Patient's symptoms
              - diagnosis: Doctor's diagnosis
              - prescription: Medications prescribed
              - notes: Additional notes or instructions
              
              Return the information in JSON format with these fields.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          response_format: { type: "json_object" },
        }),
        // Disable Next.js automatic caching for this request
        cache: "no-store"
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }
    
    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content || "{}")
    
    return {
      symptoms: result.symptoms || "",
      diagnosis: result.diagnosis || "",
      prescription: result.prescription || "",
      notes: result.notes || "",
    }
  } catch (error) {
    console.error("Error analyzing transcription:", error)
    return {}
  }
}
