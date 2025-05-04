"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { predictParts } from "@/lib/api";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface PartsPredictionProps {
  diagnosticResult: string | null;
  onPartsPredicted: (parts: any[]) => void;
  sessionId: string | null;
  initialParts?: any[];
}

interface Part {
  id: string;
  name: string;
  confidence: number;
  selected: boolean;
  price?: string;
}

export function PartsPrediction({
  diagnosticResult,
  onPartsPredicted,
  sessionId,
  initialParts = [],
}: PartsPredictionProps) {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (diagnosticResult && !initialParts.length && sessionId) {
      predictPartsFromAPI();
    } else if (initialParts.length) {
      setParts(initialParts);
    }
  }, [diagnosticResult, initialParts, sessionId]);

  const predictPartsFromAPI = async () => {
    if (!diagnosticResult || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const predictedParts = await predictParts(Number.parseInt(sessionId));

      const partsWithSelection = predictedParts.map((part: any) => ({
        ...part,
        selected: part.selected !== undefined ? part.selected : true,
      }));

      setParts(partsWithSelection);
      onPartsPredicted(partsWithSelection);
    } catch (error) {
      console.error("Error predicting parts:", error);
      setError("Failed to predict parts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartToggle = (partId: string) => {
    setParts((prevParts) =>
      prevParts.map((part) =>
        part.id === partId ? { ...part, selected: !part.selected } : part
      )
    );
  };

  const handleConfirm = () => {
    const selectedParts = parts.filter((part) => part.selected);
    onPartsPredicted(selectedParts);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">
          Analyzing diagnostic results and predicting parts...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={predictPartsFromAPI}>Try Again</Button>
      </div>
    );
  }

  if (!diagnosticResult) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <p className="text-muted-foreground mb-4">
          No diagnostic result available. Please complete a diagnostic first.
        </p>
      </div>
    );
  }

  if (!parts.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px]">
        <Button onClick={predictPartsFromAPI} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Generic parts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.map((part) => (
            <TableRow key={part.id}>
              <TableCell>{part.name}</TableCell>
              <TableCell>{Math.round(part.confidence * 100)}%</TableCell>
              <TableCell>{part.price || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
