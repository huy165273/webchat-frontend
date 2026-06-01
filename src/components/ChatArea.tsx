"use client";

import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter } from "next/navigation";
import TextareaAutosize from "react-textarea-autosize";

export function ChatArea() {
  const { data: session } = useSession();
  const { 
    activeConversationId, setActiveConversationId, 
    messages, setMessages, addMessage, updateLastMessage, 
    isStreaming, setIsStreaming, 
    pendingMessage, setPendingMessage,
    conversations, setConversations 
  } = useChatStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const [loadedConvId, setLoadedConvId] = useState<number | null>(null);

  useEffect(() => {
    const id = params?.id ? Number(params.id) : null;
    if (id !== activeConversationId) {
      setActiveConversationId(id);
    }
  }, [params?.id, activeConversationId, setActiveConversationId]);

  useEffect(() => {
    let isMounted = true;
    if (session?.accessToken && activeConversationId) {
      fetch(`http://localhost:8080/api/chat/${activeConversationId}/messages`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setMessages(data);
          setLoadedConvId(activeConversationId);
        }
      })
      .catch(err => {
        console.error(err);
        if (isMounted) setLoadedConvId(activeConversationId);
      });
    } else if (!activeConversationId) {
      setMessages([]);
      setLoadedConvId(null);
    }
    return () => { isMounted = false; };
  }, [activeConversationId, session, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = useCallback(async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input;
    if (!userMsg.trim() || !session?.accessToken || isStreaming) return;
    if (!overrideMsg) setInput("");

    if (!activeConversationId) {
      setIsStreaming(true);
      try {
        const res = await fetch("http://localhost:8080/api/conversations", {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ title: userMsg.slice(0, 30) || "New Chat" })
        });
        const newConv = await res.json();
        setConversations([newConv, ...conversations]);
        setPendingMessage(userMsg);
        router.push(`/c/${newConv.id}`);
      } catch (error) {
        console.error("Failed to create chat", error);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    addMessage({ id: Date.now(), role: 'user', content: userMsg });
    addMessage({ id: Date.now() + 1, role: 'assistant', content: '' });
    setIsStreaming(true);

    try {
      const response = await fetch(`http://localhost:8080/api/chat/${activeConversationId}/stream`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || "";
        
        for (let line of lines) {
          line = line.replace(/\r$/, '');
          if (line.startsWith('data:')) {
            const content = line.slice(5);
            updateLastMessage(content);
          }
        }
      }
    } catch (error) {
      console.error("Error streaming:", error);
    } finally {
      setIsStreaming(false);
    }
  }, [input, session, isStreaming, activeConversationId, conversations, router, addMessage, setConversations, setPendingMessage, setIsStreaming, updateLastMessage]);

  useEffect(() => {
    if (activeConversationId && activeConversationId === loadedConvId && pendingMessage && !isStreaming) {
      const msg = pendingMessage;
      setPendingMessage(null);
      sendMessage(msg);
    }
  }, [activeConversationId, loadedConvId, pendingMessage, isStreaming, sendMessage, setPendingMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const inputAreaJSX = (
    <div className="shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-3xl mx-auto flex gap-2 items-end">
        <TextareaAutosize
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          minRows={1}
          maxRows={5}
          disabled={isStreaming}
        />
        <Button onClick={() => sendMessage()} disabled={isStreaming || !input.trim()} className="mb-0.5">
          <Send size={18} />
        </Button>
      </div>
    </div>
  );

  const isHomePage = !params?.id && !activeConversationId;

  if (isHomePage) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-white dark:bg-gray-800 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h2 className="text-3xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
            Welcome to Web Chat AI
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Khi bạn sẵn sàng, chúng ta có thể bắt đầu.
          </p>
        </div>
        {inputAreaJSX}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <Bot size={20} />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100'}`}>
                {msg.role === 'assistant' ? (
                  <div className="prose dark:prose-invert max-w-none break-words">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </div>
      {inputAreaJSX}
    </div>
  );
}
