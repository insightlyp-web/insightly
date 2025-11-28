// components/chatbot/MessageBubble.tsx
"use client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "nixi";
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? "text-blue-100" : "text-gray-400"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

