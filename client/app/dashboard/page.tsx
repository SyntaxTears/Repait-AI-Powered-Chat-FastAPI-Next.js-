"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Cog, FileText, History } from "lucide-react";
import { DiagnosticChat } from "@/components/diagnostic-chat";
import { PartsPrediction } from "@/components/parts-prediction";
import { RepairSummary } from "@/components/repair-summary";
import { getCurrentUser } from "@/lib/auth";
import { ApiService } from "@/lib/api-service";
import { Button } from "@/components/ui/button";
export default function DashboardPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [predictedParts, setPredictedParts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("diagnostic");
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userData = await getCurrentUser();
        const userSessions = await ApiService.getDiagnosticSessions();
        setUser(userData);
        setSessions(
          userSessions.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, []);

  const handleStartDiagnostic = async (vehicleData: string) => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const sessionId = await ApiService.startDiagnosticSession({
        input: vehicleData,
      });

      // Immediately update sessions list
      const updatedSessions = await ApiService.getDiagnosticSessions();
      const sortedSessions = updatedSessions.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setSessions(sortedSessions);

      // Set current session and start WebSocket
      setCurrentSession({ id: sessionId });
      const socket = ApiService.connectDiagnosticWebSocket(
        Number(sessionId),
        (chunk: string) => {
          setDiagnosticResult((prev) => (prev || "") + chunk);
        },
        async (result: string) => {
          setDiagnosticResult(result);

          // Fetch and update session details after diagnostic completion
          try {
            const sessionDetails = await ApiService.getDiagnosticSession(
              Number(sessionId)
            );
            setSessionDetails(sessionDetails);
            setPredictedParts(sessionDetails.parts || []);
          } catch (error) {
            console.error("Failed to fetch session details", error);
          }
        },
        (error: any) => {
          console.error("WebSocket error:", error);
        }
      );
      if (socket) {
        ApiService.sendDiagnosticMessage(socket, vehicleData);
      }
    } catch (error) {
      console.error("Failed to start diagnostic session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartsPredicted = async () => {
    if (currentSession) {
      try {
        const parts = await ApiService.getPredictedParts(currentSession.id);
        setPredictedParts(parts);
        setActiveTab("summary");
      } catch (error) {
        console.error("Failed to get predicted parts:", error);
      }
    }
  };

  const handleNewSession = () => {
    ApiService.closeWebSocket();
    setDiagnosticResult(null);
    setPredictedParts([]);
    setCurrentSession(null);
    setActiveTab("diagnostic");
  };

  const handleLoadSession = (session: any) => {
    setCurrentSession(session);
    setDiagnosticResult(session.diagnosticResult);
    setPredictedParts(session.predictedParts || []);
    setActiveTab("diagnostic");
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 bg-muted/50 border-r p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Diagnostic Sessions</h2>
          <Button
            size="sm"
            variant="outline"
            disabled={isLoading}
            onClick={async () => {
              try {
                setIsLoading(true);
                const newSessionId = await ApiService.startDiagnosticSession(
                  {}
                );
                const updatedSessions =
                  await ApiService.getDiagnosticSessions();
                const sortedSessions = updatedSessions.sort(
                  (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                );
                setSessions(sortedSessions);
                setCurrentSession({ id: newSessionId });
                setDiagnosticResult(null);
                setPredictedParts([]);
              } catch (error) {
                console.error("Failed to start new session", error);
              } finally {
                setIsLoading(false);
              }
            }}
          >
            {isLoading ? "Creating..." : "New Session"}
          </Button>
        </div>

        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.session_id}
              className={`
                p-3 rounded-lg cursor-pointer transition-colors
                ${
                  currentSession?.id === session.session_id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted-foreground/10"
                }
              `}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const sessionDetails = await ApiService.getDiagnosticSession(
                    session.session_id
                  );
                  setCurrentSession({ id: session.session_id });
                  setSessionDetails(sessionDetails);
                  // Get the latest diagnostic result from the array
                  const latestDiagnostic =
                    sessionDetails.diagnostic_results?.length > 0
                      ? sessionDetails.diagnostic_results[
                          sessionDetails.diagnostic_results.length - 1
                        ].output_text
                      : null;
                  setDiagnosticResult(latestDiagnostic);
                  setPredictedParts(sessionDetails.parts || []);
                } catch (error) {
                  console.error("Failed to load session details", error);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  Session {session.session_id}
                </span>
                <span className="text-xs opacity-70">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm truncate opacity-70 mt-1">
                {session.input_text || "No input"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs defaultValue="diagnostic" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="diagnostic" className="flex-1">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Diagnostic
                </TabsTrigger>
                <TabsTrigger value="parts" className="flex-1">
                  <Cog className="mr-2 h-4 w-4" />
                  Parts
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex-1">
                  <FileText className="mr-2 h-4 w-4" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="diagnostic">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Diagnostic Chatbot</CardTitle>
                    <CardDescription>
                      Describe your car's symptoms or enter OBD codes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DiagnosticChat
                      onDiagnosticComplete={handleStartDiagnostic}
                      initialDiagnosis={diagnosticResult}
                      sessionId={currentSession?.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parts">
                <Card>
                  <CardHeader>
                    <CardTitle>Smart Parts Predictor</CardTitle>
                    <CardDescription>
                      View predicted parts based on diagnostic results
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PartsPrediction
                      diagnosticResult={diagnosticResult}
                      onPartsPredicted={handlePartsPredicted}
                      sessionId={currentSession?.id}
                      initialParts={predictedParts}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <CardTitle>Repair Order Summarizer</CardTitle>
                    <CardDescription>
                      Generate a customer-friendly repair summary
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RepairSummary
                      diagnosticResult={diagnosticResult}
                      predictedParts={predictedParts}
                      sessionId={currentSession?.id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select or create a session to begin
          </div>
        )}
      </div>
    </div>
  );
}
