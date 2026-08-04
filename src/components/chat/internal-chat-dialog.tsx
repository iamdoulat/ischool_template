"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    MessageSquare,
    Send,
    Paperclip,
    UserPlus,
    Check,
    X,
    Search,
    Loader2,
    FileText,
    Download,
    Minus,
    Maximize2,
    Minimize2,
    UserCheck,
    Clock,
    Sparkles
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

interface Contact {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    chat_presence: "online" | "offline" | "invisible";
    last_message?: string;
    last_message_at?: string;
    has_attachment?: boolean;
    unread_count?: number;
}

interface RequestUser {
    id: number;
    sender_id?: number;
    sender_name?: string;
    sender_email?: string;
    sender_role?: string;
    sender_avatar?: string;
    name?: string;
    email?: string;
    role?: string;
    avatar?: string;
    chat_presence?: string;
    connection_status?: "none" | "pending_sent" | "pending_received" | "accepted" | "rejected";
    created_at?: string;
}

interface Message {
    id: number;
    sender_id: number;
    receiver_id: number;
    message?: string;
    attachment_path?: string;
    attachment_name?: string;
    attachment_size?: number;
    attachment_type?: string;
    attachment_url?: string;
    is_read: boolean;
    created_at: string;
}

interface InternalChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialContactId?: number | null;
    currentUser?: any;
}

