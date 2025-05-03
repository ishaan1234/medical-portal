import { type NextRequest, NextResponse } from "next/server"
import { transcribeAudio, analyzeTranscription } from "@/lib/voice-transcription"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioBase64 = formData.get("audio") as string

    if (!audioBase64) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 })
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audioBase64, "base64")
    const audioBlob = new Blob([buffer], { type: "audio/webm" })

    // Transcribe using our updated Azure OpenAI function
    const text = await transcribeAudio(audioBlob)

    // Analyze the transcription
    const analysis = await analyzeTranscription(text)

    return NextResponse.json({ text, analysis })
  } catch (error) {
    console.error("Error in transcribe API:", error)
    return NextResponse.json({ error: "Failed to process audio" }, { status: 500 })
  }
}
