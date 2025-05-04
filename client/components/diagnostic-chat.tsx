"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiService } from "@/lib/api-service";
import "@/styles/diagnostic-chat.css";
import { useWebSocket } from "../hooks/useWebSocket";
import { useDiagnosticSession } from "../hooks/useDiagnosticSession";
import { Message, DiagnosticChatProps } from "../types/chat";
import ReactMarkdown from "react-markdown";

interface DiagnosticSession {
  session_id: number;
  input_text: string;
  created_at: string;
}

export function DiagnosticChat({
  onDiagnosticComplete,
  initialDiagnosis = null,
  sessionId = null,
  vehicleData = null,
}: DiagnosticChatProps) {
  const {
    messages,
    setMessages,
    inputText,
    setInputText,
    isLoading,
    setIsLoading,
    scrollToBottom,
    messagesEndRef,
  } = useDiagnosticSession({ initialDiagnosis, vehicleData });

  const { socket, currentSessionId, sendMessage, connectionStatus } =
    useWebSocket({
      sessionId: sessionId ? Number(sessionId) : null,
      vehicleData,
      setMessages,
      setIsLoading,
    });

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "connecting":
        return "text-yellow-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputText };
    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      if (socket) {
        sendMessage(inputText);
      } else {
        throw new Error("Failed to establish WebSocket connection");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setMessages((prev: Message[]) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            errorMessage || "Unable to process your request"
          }. Please try again.`,
        },
      ]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px]">
      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b">
          <div className={`text-sm ${getConnectionStatusColor()}`}>
            Status: {connectionStatus}
          </div>
        </div>
        <ScrollArea className="flex-1 p-4 rounded-md border">
          <div className="space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 p-4">
                No messages yet. Start a conversation!
              </div>
            )}
            {messages.map((message: Message, index: number) => (
              <div
                key={`message-${index}`}
                className={cn(
                  "flex w-full rounded-lg px-4 py-2 mb-2",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                  "max-w-[80%]"
                )}
              >
                <div className="break-words w-full">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex w-max max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
