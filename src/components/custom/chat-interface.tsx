"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Mic, MicOff, Bot, User, Sparkles } from "lucide-react";
import { ParsedWorkflow } from "@/lib/groq/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  error?: string;
}

interface ChatInterfaceProps {
  user: any; // Flow user object
  onWorkflowDeploy?: (workflow: ParsedWorkflow) => void;
  isConnected?: boolean;
}

export function ChatInterface({
  user,
  onWorkflowDeploy,
  isConnected = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [pendingWorkflow, setPendingWorkflow] = useState<ParsedWorkflow | null>(
    null
  );

  // Welcome message reacts to connection changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: isConnected
          ? "👋 Welcome to FlowGPT! I'm your AI assistant for Flow blockchain automation.\n\nWhat would you like to automate? Here are some ideas:\n\n• Pay my team 100 FLOW every Friday\n• Buy 50 FLOW worth of tokens weekly\n• Claim my staking rewards monthly\n• Send 100 NFTs to whitelist on Dec 1st"
          : "👋 Welcome to FlowGPT! You can start describing your automation. To deploy on-chain, connect your wallet using the button above.",
        timestamp: new Date(),
      },
    ]);
  }, [isConnected]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const startListening = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Add a loading message from assistant
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            address: user?.addr,
            balance: await getUserBalance(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      // Remove loading message and add actual response
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const assistantMessage: Message = {
          id: `response-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        return [...filtered, assistantMessage];
      });

      // If AI generated a workflow, store it for deployment
      if (data.workflow) {
        setPendingWorkflow(data.workflow);
      }
    } catch (error) {
      // Remove loading message and add error
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I apologize, but I encountered an error. Please try again.",
          timestamp: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        };
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBalance = async (): Promise<string> => {
    if (!user?.addr) {
      console.log("No user address provided");
      return "0";
    }

    try {
      // Fetch actual Flow balance from chain
      const response = await fetch(
        `https://rest-testnet.onflow.org/v1/accounts/${user.addr}`
      );
      const data = await response.json();

      // Get FLOW balance from account
      const flowBalance = data.balance
        ? (BigInt(data.balance) / BigInt(100000000)).toString()
        : "0";

      console.log("Fetched balance:", flowBalance, "for address:", user.addr);
      return flowBalance;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return "0";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeployWorkflow = () => {
    if (pendingWorkflow && onWorkflowDeploy) {
      onWorkflowDeploy(pendingWorkflow);
      setPendingWorkflow(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `deploy-success-${Date.now()}`,
          role: "assistant",
          content:
            "✅ Workflow deployment initiated! Your automation will be active on the Flow blockchain shortly.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <Card className="border-2 border-purple-200 shadow-lg">
      <div className="p-6 pb-4 border-b bg-linear-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">FlowGPT Assistant</h2>
            <p className="text-sm text-white/80">
              Your blockchain automation partner
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-[calc(100vh-350px)] max-h-[800px]">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user"
                    ? "bg-purple-500 text-white"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {message.role === "user" ? (
                  <User className="w-5 h-5" />
                ) : (
                  <Bot className="w-5 h-5" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block max-w-[85%] rounded-lg p-4 ${
                    message.role === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  )}
                </div>
                {message.error && (
                  <div className="text-xs text-red-500 mt-1">
                    {message.error}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Deployment Prompt */}
          {pendingWorkflow && (
            <div className="flex gap-3">
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="bg-linear-to-r from-blue-50 to-purple-50 border-2 border-purple-200 rounded-lg p-4 inline-block max-w-[85%]">
                  <h3 className="font-bold mb-2">Ready to Deploy Workflow!</h3>
                  <p className="text-sm mb-3">
                    I've prepared a{" "}
                    <strong>
                      {pendingWorkflow.workflowType
                        .replace(/_/g, " ")
                        .toLowerCase()}
                    </strong>{" "}
                    workflow for you.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeployWorkflow}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      🚀 Yes, Deploy!
                    </Button>
                    <Button
                      onClick={() => setPendingWorkflow(null)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-white">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message or click the mic to speak..."
                className="min-h-[60px] max-h-[200px] resize-none pr-20"
                disabled={isLoading}
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className="h-8 w-8"
                  disabled={!recognition || isLoading}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4 text-red-500" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[60px] px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </Card>
  );
}
