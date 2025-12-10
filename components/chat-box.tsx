"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import {
  ChatMessage,
  getTodayMessages,
  sendMessage,
  subscribeToMessages,
  deleteMessage,
  uploadChatImage,
} from "@/lib/api/chat";
import { getUserNames } from "@/lib/api/user-roles";
import {
  MessageCircle,
  Send,
  Trash2,
  Loader2,
  Smile,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getAvatarColor(userId: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-indigo-500",
    "bg-red-500",
  ];
  const index =
    userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

interface MessageItemProps {
  message: ChatMessage;
  userName: string;
  isOwn: boolean;
  onDelete?: () => void;
}

function MessageItem({ message, userName, isOwn, onDelete }: MessageItemProps) {
  const [showDelete, setShowDelete] = useState(false);

  const renderContent = () => {
    if (message.messageType === "image" || message.messageType === "gif") {
      return (
        <div className="relative">
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.imageUrl, "_blank")}
          />
          {message.message && <p className="mt-1 text-sm">{message.message}</p>}
        </div>
      );
    }
    return <span>{message.message}</span>;
  };

  return (
    <div
      className={cn("flex gap-2 group", isOwn && "flex-row-reverse")}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0",
          getAvatarColor(message.userId)
        )}
      >
        {userName.charAt(0).toUpperCase()}
      </div>

      <div className={cn("max-w-[75%]", isOwn && "text-right")}>
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-xs font-medium text-[#2A2A2A]",
              isOwn && "order-2"
            )}
          >
            {userName}
          </span>
          <span className={cn("text-xs text-[#2A2A2A]/40", isOwn && "order-1")}>
            {formatTime(message.$createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isOwn && showDelete && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </button>
          )}
          <div
            className={cn(
              "px-3 py-2 rounded-2xl text-sm",
              message.messageType === "image" || message.messageType === "gif"
                ? "bg-transparent p-0"
                : isOwn
                ? "bg-[#D4AF37] text-white rounded-tr-sm"
                : "bg-[#F0F0F0] text-[#2A2A2A] rounded-tl-sm"
            )}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Common emojis for quick access
const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🔥", "😍", "🎉", "👏"];

// GIF Search Component
function GifPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Using Giphy API (you can replace with your own API key)
  const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65"; // Public beta key

  const searchGifs = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Load trending GIFs
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12&rating=g`
        );
        const data = await res.json();
        setGifs(
          data.data.map(
            (g: { images: { fixed_height: { url: string } } }) =>
              g.images.fixed_height.url
          )
        );
      } catch (error) {
        console.error("Error loading GIFs:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          query
        )}&limit=12&rating=g`
      );
      const data = await res.json();
      setGifs(
        data.data.map(
          (g: { images: { fixed_height: { url: string } } }) =>
            g.images.fixed_height.url
        )
      );
    } catch (error) {
      console.error("Error searching GIFs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchGifs("");
  }, [searchGifs]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchGifs(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchGifs]);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-xl shadow-xl border border-[#E9D7B8] overflow-hidden z-50">
      <div className="p-2 border-b border-[#E9D7B8]/30 flex items-center justify-between">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm GIF..."
          className="flex-1 px-2 py-1 text-sm bg-[#F0F0F0] rounded-lg focus:outline-none"
          autoFocus
        />
        <button
          onClick={onClose}
          className="p-1 ml-2 hover:bg-[#F0F0F0] rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-48 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {gifs.map((gif, i) => (
              <img
                key={i}
                src={gif}
                alt="GIF"
                className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  onSelect(gif);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-1 border-t border-[#E9D7B8]/30 text-center">
        <span className="text-[10px] text-[#2A2A2A]/40">Powered by GIPHY</span>
      </div>
    </div>
  );
}

interface ChatBoxProps {
  className?: string;
  messagesHeight?: string;
  showHeader?: boolean;
}

