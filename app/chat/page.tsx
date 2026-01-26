"use client";

import { ChatBox } from "@/components/chat-box";
import { AuthGuard } from "@/components/auth-guard";

export default function ChatPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-[#FBF8F4] pt-20 px-4 pb-8">
        <div className="max-w-3xl mx-auto">
          <ChatBox
            showHeader={false}
            messagesHeight="h-[calc(100vh-200px)]"
            className="shadow-lg"
          />
        </div>
      </main>
    </AuthGuard>
  );
}
