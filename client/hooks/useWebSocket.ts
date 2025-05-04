import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '@/lib/api-service';
import { Message } from '@/types/chat';
import type React from 'react';

interface UseWebSocketProps {
  sessionId: number | null;
  vehicleData: any;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsLoading: (isLoading: boolean) => void;
}

export const useWebSocket = ({ sessionId, vehicleData, setMessages, setIsLoading }: UseWebSocketProps) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      ApiService.sendDiagnosticMessage(socket, message);
    }
  }, [socket]);

  useEffect(() => {
    if (sessionId && !socket) {
      const newSocket = ApiService.connectDiagnosticWebSocket(
        sessionId,
        (chunk: string) => {
          setMessages((prev: Message[]) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: lastMessage.content + chunk, role: 'assistant' as const }
              ];
            }
            return [...prev, { role: 'assistant' as const, content: chunk }];
          });
        },
        (result: string) => {
          setMessages((prev: Message[]) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: result, role: 'assistant' as const }
              ];
            }
            return [...prev, { role: 'assistant' as const, content: result }];
          });
          setIsLoading(false);
        },
        (error: string) => {
          setMessages((prev: Message[]) => [...prev, { role: 'assistant' as const, content: `Error: ${error}` }]);
          setConnectionStatus('error');
          setIsLoading(false);
        }
      );

      if (newSocket) {
        setSocket(newSocket);
        setCurrentSessionId(sessionId);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    }

    return () => {
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
        setSocket(null);
        setCurrentSessionId(null);
        setConnectionStatus('connecting');
        setIsLoading(false);
      }
    };
  }, [sessionId, socket, setMessages, setIsLoading]);

  return { socket, currentSessionId, sendMessage, connectionStatus };
}; 