export function ChatBox({
  className,
  messagesHeight = "h-96",
  showHeader = true,
}: ChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const msgs = await getTodayMessages();
      setMessages(msgs);

      // Load user names for all messages
      const userIds = [...new Set(msgs.map((m) => m.userId))];
      if (userIds.length > 0) {
        const names = await getUserNames(userIds);
        setUserNames(names);
      }

      setIsLoading(false);
      setTimeout(scrollToBottom, 100);
    };
    loadMessages();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(async (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.$id === newMsg.$id)) return prev;
        return [...prev, newMsg];
      });

      // Load user name for new message if not cached
      if (!userNames.has(newMsg.userId)) {
        const names = await getUserNames([newMsg.userId]);
        setUserNames((prev) => new Map([...prev, ...names]));
      }

      setTimeout(scrollToBottom, 100);
    });
    return () => unsubscribe();
  }, [userNames]);

  const handleSend = async (
    messageType: "text" | "image" | "gif" = "text",
    imageUrl?: string
  ) => {
    if (!user || isSending) return;
    if (messageType === "text" && !newMessage.trim()) return;

    setIsSending(true);
    const sent = await sendMessage(
      user,
      messageType === "text" ? newMessage : "",
      messageType,
      imageUrl
    );
    if (sent) {
      setNewMessage("");
      setPreviewImage(null);
    }
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleDelete = async (messageId: string) => {
    const success = await deleteMessage(messageId);
    if (success) {
      setMessages((prev) => prev.filter((m) => m.$id !== messageId));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleGifSelect = (gifUrl: string) => {
    handleSend("gif", gifUrl);
  };

  // Image upload handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ảnh phải nhỏ hơn 5MB");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  };

  const handleSendImage = async () => {
    if (!selectedFile || !user || isUploading) return;

    setIsUploading(true);
    try {
      // Upload to Appwrite Storage
      const imageUrl = await uploadChatImage(selectedFile);
      if (imageUrl) {
        await sendMessage(user, "", "image", imageUrl);
        setPreviewImage(null);
        setSelectedFile(null);
      } else {
        alert("Không thể upload ảnh. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  };

  if (!user) return null;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-[#E9D7B8]/50 shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      {showHeader && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-linear-to-r from-[#FBF8F4] to-white border-b border-[#E9D7B8]/30 hover:bg-[#FBF8F4] transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#D4AF37]" />
            <span className="font-medium text-[#2A2A2A]">Xàm xí xíu</span>
            {messages.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium">
                {messages.length}
              </span>
            )}
          </div>
          <svg
            className={cn(
              "w-5 h-5 text-[#2A2A2A]/50 transition-transform",
              isExpanded && "rotate-180"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}

      {(isExpanded || !showHeader) && (
        <>
          {/* Messages area */}
          <div
            className={cn(
              "overflow-y-auto p-4 space-y-3 bg-[#FAFAFA] transition-colors",
              messagesHeight,
              isDragging &&
                "bg-[#D4AF37]/10 border-2 border-dashed border-[#D4AF37]"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#D4AF37]/10 z-10">
                <p className="text-[#D4AF37] font-medium">Thả ảnh vào đây</p>
              </div>
            )}
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#2A2A2A]/40">
                <MessageCircle className="w-10 h-10 mb-2" />
                <p className="text-sm">Chưa có bình luận nào</p>
                <p className="text-xs">Hãy là người đầu tiên!</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageItem
                    key={msg.$id}
                    message={msg}
                    userName={userNames.get(msg.userId) || msg.userName}
                    isOwn={msg.userId === user.$id}
                    onDelete={
                      msg.userId === user.$id
                        ? () => handleDelete(msg.$id)
                        : undefined
                    }
                  />
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Image Preview */}
          {previewImage && (
            <div className="p-2 border-t border-[#E9D7B8]/30 bg-[#FBF8F4]">
              <div className="relative inline-block">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="h-20 rounded-lg object-cover"
                />
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setSelectedFile(null);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={handleSendImage}
                disabled={isUploading}
                className="ml-2 px-3 py-1 rounded-lg bg-[#D4AF37] text-white text-sm hover:bg-[#C5A028] disabled:opacity-50 flex items-center gap-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi ảnh"
                )}
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-[#E9D7B8]/30 bg-white relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  previewPosition="none"
                  skinTonePosition="none"
                  maxFrequentRows={1}
                />
              </div>
            )}

            {/* GIF Picker */}
            {showGifPicker && (
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setShowGifPicker(false)}
              />
            )}

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0",
                  getAvatarColor(user.$id)
                )}
              >
                {user.name?.charAt(0).toUpperCase() || "U"}
              </div>

              {/* Action buttons */}
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                className={cn(
                  "p-2 rounded-full hover:bg-[#F0F0F0] transition-colors",
                  showEmojiPicker && "bg-[#D4AF37]/10 text-[#D4AF37]"
                )}
              >
                <Smile className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  setShowGifPicker(!showGifPicker);
                  setShowEmojiPicker(false);
                }}
                className={cn(
                  "p-2 rounded-full hover:bg-[#F0F0F0] transition-colors text-xs font-bold",
                  showGifPicker && "bg-[#D4AF37]/10 text-[#D4AF37]"
                )}
              >
                GIF
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-[#F0F0F0] transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Message input */}
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-[#F0F0F0] focus-within:ring-2 focus-within:ring-[#D4AF37]/30">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => {
                    setShowEmojiPicker(false);
                    setShowGifPicker(false);
                  }}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  disabled={isSending}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!newMessage.trim() || isSending}
                  className="p-1.5 rounded-full bg-[#D4AF37] text-white hover:bg-[#C5A028] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
