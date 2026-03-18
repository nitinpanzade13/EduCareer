import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, ArrowLeft, Send, Bot, User, Sparkles,
  GraduationCap, Brain, FileText, BookOpen, Mic, Globe,
  ThumbsUp, ThumbsDown, Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: GraduationCap, text: "Which colleges are best for Computer Science?", category: "College" },
  { icon: Brain, text: "What skills should I learn for Data Science?", category: "Skills" },
  { icon: FileText, text: "How can I improve my resume?", category: "Resume" },
  { icon: BookOpen, text: "What are the trending career options in 2026?", category: "Career" },
];

const languages = [
  { code: "en", name: "English" },
  { code: "hi", name: "हिंदी" },
  { code: "mr", name: "मराठी" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! 👋 I'm your AI Career Advisor. I can help you with:\n\n• **College recommendations** based on your scores\n• **Career guidance** and pathway suggestions\n• **Skill development** advice\n• **Resume tips** and interview preparation\n• **Job market insights**\n\nHow can I assist you today?",
    timestamp: new Date(),
  },
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // 2. Call Your Backend API
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch response");

      // 3. Add AI Response
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiResponse]);

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "⚠️ Sorry, I'm having trouble connecting to the server. Please ensure your backend is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                Back
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-xl font-bold block">AI Career Advisor</span>
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Online (Gemini Flash)
                  </span>
                </div>
              </div>
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-6 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-6 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${
                  message.role === "user" 
                    ? "gradient-primary" 
                    : "bg-muted"
                }`}>
                  {message.role === "user" 
                    ? <User className="w-5 h-5 text-primary-foreground" />
                    : <Bot className="w-5 h-5 text-primary" />
                  }
                </div>
                <div className={`max-w-[80%] md:max-w-[60%] ${message.role === "user" ? "text-right" : ""}`}>
                  <div className={`rounded-2xl p-4 ${
                    message.role === "user"
                      ? "gradient-primary text-primary-foreground"
                      : "bg-card border border-border"
                  }`}>
                    <div className="whitespace-pre-wrap text-sm md:text-base">
                      {message.content.split('\n').map((line, i) => {
                        // Bold text handling
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <div key={i}>
                              {parts.map((part, index) => 
                                index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                              )}
                            </div>
                          );
                        }
                        // List handling
                        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                          return <div key={i} className="ml-4">{line}</div>;
                        }
                        return <div key={i}>{line}</div>;
                      })}
                    </div>
                  </div>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mt-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ThumbsDown className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(message.content)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-3">Suggested questions:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q.text)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <q.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{q.text}</p>
                      <p className="text-xs text-muted-foreground">{q.category}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="bg-card border border-border rounded-2xl p-3">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Mic className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Ask me anything about your career, colleges, or skills..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 border-0 focus-visible:ring-0"
              />
              <Button 
                variant="hero" 
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Powered by Google Gemini • Responses may not always be accurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}