import { useState, useRef, useCallback, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Camera, Download, Monitor, Smartphone, Loader2, RefreshCw, Eye, X } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";

const ALL_PAGES = [
  { label: "Home", path: "/" },
  { label: "Landing", path: "/landing" },
  { label: "Login", path: "/auth" },
  { label: "Explorar", path: "/explorar" },
  { label: "Para Atletas", path: "/para-atletas" },
  { label: "Para Comissão", path: "/para-comissao" },
  { label: "Para Times", path: "/para-times" },
  { label: "Como Funciona", path: "/como-funciona" },
  { label: "Saiba Mais", path: "/saiba-mais" },
  { label: "Blog", path: "/blog" },
  { label: "Vagas", path: "/vagas" },
  { label: "Peneiras", path: "/peneiras" },
  { label: "Termos", path: "/terms" },
  { label: "Privacidade", path: "/privacy" },
  { label: "Sobre", path: "/about" },
  { label: "Diretrizes", path: "/guidelines" },
];

type ScreenshotData = {
  label: string;
  path: string;
  mobileDataUrl: string | null;
  desktopDataUrl: string | null;
};

function ScreenshotPreviewModal({
  dataUrl,
  label,
  onClose,
  onDownload,
}: {
  dataUrl: string;
  label: string;
  onClose: () => void;
  onDownload: (dataUrl: string, name: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-[95vw] max-h-[95vh] flex flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 absolute top-2 right-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={() => onDownload(dataUrl, label)}
          >
            <Download className="h-4 w-4 mr-1" />
            Baixar
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <img
          src={dataUrl}
          alt={label}
          className="max-w-full max-h-[90vh] rounded-lg border border-border object-contain"
        />
      </div>
    </div>
  );
}

function ScreenshotCard({
  item,
  onDownload,
  onPreview,
}: {
  item: ScreenshotData;
  onDownload: (dataUrl: string, name: string) => void;
  onPreview: (dataUrl: string, label: string) => void;
}) {
  return (
    <div className="border border-border rounded-lg bg-card p-4 space-y-3">
      <h3 className="font-semibold text-foreground text-sm">{item.label}</h3>
      <p className="text-xs text-muted-foreground font-mono">{item.path}</p>

      <div className="grid grid-cols-2 gap-3">
        {/* Mobile */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone className="h-3 w-3" />
            Mobile
          </div>
          {item.mobileDataUrl ? (
            <div className="relative group">
              <img
                src={item.mobileDataUrl}
                alt={`${item.label} mobile`}
                className="w-full rounded border border-border object-cover object-top cursor-pointer"
                style={{ aspectRatio: "390/844", maxHeight: 200 }}
                onClick={() => onPreview(item.mobileDataUrl!, `${item.label} - Mobile`)}
              />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => onPreview(item.mobileDataUrl!, `${item.label} - Mobile`)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onDownload(item.mobileDataUrl!, `${item.label}-mobile`)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="w-full rounded border border-border bg-muted flex items-center justify-center"
              style={{ aspectRatio: "390/844", maxHeight: 200 }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Monitor className="h-3 w-3" />
            Desktop
          </div>
          {item.desktopDataUrl ? (
            <div className="relative group">
              <img
                src={item.desktopDataUrl}
                alt={`${item.label} desktop`}
                className="w-full rounded border border-border object-cover object-top cursor-pointer"
                style={{ aspectRatio: "1280/720", maxHeight: 200 }}
                onClick={() => onPreview(item.desktopDataUrl!, `${item.label} - Desktop`)}
              />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={() => onPreview(item.desktopDataUrl!, `${item.label} - Desktop`)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onDownload(item.desktopDataUrl!, `${item.label}-desktop`)}
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="w-full rounded border border-border bg-muted flex items-center justify-center"
              style={{ aspectRatio: "1280/720", maxHeight: 200 }}
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Screenshots() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>(
    ALL_PAGES.map((p) => ({ ...p, mobileDataUrl: null, desktopDataUrl: null }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: ALL_PAGES.length });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const origin = window.location.origin;

  const captureIframe = useCallback(
    (width: number, height: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const iframe = iframeRef.current;
        if (!iframe?.contentDocument?.body) {
          reject(new Error("Iframe inacessível"));
          return;
        }
        html2canvas(iframe.contentDocument.body, {
          useCORS: true,
          scale: 2,
          width,
          height,
          windowWidth: width,
          windowHeight: height,
        })
          .then((canvas) => resolve(canvas.toDataURL("image/png")))
          .catch(reject);
      });
    },
    []
  );

  const waitForIframeLoad = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      const iframe = iframeRef.current;
      if (!iframe) { resolve(); return; }
      const onLoad = () => {
        iframe.removeEventListener("load", onLoad);
        // Extra delay for rendering
        setTimeout(resolve, 1500);
      };
      iframe.addEventListener("load", onLoad);
    });
  }, []);

  const generateAll = useCallback(async () => {
    setIsGenerating(true);
    const results = [...screenshots];

    for (let i = 0; i < ALL_PAGES.length; i++) {
      const page = ALL_PAGES[i];
      setProgress({ current: i + 1, total: ALL_PAGES.length });

      try {
        // Mobile capture
        const iframe = iframeRef.current;
        if (!iframe) continue;

        iframe.style.width = "390px";
        iframe.style.height = "844px";
        iframe.src = origin + page.path;
        await waitForIframeLoad();

        let mobileUrl: string | null = null;
        try {
          mobileUrl = await captureIframe(390, 844);
        } catch {
          console.warn(`Falha captura mobile: ${page.path}`);
        }

        // Desktop capture
        iframe.style.width = "1280px";
        iframe.style.height = "720px";
        iframe.src = origin + page.path;
        await waitForIframeLoad();

        let desktopUrl: string | null = null;
        try {
          desktopUrl = await captureIframe(1280, 720);
        } catch {
          console.warn(`Falha captura desktop: ${page.path}`);
        }

        results[i] = { ...page, mobileDataUrl: mobileUrl, desktopDataUrl: desktopUrl };
        setScreenshots([...results]);
      } catch (err) {
        console.error(`Erro na página ${page.path}:`, err);
      }
    }

    setIsGenerating(false);
    toast.success("Todas as screenshots foram geradas!");
  }, [screenshots, origin, captureIframe, waitForIframeLoad]);

  useEffect(() => {
    // Auto-generate on mount
    const timer = setTimeout(() => generateAll(), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadScreenshot = (dataUrl: string, name: string) => {
    const link = document.createElement("a");
    link.download = `screenshot-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
    toast.success("Screenshot baixado!");
  };

  const downloadAll = () => {
    let count = 0;
    screenshots.forEach((s) => {
      if (s.mobileDataUrl) {
        setTimeout(() => downloadScreenshot(s.mobileDataUrl!, `${s.label}-mobile`), count * 300);
        count++;
      }
      if (s.desktopDataUrl) {
        setTimeout(() => downloadScreenshot(s.desktopDataUrl!, `${s.label}-desktop`), count * 300);
        count++;
      }
    });
  };

  const readyCount = screenshots.filter((s) => s.mobileDataUrl && s.desktopDataUrl).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Screenshots
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isGenerating
                ? `Gerando... ${progress.current}/${progress.total} páginas`
                : `${readyCount}/${ALL_PAGES.length} páginas prontas`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={generateAll}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isGenerating ? "Gerando..." : "Regenerar"}
            </Button>
            <Button
              onClick={downloadAll}
              disabled={readyCount === 0}
            >
              <Download className="h-4 w-4" />
              Baixar Todas ({readyCount * 2})
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Screenshot grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {screenshots.map((item) => (
            <ScreenshotCard
              key={item.path}
              item={item}
              onDownload={downloadScreenshot}
            />
          ))}
        </div>

        {/* Hidden iframe for capturing */}
        <iframe
          ref={iframeRef}
          title="Capture Frame"
          style={{
            position: "fixed",
            left: "-9999px",
            top: "-9999px",
            width: 390,
            height: 844,
            border: "none",
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </div>
    </AdminLayout>
  );
}
