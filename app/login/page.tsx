"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Eye, EyeOff, Mail, Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError("Please enter your name");
          setIsLoading(false);
          return;
        }
        await register(email, password, name);
      }
      router.push("/");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl border border-[#E9D7B8]/50 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 text-center bg-gradient-to-b from-[#FBF8F4] to-white">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/10 flex items-center justify-center mb-4">
              <span className="text-5xl">🏮</span>
            </div>
            <h1 className="text-2xl font-bold text-[#2A2A2A]">Bát Cơm Mặn</h1>
            <p className="text-[#2A2A2A]/60 mt-1">
              {isLogin ? "Welcome back!" : "Create your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
            {/* Toggle */}
            <div className="flex bg-[#FBF8F4] rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg font-medium transition-all",
                  isLogin
                    ? "bg-white text-[#2A2A2A] shadow-sm"
                    : "text-[#2A2A2A]/60 hover:text-[#2A2A2A]"
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={cn(
                  "flex-1 py-2.5 rounded-lg font-medium transition-all",
                  !isLogin
                    ? "bg-white text-[#2A2A2A] shadow-sm"
                    : "text-[#2A2A2A]/60 hover:text-[#2A2A2A]"
                )}
              >
                Sign Up
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Name (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#2A2A2A]/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#2A2A2A]/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-[#E9D7B8] bg-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2A2A2A]/40 hover:text-[#2A2A2A]/60"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white font-semibold hover:from-[#C5A028] hover:to-[#B8942A] transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-8 text-center">
            <p className="text-sm text-[#2A2A2A]/50">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[#D4AF37] font-medium hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

        {/* Skip login for demo */}
        <button
          onClick={() => router.push("/")}
          className="w-full mt-4 py-3 text-[#2A2A2A]/50 hover:text-[#2A2A2A]/70 transition-colors text-sm"
        >
          Continue as guest →
        </button>
      </div>
    </div>
  );
}
