import { useState, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Download, Monitor, Smartphone, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const PRESETS = [
  { label: "Home", path: "/" },
  { label: "Landing", path: "/landing" },
  { label: "Auth", path: "/auth" },
  { label: "Explore", path: "/explore" },
  { label: "Explorar", path: "/explorar" },
  { label: "Para Atletas", path: "/para-atletas" },
  { label: "Para Times", path: "/para-times" },
  { label: "Como Funciona", path: "/como-funciona" },
];

export default function Screenshots() {
  const [route, setRoute] = useState("/landing");
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);
  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const [capturingMobile, setCapturingMobile] = useState(false);
  const [capturingDesktop, setCapturingDesktop] = useState(false);

  const origin = window.location.origin;

  const captureScreenshot = async (
    iframeRef: React.RefObject<HTMLIFrameElement>,
    name: string,
    setCapturing: (v: boolean) => void
  ) => {
    setCapturing(true);
    try {
      const iframe = iframeRef.current;
      if (!iframe?.contentDocument?.body) {
        throw new Error("Iframe não acessível");
      }

      const canvas = await html2canvas(iframe.contentDocument.body, {
        useCORS: true,
        scale: 2,
        width: iframe.contentDocument.documentElement.scrollWidth,
        height: iframe.contentDocument.documentElement.scrollHeight,
        windowWidth: iframe.contentDocument.documentElement.scrollWidth,
        windowHeight: iframe.contentDocument.documentElement.scrollHeight,
      });

      const link = document.createElement("a");
      link.download = `screenshot-${name}-${route.replace(/\//g, "_") || "home"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success(`Screenshot ${name} baixado!`);
    } catch (error) {
      console.error("Erro ao capturar screenshot:", error);
      toast.error("Falha na captura. Abrindo em nova aba como alternativa...");
      const width = name === "mobile" ? 390 : 1280;
      const height = name === "mobile" ? 844 : 720;
      window.open(
        origin + route,
        "_blank",
        `width=${width},height=${height},menubar=no,toolbar=no`
      );
    } finally {
      setCapturing(false);
    }
  };

  const reloadIframes = () => {
    mobileIframeRef.current?.contentWindow?.location.replace(origin + route);
    desktopIframeRef.current?.contentWindow?.location.replace(origin + route);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6" />
            Screenshots
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Visualize e capture screenshots do site em diferentes tamanhos
          </p>
        </div>

        {/* Route input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="Ex: /, /explore, /auth"
              className="font-mono"
            />
          </div>
          <Button onClick={reloadIframes} variant="outline">
            Carregar Rota
          </Button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.path}
              size="sm"
              variant={route === p.path ? "default" : "outline"}
              onClick={() => {
                setRoute(p.path);
                setTimeout(() => {
                  mobileIframeRef.current?.contentWindow?.location.replace(origin + p.path);
                  desktopIframeRef.current?.contentWindow?.location.replace(origin + p.path);
                }, 50);
              }}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Previews */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Mobile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile (390×844)
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(origin + route, "_blank", "width=390,height=844,menubar=no,toolbar=no")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => captureScreenshot(mobileIframeRef, "mobile", setCapturingMobile)}
                  disabled={capturingMobile}
                >
                  {capturingMobile ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Baixar
                </Button>
              </div>
            </div>
            <div
              className="border border-border rounded-lg overflow-hidden bg-background"
              style={{ width: "100%", maxWidth: 250, height: 540 }}
            >
              <iframe
                ref={mobileIframeRef}
                src={origin + route}
                title="Mobile Preview"
                style={{
                  width: 390,
                  height: 844,
                  transform: "scale(0.64)",
                  transformOrigin: "top left",
                  border: "none",
                }}
              />
            </div>
          </div>

          {/* Desktop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop (1280×720)
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(origin + route, "_blank", "width=1280,height=720,menubar=no,toolbar=no")}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => captureScreenshot(desktopIframeRef, "desktop", setCapturingDesktop)}
                  disabled={capturingDesktop}
                >
                  {capturingDesktop ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  Baixar
                </Button>
              </div>
            </div>
            <div
              className="border border-border rounded-lg overflow-hidden bg-background"
              style={{ width: "100%", maxWidth: 640, height: 360 }}
            >
              <iframe
                ref={desktopIframeRef}
                src={origin + route}
                title="Desktop Preview"
                style={{
                  width: 1280,
                  height: 720,
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                  border: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