export function InternalChatDialog({
    open,
    onOpenChange,
    initialContactId,
    currentUser
}: InternalChatDialogProps) {
    const { toast } = useToast();
    const getImageUrl = useImageUrl();

    const [mounted, setMounted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Draggable position state for launcher button
    const [buttonPos, setButtonPos] = useState<{ x: number; y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragDistanceRef = useRef(0);

    const [activeTab, setActiveTab] = useState<"chats" | "requests" | "add">("chats");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [requests, setRequests] = useState<RequestUser[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<RequestUser[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [userPresence, setUserPresence] = useState<"online" | "offline" | "invisible">("online");
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Mouse Dragging Logic for floating chat icon
    const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        if (e.button !== 0) return; // Left click only
        const targetEl = e.currentTarget as HTMLElement;
        const rect = targetEl.getBoundingClientRect();
        isDraggingRef.current = true;
        dragDistanceRef.current = 0;
        dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            dragDistanceRef.current += 1;

            const newX = Math.max(10, Math.min(window.innerWidth - 70, e.clientX - dragOffsetRef.current.x));
            const newY = Math.max(10, Math.min(window.innerHeight - 70, e.clientY - dragOffsetRef.current.y));

            setButtonPos({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                setTimeout(() => setIsDragging(false), 50);
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, []);

    const fetchContacts = useCallback(async (isInitial = false) => {
        if (isInitial) setLoadingContacts(true);
        try {
            const res = await api.get("/chat/contacts", { skipGlobalErrorHandler: true });
            if (res.data?.success) {
                const list: Contact[] = res.data.data || [];
                setContacts((prev) => {
                    if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
                    return list;
                });
                const unreadSum = list.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
                setTotalUnreadCount(unreadSum);
            }
        } catch {
            // Silence
        } finally {
            if (isInitial) setLoadingContacts(false);
        }
    }, []);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await api.get("/chat/requests", { skipGlobalErrorHandler: true });
            if (res.data?.success) {
                const list = res.data.data || [];
                setRequests((prev) => {
                    if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
                    return list;
                });
            }
        } catch {
            // Silence
        }
    }, []);

    const fetchMessages = useCallback(async (contactId: number, isInitial = false) => {
        if (isInitial) setLoadingMessages(true);
        try {
            const res = await api.get(`/chat/messages/${contactId}`, { skipGlobalErrorHandler: true });
            if (res.data?.success) {
                const list: Message[] = res.data.data || [];
                setMessages((prev) => {
                    if (prev.length === list.length && prev[prev.length - 1]?.id === list[list.length - 1]?.id) {
                        return prev;
                    }
                    return list;
                });
            }
        } catch {
            // Silence
        } finally {
            if (isInitial) setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts(true);
        fetchRequests();
        const interval = setInterval(() => {
            fetchContacts(false);
            fetchRequests();
        }, 10000);
        return () => clearInterval(interval);
    }, [fetchContacts, fetchRequests]);

    useEffect(() => {
        if (selectedContact && open && !isMinimized) {
            fetchMessages(selectedContact.id, true);
            const interval = setInterval(() => {
                fetchMessages(selectedContact.id, false);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [selectedContact, open, isMinimized, fetchMessages]);

    const prevMsgLengthRef = useRef(0);
    useEffect(() => {
        if (messages.length > prevMsgLengthRef.current) {
            scrollToBottom();
        }
        prevMsgLengthRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        if (initialContactId && contacts.length > 0) {
            const target = contacts.find(c => c.id === initialContactId);
            if (target) setSelectedContact(target);
        }
    }, [initialContactId, contacts]);

    const handleSearchUsers = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchingUsers(true);
        try {
            const res = await api.get("/chat/search-users", {
                params: { search: query.trim() },
                skipGlobalErrorHandler: true
            });
            if (res.data?.success) {
                setSearchResults(res.data.data || []);
            }
        } catch {
            // Silence
        } finally {
            setSearchingUsers(false);
        }
    };

    const handleSendContactRequest = async (receiverId: number) => {
        try {
            const res = await api.post("/chat/request", { receiver_id: receiverId });
            if (res.data?.success) {
                toast({ title: "Success", description: "Contact request sent!" });
                handleSearchUsers(searchQuery);
                fetchRequests();
            }
        } catch {
            toast({ title: "Error", description: "Failed to send request.", variant: "destructive" });
        }
    };

    const handleRespondRequest = async (requestId: number, action: "accept" | "reject") => {
        try {
            const res = await api.post(`/chat/request/${requestId}/respond`, { action });
            if (res.data?.success) {
                toast({
                    title: "Success",
                    description: `Request ${action === "accept" ? "accepted" : "rejected"}!`
                });
                fetchRequests();
                fetchContacts();
            }
        } catch {
            toast({ title: "Error", description: "Failed to process request.", variant: "destructive" });
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check 5 MB limit (5120 KB = 5 * 1024 * 1024 bytes)
        const maxBytes = 5 * 1024 * 1024;
        if (file.size > maxBytes) {
            toast({
                title: "File Too Large",
                description: "Attachment size must not exceed 5 MB.",
                variant: "destructive"
            });
            return;
        }

        setSelectedFile(file);
        if (file.type.startsWith("image/")) {
            setFilePreviewUrl(URL.createObjectURL(file));
        } else {
            setFilePreviewUrl(null);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContact || (!inputText.trim() && !selectedFile)) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("receiver_id", selectedContact.id.toString());
            if (inputText.trim()) formData.append("message", inputText.trim());
            if (selectedFile) formData.append("attachment", selectedFile);

            const res = await api.post("/chat/messages", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.data?.success) {
                setInputText("");
                setSelectedFile(null);
                setFilePreviewUrl(null);
                fetchMessages(selectedContact.id);
                fetchContacts();
            }
        } catch {
            toast({
                title: "Failed",
                description: "Could not send message. Please ensure the contact request is accepted.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const handleUpdatePresence = async (presence: "online" | "offline" | "invisible") => {
        setUserPresence(presence);
        try {
            await api.post("/chat/presence", { presence });
            toast({ title: "Status Updated", description: `You are now ${presence}.` });
        } catch {
            // Silence
        }
    };

    // Toggle Chat window when clicking the floating launcher button
    const handleLauncherClick = () => {
        if (dragDistanceRef.current <= 5) {
            if (open && !isMinimized) {
                onOpenChange(false);
            } else {
                onOpenChange(true);
                setIsMinimized(false);
            }
        }
    };

    if (!mounted) return null;

    return createPortal(
        <>
            {/* PERMANENT Floating Bottom-Right Chat Launcher Button (PORTALED DIRECTLY TO BODY) */}
            <div
                onMouseDown={handleMouseDown}
                onClick={handleLauncherClick}
                style={buttonPos ? { left: `${buttonPos.x}px`, top: `${buttonPos.y}px`, bottom: "auto", right: "auto" } : undefined}
                className={cn(
                    "fixed bottom-20 md:bottom-18 right-4 sm:right-6 z-[99999] w-14 h-14 rounded-full bg-gradient-to-br from-[#FF9800] via-[#818cf8] to-[#6366F1] hover:from-[#f59e0b] hover:to-[#4f46e5] text-white shadow-2xl transition-all duration-150 hidden md:flex items-center justify-center cursor-grab active:cursor-grabbing group select-none touch-none",
                    open && !isMinimized ? "ring-4 ring-primary/40 scale-105" : "",
                    isDragging ? "scale-110 shadow-indigo-500/50" : "hover:scale-110"
                )}
                title="Click to toggle chat or drag anywhere"
            >
                <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-black text-[11px] h-5.5 min-w-[22px] px-1.5 rounded-full flex items-center justify-center border-2 border-background shadow-lg animate-bounce">
                        {totalUnreadCount}
                    </span>
                )}
            </div>

            {/* Opened / Floating Chat Window (renders floating at bottom right of screen) */}
            {open && !isMinimized && (
                <div
                    className={cn(
                        "fixed z-[99998] bg-card/98 backdrop-blur-2xl border border-muted/60 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-300",
                        isMaximized
                            ? "top-14 bottom-4 left-4 right-4 md:left-20 animate-in zoom-in-95"
                            : "bottom-[88px] md:bottom-36 right-4 sm:right-6 w-[95vw] sm:w-[720px] md:w-[780px] h-[560px] max-h-[75vh] animate-in slide-in-from-bottom-5"
                    )}
                >
                    {/* Left Sidebar: Contacts, Requests, Status & Add */}
                    <div className="w-full md:w-80 border-r border-muted/50 flex flex-col bg-muted/20 shrink-0">
                        {/* Header Presence Selector & Controls */}
                        <div className="p-3 border-b border-muted/50 bg-muted/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center shadow-sm">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <span className="text-xs font-bold text-foreground">Internal Chat</span>
                            </div>

                            {/* Presence Menu */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={userPresence}
                                    onChange={(e) => handleUpdatePresence(e.target.value as any)}
                                    className="bg-background border border-muted/60 text-[11px] font-semibold rounded-full py-0.5 pl-2 pr-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                >
                                    <option value="online">🟢 Online</option>
                                    <option value="offline">⚪ Offline</option>
                                    <option value="invisible">👻 Invisible</option>
                                </select>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center p-2 gap-1 border-b border-muted/40 bg-muted/10">
                            <button
                                type="button"
                                onClick={() => setActiveTab("chats")}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center",
                                    activeTab === "chats" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/40"
                                )}
                            >
                                Chats ({contacts.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("requests")}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-center relative",
                                    activeTab === "requests" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/40"
                                )}
                            >
                                Requests
                                {requests.length > 0 && (
                                    <span className="ml-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                                        {requests.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("add")}
                                className={cn(
                                    "py-1.5 px-3 text-xs font-bold rounded-lg transition-all text-center flex items-center gap-1",
                                    activeTab === "add" ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:bg-muted/40"
                                )}
                                title="Add Contact"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {/* Tab 1: Chats List */}
                        {activeTab === "chats" && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                {loadingContacts ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                                        Loading contacts...
                                    </div>
                                ) : contacts.length > 0 ? (
                                    contacts.map((contact) => (
                                        <div
                                            key={contact.id}
                                            onClick={() => setSelectedContact(contact)}
                                            className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all relative group/contact",
                                                selectedContact?.id === contact.id
                                                    ? "bg-primary/15 border border-primary/30"
                                                    : "hover:bg-muted/40"
                                            )}
                                        >
                                            <div className="relative shrink-0">
                                                <Avatar className="h-9 w-9 border border-muted/50">
                                                    <AvatarImage src={getImageUrl(contact.avatar)} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                        {contact.name[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className={cn(
                                                    "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background",
                                                    contact.chat_presence === "online" ? "bg-emerald-500" : "bg-gray-400"
                                                )} />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-foreground truncate group-hover/contact:text-primary">
                                                        {contact.name}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                                        {contact.role}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                                    {contact.has_attachment ? "📷 Attachment" : (contact.last_message || "No messages yet")}
                                                </p>
                                            </div>

                                            {contact.unread_count ? contact.unread_count > 0 ? (
                                                <span className="h-4.5 w-4.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shrink-0 animate-pulse">
                                                    {contact.unread_count}
                                                </span>
                                            ) : null : null}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-xs text-muted-foreground italic">
                                        No chat contacts. Click &quot;+&quot; to send contact requests.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 2: Incoming Requests */}
                        {activeTab === "requests" && (
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                {requests.length > 0 ? (
                                    requests.map((req) => (
                                        <div key={req.id} className="p-3 bg-card border border-muted/50 rounded-xl space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={getImageUrl(req.sender_avatar)} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                        {req.sender_name?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{req.sender_name}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">{req.sender_role}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleRespondRequest(req.id, "accept")}
                                                    className="flex-1 h-7 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg gap-1"
                                                >
                                                    <Check className="h-3 w-3" /> Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRespondRequest(req.id, "reject")}
                                                    className="flex-1 h-7 text-[11px] text-destructive hover:bg-destructive/10 rounded-lg gap-1"
                                                >
                                                    <X className="h-3 w-3" /> Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-xs text-muted-foreground italic">
                                        No pending incoming requests.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab 3: Search & Add Users */}
                        {activeTab === "add" && (
                            <div className="flex-1 flex flex-col p-2 space-y-2 overflow-hidden">
                                <div className="relative">
                                    <Input
                                        placeholder="Search staff, teacher, student..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                        className="pl-8 h-8 text-xs rounded-xl"
                                    />
                                    <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                    {searchingUsers ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground">Searching...</div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((userItem) => (
                                            <div key={userItem.id} className="p-2 bg-card border border-muted/50 rounded-xl flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Avatar className="h-7 w-7 shrink-0">
                                                        <AvatarImage src={getImageUrl(userItem.avatar)} />
                                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                            {userItem.name?.[0]?.toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">{userItem.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase">{userItem.role}</p>
                                                    </div>
                                                </div>

                                                {userItem.connection_status === "accepted" ? (
                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <UserCheck className="h-3 w-3" /> Connected
                                                    </span>
                                                ) : userItem.connection_status === "pending_sent" ? (
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> Pending
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSendContactRequest(userItem.id)}
                                                        className="h-6 text-[10px] font-bold bg-primary hover:bg-primary/90 text-white rounded-lg px-2 gap-1"
                                                    >
                                                        <UserPlus className="h-3 w-3" /> Add Request
                                                    </Button>
                                                )}
                                            </div>
                                        ))
                                    ) : searchQuery ? (
                                        <div className="p-4 text-center text-xs text-muted-foreground italic">No users found.</div>
                                    ) : (
                                        <div className="p-4 text-center text-xs text-muted-foreground italic">Type a name to search users.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Messaging Stream Area */}
                    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
                        {/* Right Header with Window Action Controls */}
                        <div className="p-3 border-b border-muted/50 bg-card flex items-center justify-between shrink-0">
                            {selectedContact ? (
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative shrink-0">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={getImageUrl(selectedContact.avatar)} />
                                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                                {selectedContact.name[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className={cn(
                                            "absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-background",
                                            selectedContact.chat_presence === "online" ? "bg-emerald-500" : "bg-gray-400"
                                        )} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-xs font-bold text-foreground leading-none truncate">{selectedContact.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.2 rounded-full uppercase">
                                                {selectedContact.role}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Internal Chat Window
                                </div>
                            )}

                            {/* Window Controls: Minimize (-), Maximize ([ ]), Close (x) */}
                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMinimized(true)}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                                    title="Minimize"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsMaximized(!isMaximized)}
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                                    title={isMaximized ? "Restore Window" : "Maximize Window"}
                                >
                                    {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onOpenChange(false)}
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg"
                                    title="Close"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Container */}
                        {selectedContact ? (
                            <>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3.5 space-y-3">
                                    {loadingMessages ? (
                                        <div className="p-6 text-center text-xs text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                                            Loading messages...
                                        </div>
                                    ) : messages.length > 0 ? (
                                        messages.map((msg) => {
                                            const isMine = currentUser && msg.sender_id === currentUser.id;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={cn("flex flex-col max-w-[78%]", isMine ? "ml-auto items-end" : "mr-auto items-start")}
                                                >
                                                    <div className={cn(
                                                        "p-3 rounded-2xl text-xs shadow-sm space-y-1.5",
                                                        isMine
                                                            ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-tr-none"
                                                            : "bg-muted/50 border border-muted/60 text-foreground rounded-tl-none"
                                                    )}>
                                                        {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}

                                                        {/* File/Image Attachment Preview */}
                                                        {msg.attachment_url && (
                                                            <div className="mt-1 pt-1 border-t border-white/20">
                                                                {msg.attachment_type === "image" ? (
                                                                    <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
                                                                        <img
                                                                            src={msg.attachment_url}
                                                                            alt={msg.attachment_name || "Image"}
                                                                            className="max-h-40 w-auto object-cover hover:scale-105 transition-transform"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <a
                                                                        href={msg.attachment_url}
                                                                        target="_blank"
                                                                        download
                                                                        rel="noopener noreferrer"
                                                                        className={cn(
                                                                            "flex items-center gap-2 p-2 rounded-xl text-xs font-semibold transition-colors",
                                                                            isMine ? "bg-white/20 text-white hover:bg-white/30" : "bg-muted text-foreground hover:bg-muted/80"
                                                                        )}
                                                                    >
                                                                        <FileText className="h-4 w-4 shrink-0" />
                                                                        <span className="truncate max-w-[130px]">{msg.attachment_name || "Attachment"}</span>
                                                                        <Download className="h-3.5 w-3.5 ml-auto shrink-0" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-12 text-center text-xs text-muted-foreground italic">
                                            No messages yet. Say hello!
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Message Input Footer */}
                                <form onSubmit={handleSendMessage} className="p-2.5 border-t border-muted/50 bg-card space-y-2 shrink-0">
                                    {selectedFile && (
                                        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-xl text-xs">
                                            <div className="flex items-center gap-2 truncate">
                                                {filePreviewUrl ? (
                                                    <img src={filePreviewUrl} alt="Preview" className="h-6 w-6 rounded object-cover" />
                                                ) : (
                                                    <FileText className="h-4 w-4 text-primary" />
                                                )}
                                                <span className="font-semibold text-primary truncate">{selectedFile.name}</span>
                                                <span className="text-[10px] text-muted-foreground">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedFile(null); setFilePreviewUrl(null); }} className="text-muted-foreground hover:text-foreground">
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
                                            title="Attach image or file (Max 5 MB)"
                                        >
                                            <Paperclip className="h-4 w-4" />
                                        </Button>

                                        <Input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 h-8 text-xs rounded-xl"
                                        />

                                        <Button
                                            type="submit"
                                            disabled={sending || (!inputText.trim() && !selectedFile)}
                                            className="h-8 px-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-xs gap-1.5 shrink-0"
                                        >
                                            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                            Send
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                                <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                <h4 className="text-xs font-bold text-foreground">Select a Chat Contact</h4>
                                <p className="text-[11px] mt-1 max-w-xs">
                                    Choose a contact from the left list or click &quot;+&quot; to send a contact request.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
