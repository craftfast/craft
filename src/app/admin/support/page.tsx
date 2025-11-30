/**
 * Admin Support Chat Page
 *
 * Chat interface for communicating with users for support
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Send,
  RefreshCw,
  User,
  MessageSquare,
  Circle,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  messageCount: number;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  isFromAdmin: boolean;
  adminId: string | null;
  isRead: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/support");
      const data = await response.json();

      if (response.ok) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/support?userId=${userId}`);
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        // Mark messages as read
        await fetch("/api/admin/support", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        // Update unread count in conversations
        setConversations((prev) =>
          prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      // Poll for new messages every 10 seconds when chat is open
      const interval = setInterval(() => fetchMessages(selectedUserId), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedUserId || !newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        // Update last message time in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.userId === selectedUserId
              ? {
                  ...c,
                  lastMessageAt: new Date().toISOString(),
                  messageCount: c.messageCount + 1,
                }
              : c
          )
        );
      } else {
        toast.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      c.user?.email.toLowerCase().includes(searchLower) ||
      c.user?.name?.toLowerCase().includes(searchLower)
    );
  });

  const selectedUser = conversations.find(
    (c) => c.userId === selectedUserId
  )?.user;

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Support Chat
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Communicate with users for support
        </p>
      </div>

      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* Conversations List */}
        <Card className="w-80 flex-shrink-0 rounded-2xl border-neutral-200 dark:border-neutral-800 flex flex-col">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-neutral-400" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => setSelectedUserId(conv.userId)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors",
                      selectedUserId === conv.userId
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    )}
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                        {conv.user?.image ? (
                          <img
                            src={conv.user.image}
                            alt={conv.user.name || "User"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-neutral-500" />
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate text-neutral-900 dark:text-neutral-100">
                          {conv.user?.name || conv.user?.email || "Unknown"}
                        </p>
                        <span className="text-xs text-neutral-400">
                          {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {conv.messageCount} messages
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 rounded-2xl border-neutral-200 dark:border-neutral-800 flex flex-col">
          {selectedUserId && selectedUser ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-neutral-200 dark:border-neutral-800 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden rounded-full"
                    onClick={() => setSelectedUserId(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {selectedUser.image ? (
                      <img
                        src={selectedUser.image}
                        alt={selectedUser.name || "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-neutral-500" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {selectedUser.name || "No name"}
                    </CardTitle>
                    <p className="text-sm text-neutral-500">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        msg.isFromAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          msg.isFromAdmin
                            ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            msg.isFromAdmin
                              ? "text-neutral-400 dark:text-neutral-500"
                              : "text-neutral-500"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[44px] max-h-32 resize-none rounded-xl"
                    rows={1}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="rounded-full px-4"
                  >
                    {sending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-neutral-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">
                  Choose a user from the list to start chatting
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
