"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Copy, Download } from "lucide-react"
import { generateRepairSummary } from "@/lib/api"

interface RepairSummaryProps {
  diagnosticResult: string | null
  predictedParts: any[]
  sessionId: string | null
}

export function RepairSummary({ diagnosticResult, predictedParts, sessionId }: RepairSummaryProps) {
  const [notes, setNotes] = useState("")
  const [summary, setSummary] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateSummary = async () => {
    if (!diagnosticResult || !sessionId) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await generateRepairSummary(Number.parseInt(sessionId), notes)
      setSummary(result.summary_text)
    } catch (error) {
      console.error("Error generating summary:", error)
      setError("Failed to generate summary. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(summary)
  }

  if (!diagnosticResult || predictedParts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <p className="text-muted-foreground mb-4">
          Please complete a diagnostic and select parts before generating a summary.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Additional Notes</h3>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes or observations about the repair..."
          className="min-h-[100px]"
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={generateSummary} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Summary"
          )}
        </Button>
      </div>

      {error && <div className="bg-destructive/15 text-destructive p-3 rounded-md">{error}</div>}

      {summary && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end space-x-2 mb-4">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <div className="whitespace-pre-wrap">{summary}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
