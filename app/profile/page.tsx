"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { Header } from "@/components/header";
import { updateName, updateEmail, updatePassword } from "@/lib/auth";
import { clearUserNameCache, updateUserRoleName } from "@/lib/api/user-roles";
import { User, Mail, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password">("info");

  // Info form state
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingInfo(true);
    setInfoMessage(null);

    try {
      // Update name if changed
      if (name !== user.name) {
        await updateName(name);
        // Update name in user_roles collection and clear cache
        await updateUserRoleName(user.$id, name);
      }

      // Update email if changed (requires password)
      if (email !== user.email) {
        if (!currentPasswordForEmail) {
          setInfoMessage({
            type: "error",
            text: "Vui lòng nhập mật khẩu để thay đổi email",
          });
          setIsUpdatingInfo(false);
          return;
        }
        await updateEmail(email, currentPasswordForEmail);
      }

      await refreshUser();
      setCurrentPasswordForEmail("");
      setInfoMessage({
        type: "success",
        text: "Cập nhật thông tin thành công!",
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setInfoMessage({
        type: "error",
        text: err.message || "Có lỗi xảy ra khi cập nhật thông tin",
      });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới không khớp" });
      setIsUpdatingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
      setIsUpdatingPassword(false);
      return;
    }

    try {
      await updatePassword(newPassword, currentPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
    } catch (error: unknown) {
      const err = error as { message?: string };
      setPasswordMessage({
        type: "error",
        text: err.message || "Mật khẩu hiện tại không đúng",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen bg-[#FBF8F4] pt-20 px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#D4AF37] to-[#C5A028] flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#2A2A2A]">
                  {user?.name || "User"}
                </h1>
                <p className="text-[#2A2A2A]/50">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("info")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === "info"
                  ? "bg-[#D4AF37] text-white"
                  : "bg-white text-[#2A2A2A]/70 hover:bg-[#FBF8F4]"
              )}
            >
              <User className="w-4 h-4" />
              Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                activeTab === "password"
                  ? "bg-[#D4AF37] text-white"
                  : "bg-white text-[#2A2A2A]/70 hover:bg-[#FBF8F4]"
              )}
            >
              <Lock className="w-4 h-4" />
              Đổi mật khẩu
            </button>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-[#E9D7B8]/50 shadow-sm p-6">
            {activeTab === "info" ? (
              <form onSubmit={handleUpdateInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                    Tên hiển thị
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      placeholder="Nhập tên của bạn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      placeholder="Nhập email của bạn"
                    />
                  </div>
                </div>

                {email !== user?.email && (
                  <div>
                    <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                      Mật khẩu hiện tại (để xác nhận đổi email)
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                      <input
                        type="password"
                        value={currentPasswordForEmail}
                        onChange={(e) =>
                          setCurrentPasswordForEmail(e.target.value)
                        }
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                    </div>
                  </div>
                )}

                {infoMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      infoMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {infoMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingInfo}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors disabled:opacity-50"
                >
                  {isUpdatingInfo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Lưu thay đổi
                </button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A2A2A]/40 hover:text-[#2A2A2A]"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A2A2A]/40 hover:text-[#2A2A2A]"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2A2A2A] mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E9D7B8] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                      placeholder="Nhập lại mật khẩu mới"
                    />
                  </div>
                </div>

                {passwordMessage && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      passwordMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    )}
                  >
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  Đổi mật khẩu
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
