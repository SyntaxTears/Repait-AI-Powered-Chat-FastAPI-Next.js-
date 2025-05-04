export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface DiagnosticChatProps {
  onDiagnosticComplete: (result: string, sessionId: string) => void;
  initialDiagnosis?: string | null;
  sessionId?: string | null;
  vehicleData?: any;
} 