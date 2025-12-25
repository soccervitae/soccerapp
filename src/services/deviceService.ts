import { supabase } from "@/integrations/supabase/client";
import { generateDeviceFingerprint } from "@/hooks/useDeviceFingerprint";

// Send notification email for new device
const sendNewDeviceNotification = async (
  userId: string,
  email: string,
  deviceInfo: { deviceName: string; browser: string; os: string; deviceType: string }
) => {
  try {
    await supabase.functions.invoke("send-new-device-notification", {
      body: {
        user_id: userId,
        email: email,
        device_name: deviceInfo.deviceName,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
      },
    });
    console.log("New device notification sent");
  } catch (error) {
    console.error("Error sending new device notification:", error);
    // Don't throw - notification failure shouldn't block login
  }
};

// Register or update device on login
export const registerDevice = async (userId: string, userEmail?: string): Promise<string | null> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();
    
    // Check if device already exists
    const { data: existingDevice, error: fetchError } = await supabase
      .from("user_devices")
      .select("id, is_trusted, trusted_until")
      .eq("user_id", userId)
      .eq("device_fingerprint", deviceInfo.fingerprint)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error fetching device:", fetchError);
      return null;
    }
    
    if (existingDevice) {
      // Update last_used_at for existing device
      await supabase
        .from("user_devices")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", existingDevice.id);
      
      return existingDevice.id;
    }
    
    // Insert new device
    const { data: newDevice, error: insertError } = await supabase
      .from("user_devices")
      .insert({
        user_id: userId,
        device_fingerprint: deviceInfo.fingerprint,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.deviceType,
        device_name: deviceInfo.deviceName,
        user_agent: deviceInfo.userAgent,
        is_trusted: false,
      })
      .select("id")
      .single();
    
    if (insertError) {
      console.error("Error registering device:", insertError);
      return null;
    }

    // Send notification email for new device (async, don't wait)
    if (userEmail) {
      sendNewDeviceNotification(userId, userEmail, deviceInfo);
    }
    
    return newDevice?.id || null;
  } catch (error) {
    console.error("Error in registerDevice:", error);
    return null;
  }
};

// Check if current device is trusted (and within 30 days)
export const isDeviceTrusted = async (userId: string): Promise<boolean> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();
    
    const { data: device, error } = await supabase
      .from("user_devices")
      .select("is_trusted, trusted_until")
      .eq("user_id", userId)
      .eq("device_fingerprint", deviceInfo.fingerprint)
      .maybeSingle();
    
    if (error || !device) {
      return false;
    }
    
    // Check if device is trusted
    if (!device.is_trusted) {
      return false;
    }
    
    // Check if trust has expired
    if (device.trusted_until) {
      const expirationDate = new Date(device.trusted_until);
      if (expirationDate < new Date()) {
        // Trust has expired, update the device
        await supabase
          .from("user_devices")
          .update({ is_trusted: false })
          .eq("user_id", userId)
          .eq("device_fingerprint", deviceInfo.fingerprint);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking device trust:", error);
    return false;
  }
};

// Trust current device for 30 days
export const trustCurrentDevice = async (userId: string): Promise<boolean> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();
    
    const trustedUntil = new Date();
    trustedUntil.setDate(trustedUntil.getDate() + 30);
    
    const { error } = await supabase
      .from("user_devices")
      .update({
        is_trusted: true,
        trusted_until: trustedUntil.toISOString(),
      })
      .eq("user_id", userId)
      .eq("device_fingerprint", deviceInfo.fingerprint);
    
    if (error) {
      console.error("Error trusting device:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in trustCurrentDevice:", error);
    return false;
  }
};

// Get current device fingerprint
export const getCurrentDeviceFingerprint = async (): Promise<string | null> => {
  try {
    const deviceInfo = await generateDeviceFingerprint();
    return deviceInfo.fingerprint;
  } catch (error) {
    console.error("Error getting fingerprint:", error);
    return null;
  }
};
