"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button 
      variant="outline"
      className="border-blue-200 text-blue-700 hover:bg-blue-50"
      onClick={() => window.print()}
    >
      <Printer className="mr-2 h-4 w-4" />
      Print Record
    </Button>
  )
} 