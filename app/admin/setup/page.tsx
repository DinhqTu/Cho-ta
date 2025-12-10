"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { initializeAdminUser } from "@/lib/api/user-roles";
import { Loader2, Shield, CheckCircle } from "lucide-react";

export default function AdminSetupPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetupAdmin = async () => {
    if (!user) {
      setError("Please login first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await initializeAdminUser(user.$id, user.email, user.name);

      if (result) {
        setSuccess(true);
      } else {
        setError(
          "Failed to set admin role. Check if user_roles collection exists."
        );
      }
    } catch (err) {
      console.error("Error setting up admin:", err);
      setError("Failed to set admin role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl border border-[#E9D7B8]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2A2A2A]">Admin Setup</h1>
          <p className="text-[#2A2A2A]/60 mt-2">
            Initialize admin role for current user
          </p>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#FBF8F4] border border-[#E9D7B8]">
              <p className="text-sm text-[#2A2A2A]/60">Current User</p>
              <p className="font-semibold text-[#2A2A2A]">{user.name}</p>
              <p className="text-sm text-[#2A2A2A]/60">{user.email}</p>
              <p className="text-xs text-[#2A2A2A]/40 mt-1">ID: {user.$id}</p>
            </div>

            {success ? (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium text-green-700">Admin role set!</p>
                  <p className="text-sm text-green-600">
                    Please logout and login again to apply changes.
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSetupAdmin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#D4AF37] text-white font-semibold hover:bg-[#C5A028] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
                Set as Admin
              </button>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[#2A2A2A]/60 mb-4">Please login first</p>
            <a
              href="/login"
              className="inline-block px-6 py-3 rounded-xl bg-[#D4AF37] text-white font-medium hover:bg-[#C5A028] transition-colors"
            >
              Go to Login
            </a>
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-700 font-medium mb-2">
            ⚠️ Setup Instructions
          </p>
          <ol className="text-xs text-amber-600 space-y-1 list-decimal list-inside">
            <li>
              Create collection{" "}
              <code className="bg-amber-100 px-1 rounded">user_roles</code> in
              Appwrite
            </li>
            <li>Add attributes: userId, email, name, role, createdAt</li>
            <li>Set permissions: Any (Read), Users (Create, Read, Update)</li>
            <li>Login with your account</li>
            <li>Click "Set as Admin" button</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
