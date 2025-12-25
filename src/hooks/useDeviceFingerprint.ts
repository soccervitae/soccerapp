// Device fingerprint generation and detection

interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop";
  deviceName: string;
  userAgent: string;
}

// Simple hash function (not cryptographic, but unique enough for fingerprinting)
const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.substring(0, 32); // Return first 32 chars
};

// Detect browser from user agent
const detectBrowser = (userAgent: string): string => {
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edg")) return "Edge";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  return "Outro";
};

// Detect OS from user agent
const detectOS = (userAgent: string): string => {
  if (userAgent.includes("Windows NT 10")) return "Windows 10";
  if (userAgent.includes("Windows NT 11") || (userAgent.includes("Windows NT 10") && userAgent.includes("Windows 11"))) return "Windows 11";
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac OS X")) return "macOS";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  if (userAgent.includes("Linux")) return "Linux";
  return "Desconhecido";
};

// Detect device type
const detectDeviceType = (userAgent: string): "mobile" | "tablet" | "desktop" => {
  if (/iPad|Tablet|PlayBook/i.test(userAgent)) return "tablet";
  if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) return "mobile";
  return "desktop";
};

// Generate device fingerprint based on multiple factors
export const generateDeviceFingerprint = async (): Promise<DeviceInfo> => {
  const userAgent = navigator.userAgent;
  const browser = detectBrowser(userAgent);
  const os = detectOS(userAgent);
  const deviceType = detectDeviceType(userAgent);
  
  // Collect fingerprint components
  const components = [
    userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || "unknown",
    navigator.platform,
  ];
  
  // Generate hash from components
  const fingerprint = await hashString(components.join("|"));
  
  // Generate device name
  const deviceName = `${browser} em ${os}`;
  
  return {
    fingerprint,
    browser,
    os,
    deviceType,
    deviceName,
    userAgent,
  };
};

export const useDeviceFingerprint = () => {
  return {
    generateDeviceFingerprint,
  };
};
