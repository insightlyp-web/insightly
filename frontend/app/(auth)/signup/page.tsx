// app/(auth)/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LightSignUp } from "@/components/ui/sign-up";
import { supabase } from "@/lib/supabase";
import apiClient from "@/lib/axios";

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  const handleSignUp = async (email: string, password: string, fullName: string, department: string, role: string) => {
    setError("");
    setLoading(true);
    setEmailSent(false);
    setUserEmail("");

    try {
      // Step 1: Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        let errorMessage = authError.message || "Failed to create account";
        
        // Handle account already exists - try to sign them in and check profile
        if (authError.message?.includes("already registered") || 
            authError.message?.includes("already exists") ||
            authError.status === 422 && authError.message?.includes("already")) {
          
          // Try to sign in with the provided credentials to check profile status
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (!signInError && signInData.session?.access_token) {
              // Successfully signed in - check profile
              localStorage.setItem("access_token", signInData.session.access_token);
              
              try {
                const profileResponse = await apiClient.get("/auth/check-profile");
                const profile = profileResponse.data.profile;

                if (profile) {
                  // Profile exists - redirect to appropriate dashboard
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
                    errorMessage = `Account exists with role '${profile.role}'. Please sign in to access your dashboard.`;
                  }
                } else {
                  // No profile - offer to create one
                  errorMessage = "Account exists but profile is missing. Please sign in and your profile will be created automatically.";
                  setTimeout(() => {
                    router.push("/login");
                  }, 3000);
                }
              } catch (profileError: any) {
                // Profile check failed - might not exist
                errorMessage = "Account exists. Please sign in to complete your profile setup.";
                setTimeout(() => {
                  router.push("/login");
                }, 3000);
              }
            } else {
              // Sign in failed - wrong password
              errorMessage = "An account with this email already exists, but the password is incorrect. Please sign in with the correct password.";
            }
          } catch (signInErr: any) {
            // Couldn't auto-sign in - show generic message
            errorMessage = "An account with this email already exists. Please sign in instead.";
          }
          
          setError(errorMessage);
          setLoading(false);
          return;
        }
        
        // Handle other errors
        if (authError.status === 422) {
          if (authError.message?.includes("Password") || authError.message?.includes("password")) {
            errorMessage = "Password must be at least 6 characters long and meet security requirements.";
          } else if (authError.message?.includes("Email") || authError.message?.includes("email")) {
            errorMessage = "Invalid email address. Please check your email format.";
          } else {
            errorMessage = `Signup failed: ${authError.message || "Please check your input and try again."}`;
          }
        } else if (authError.message?.includes("Password")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (authError.message?.includes("Signups not allowed") || authError.message?.includes("signups disabled")) {
          errorMessage = "Signups are currently disabled. Please contact your administrator or enable signups in Supabase Dashboard (Authentication > Settings > Enable email signups).";
        }
        
        console.error("Supabase signup error:", authError);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Failed to create user account");
        setLoading(false);
        return;
      }

      // Step 2: Create profile in backend
      if (authData.session?.access_token) {
        // User is auto-confirmed, create profile
        localStorage.setItem("access_token", authData.session.access_token);
        
        try {
          // Call backend to create profile
          console.log("Creating profile with role:", role);
          const profileResponse = await apiClient.post("/auth/signup", {
            full_name: fullName,
            department,
            phone: "",
            role: role // HOD, Faculty, or Student
          });
          console.log("Profile created successfully:", profileResponse.data);

          // Verify profile exists before redirecting
          if (!profileResponse.data?.profile) {
            console.error("Profile not in response:", profileResponse.data);
            setError("Profile was created but could not be verified. Please try logging in.");
            setTimeout(() => {
              router.push("/login");
            }, 2000);
            setLoading(false);
            return;
          }

          // Success! Redirect to appropriate dashboard
          // Use replace to avoid adding to history
          if (role === "admin") {
            router.replace("/admin/dashboard");
          } else if (role === "hod") {
            router.replace("/hod/dashboard");
          } else if (role === "faculty") {
            router.replace("/faculty/dashboard");
          } else if (role === "student") {
            router.replace("/student/dashboard");
          } else {
            router.replace("/login");
          }
        } catch (profileError: any) {
          console.error("Profile creation error:", profileError);
          console.error("Error response:", profileError.response?.data);
          
          if (profileError.response?.status === 400) {
            if (profileError.response?.data?.message?.includes("already exists")) {
              // Profile already exists, just redirect to login
              setError("Account already exists. Please sign in.");
              setTimeout(() => {
                router.push("/login");
              }, 2000);
            } else if (profileError.response?.data?.message?.includes("Invalid role")) {
              // Invalid role error
              setError(`Invalid role selected: ${role}. Please try again with a valid role.`);
            } else {
              // Other 400 errors
              setError(profileError.response?.data?.message || "Failed to create profile. Please check your information and try again.");
            }
          } else {
            setError(profileError.response?.data?.message || "Account created but failed to set up profile. Please try signing in.");
            setTimeout(() => {
              router.push("/login");
            }, 3000);
          }
        }
      } else {
        // Email confirmation required
        // Store signup data in localStorage so we can create profile after confirmation
        const signupData = {
          email,
          full_name: fullName,
          department,
          role,
          phone: ""
        };
        localStorage.setItem("pending_signup", JSON.stringify(signupData));
        console.log("Stored pending signup data:", signupData);
        
        setEmailSent(true);
        setUserEmail(email);
        setError("Account created! Please check your email (including spam folder) for a confirmation link. After confirming, you can sign in and your profile will be created automatically.");
        // Don't redirect automatically - let user read the message
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!userEmail) return;
    
    setError("");
    setLoading(true);
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });
      
      if (resendError) {
        setError(resendError.message || "Failed to resend confirmation email");
      } else {
        setError("Confirmation email sent! Please check your inbox.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend confirmation email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <LightSignUp onSubmit={handleSignUp} error={error} loading={loading} />
      {emailSent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
            <p className="text-sm text-gray-600 mb-4">
              We've sent a confirmation email to <strong>{userEmail}</strong>. 
              Please check your inbox (and spam folder) and click the confirmation link.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleResendConfirmation}
                disabled={loading}
                className="flex-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Resend Email"}
              </button>
              <button
                onClick={() => {
                  setEmailSent(false);
                  router.push("/login");
                }}
                className="flex-1 rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

