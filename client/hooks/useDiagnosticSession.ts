import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/chat';

interface UseDiagnosticSessionProps {
  initialDiagnosis?: string | null;
  vehicleData?: any;
}

export const useDiagnosticSession = ({ initialDiagnosis, vehicleData }: UseDiagnosticSessionProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (initialDiagnosis) {
      setMessages([{ role: 'assistant', content: initialDiagnosis }]);
    }
  }, [initialDiagnosis]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    scrollToBottom,
    messagesEndRef,
  };
}; 