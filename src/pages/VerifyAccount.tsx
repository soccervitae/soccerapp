import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import SignupVerification from "@/components/auth/SignupVerification";
import { useQueryClient } from "@tanstack/react-query";

const VerifyAccount = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);

  // Get user email and first name
  const userEmail = user?.email || "";
  const firstName = (user?.user_metadata as any)?.first_name || profile?.full_name?.split(" ")[0] || "";

  // If already verified, redirect
  useEffect(() => {
    if (profile && (profile as any).conta_verificada) {
      navigate("/complete-profile", { replace: true });
    }
  }, [profile, navigate]);

  // Send verification code on mount
  useEffect(() => {
    if (!user || !userEmail || codeSent || sending) return;

    const sendCode = async () => {
      setSending(true);
      try {
        await supabase.functions.invoke("send-signup-verification", {
          body: {
            email: userEmail,
            user_id: user.id,
            first_name: firstName,
          },
        });
        setCodeSent(true);
      } catch (err) {
        console.error("Error sending verification code:", err);
        setCodeSent(true); // Still show the form so user can resend
      } finally {
        setSending(false);
      }
    };

    sendCode();
  }, [user, userEmail, codeSent, sending, firstName]);

  const handleVerified = async () => {
    // Invalidate profile cache to pick up conta_verificada = true
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    navigate("/complete-profile", { replace: true });
  };

  const handleBack = async () => {
    // Sign out and go to auth
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (isLoading || !user || sending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center pt-20 pb-8">
        <img 
          src="https://wdgpmpgdlauiawbtbxmn.supabase.co/storage/v1/object/public/site-assets/SOCCERVITAE_LOGO_NOVO_verde.png" 
          alt="Soccer Vitae"
          className="h-7 w-auto object-contain"
        />
      </div>

      <div className="flex-1 px-6 pt-2 pb-8">
        <div className="max-w-sm mx-auto">
          <SignupVerification
            email={userEmail}
            userId={user.id}
            firstName={firstName}
            onVerified={handleVerified}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default VerifyAccount;
