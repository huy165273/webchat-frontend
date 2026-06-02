"use client";

import { useSession, signOut } from "next-auth/react";
import { useChatStore } from "@/store/chatStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, MessageSquare, LogOut, MoreVertical, Pencil, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsModal } from "@/components/SettingsModal";

export function Sidebar() {
  const { data: session } = useSession() as any;
  const { conversations, setConversations, activeConversationId } = useChatStore();
  const router = useRouter();
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (session?.accessToken) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/conversations`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      })
      .then(res => res.json())
      .then(data => setConversations(data));
    }
  }, [session, setConversations]);

  const createNewChat = () => {
    router.push("/");
  };

  const startEditing = (id: number, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const saveEdit = async (id: number) => {
    if (!editTitle.trim() || !session?.accessToken) {
      setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/conversations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: editTitle })
      });
      if (res.ok) {
        const updated = await res.json();
        setConversations(conversations.map(c => c.id === id ? { ...c, title: updated.title } : c));
      }
    } catch (e) {
      console.error(e);
    }
    setEditingId(null);
  };

  const deleteConversation = async (id: number) => {
    if (!session?.accessToken) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/conversations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      setConversations(conversations.filter(c => c.id !== id));
      if (activeConversationId === id) {
        router.push("/");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col p-4 shrink-0">
      <Button onClick={createNewChat} className="mb-4 w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700">
        <PlusCircle size={18} />
        New Chat
      </Button>

      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-3">
          {conversations.map((conv) => (
            <div 
              key={conv.id} 
              onClick={() => { if (editingId !== conv.id) router.push(`/c/${conv.id}`); }}
              className={`w-full group flex items-center justify-between p-2 rounded text-sm cursor-pointer transition-colors ${activeConversationId === conv.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              {editingId === conv.id ? (
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(conv.id)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded outline-none w-full"
                />
              ) : (
                <div className="flex-1 text-left flex items-center gap-2 truncate overflow-hidden">
                  <MessageSquare size={16} className="shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
              )}
              
              {editingId !== conv.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-gray-700 shrink-0 inline-flex items-center justify-center rounded-md outline-none transition-opacity">
                    <MoreVertical size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEditing(conv.id, conv.title)}>
                      <Pencil size={14} className="mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteConversation(conv.id)} className="text-red-500 focus:text-red-500">
                      <Trash size={14} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="mt-auto pt-4 border-t border-gray-800">
        <SettingsModal>
          <div className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded cursor-pointer transition-colors w-full text-left">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate">{session?.user?.name}</span>
            </div>
          </div>
        </SettingsModal>
      </div>
    </div>
  );
}
