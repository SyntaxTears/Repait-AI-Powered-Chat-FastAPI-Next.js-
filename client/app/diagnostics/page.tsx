"use client"

import { useState } from "react"
import { DiagnosticChat } from "@/components/diagnostic-chat"

export default function DiagnosticsPage() {
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null)

  const handleDiagnosticComplete = (result: string, sessionId: string) => {
    setDiagnosticResult(result)
    // Additional logic for handling diagnostic result
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Vehicle Diagnostics</h1>
      <DiagnosticChat 
        onDiagnosticComplete={handleDiagnosticComplete} 
        vehicleData={{}} 
      />
      {diagnosticResult && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Diagnostic Result</h2>
          <p>{diagnosticResult}</p>
        </div>
      )}
    </div>
  )
}
