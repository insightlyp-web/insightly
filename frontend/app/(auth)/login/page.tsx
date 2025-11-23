// app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LightLogin } from "@/components/ui/sign-in";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError("");
    setLoading(true);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Show more specific error messages
        let errorMessage = authError.message || "Invalid email or password";
        
        if (authError.message?.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password. Please check your credentials or create an account.";
        } else if (authError.message?.includes("Email not confirmed")) {
          errorMessage = "Please confirm your email address. Check your inbox for a confirmation link.";
        } else if (authError.message?.includes("User not found")) {
          errorMessage = "No account found with this email. Please create an account first.";
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!authData.session?.access_token) {
        setError("Failed to get access token");
        setLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem("access_token", authData.session.access_token);

      // Check user profile role using the generic check-profile endpoint
      try {
        const profileResponse = await apiClient.get("/auth/check-profile");
        const profile = profileResponse.data.profile;

        if (!profile) {
          setError("Profile not found. Please complete signup first.");
          localStorage.removeItem("access_token");
          setLoading(false);
          return;
        }

        // Redirect based on role
        if (profile.role === "admin") {
          router.push("/admin/dashboard");
          return;
        } else if (profile.role === "hod") {
          router.push("/hod/dashboard");
          return;
        } else if (profile.role === "faculty") {
          router.push("/faculty/dashboard");
          return;
        } else if (profile.role === "student") {
          router.push("/student/dashboard");
          return;
        } else {
          // Unknown role
          setError(`Access denied. Your role (${profile.role}) is not supported yet.`);
          localStorage.removeItem("access_token");
          router.push("/not-authorized");
          return;
        }
      } catch (profileError: any) {
        // Profile check failed - profile doesn't exist
        if (profileError.response?.status === 404) {
          // Check if there's pending signup data
          const pendingSignup = localStorage.getItem("pending_signup");
          
          if (pendingSignup) {
            try {
              // Try to create profile with stored signup data
              const signupData = JSON.parse(pendingSignup);
              
              // Verify email matches
              if (signupData.email === authData.user?.email) {
                const createResponse = await apiClient.post("/auth/create-profile", {
                  full_name: signupData.full_name,
                  department: signupData.department,
                  role: signupData.role,
                  phone: signupData.phone || ""
                });
                
                // Remove pending signup data
                localStorage.removeItem("pending_signup");
                
                // Retry profile check
                const retryResponse = await apiClient.get("/auth/check-profile");
                const retryProfile = retryResponse.data.profile;
                
                if (retryProfile.role === "admin") {
                  router.push("/admin/dashboard");
                  return;
                } else if (retryProfile.role === "hod") {
                  router.push("/hod/dashboard");
                  return;
                } else if (retryProfile.role === "faculty") {
                  router.push("/faculty/dashboard");
                  return;
                } else if (retryProfile.role === "student") {
                  router.push("/student/dashboard");
                  return;
                } else {
                  setError(`Profile created but role (${retryProfile.role}) is not supported.`);
                  setLoading(false);
                  return;
                }
              } else {
                // Email doesn't match - clear invalid pending signup
                localStorage.removeItem("pending_signup");
                setError("Profile not found. The email doesn't match your signup. Please sign up again.");
                setTimeout(() => {
                  router.push("/signup");
                }, 2000);
                localStorage.removeItem("access_token");
                setLoading(false);
                return;
              }
            } catch (createError: any) {
              console.error("Failed to create profile from pending signup:", createError);
              setError(createError.response?.data?.message || "Failed to create profile. Please try signing up again.");
              localStorage.removeItem("pending_signup");
              setTimeout(() => {
                router.push("/signup");
              }, 3000);
              localStorage.removeItem("access_token");
              setLoading(false);
              return;
            }
          } else {
            // No pending signup data - profile missing
            setError("Profile not found. Please complete your signup by creating an account first.");
            setTimeout(() => {
              router.push("/signup");
            }, 2000);
            localStorage.removeItem("access_token");
            setLoading(false);
            return;
          }
        } else if (profileError.response?.status === 401 || profileError.response?.status === 403) {
          setError("Authentication failed. Please try again.");
          localStorage.removeItem("access_token");
        } else {
          setError("Failed to verify your account. Please try again.");
          localStorage.removeItem("access_token");
        }
        setLoading(false);
        return;
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return <LightLogin onSubmit={handleLogin} error={error} loading={loading} />;
}

