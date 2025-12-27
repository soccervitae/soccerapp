import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface OverlayElement {
  id: string;
  type: "text" | "sticker";
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color?: string;
  fontSize?: "sm" | "md" | "lg";
  fontStyle?: "normal" | "bold" | "cursive";
  backgroundColor?: string | null;
}

interface ReplayTextStickerEditorProps {
  mediaUrl: string;
  mediaType: "photo" | "video";
  onPublish: (finalMediaUrl: string) => void;
  onCancel: () => void;
}

const TEXT_COLORS = [
  "#FFFFFF",
  "#000000",
  "#FF3B30",
  "#34C759",
  "#007AFF",
  "#FFCC00",
  "#FF2D92",
  "#5856D6",
];

const STICKER_CATEGORIES = [
  {
    name: "Futebol",
    stickers: ["⚽", "🥅", "🏟️", "👟", "🦶", "🎽", "🧤", "⚫", "🟢", "🔴"]
  },
  {
    name: "Celebração", 
    stickers: ["🏆", "🥇", "🥈", "🥉", "🎉", "🎊", "🎯", "⭐", "💫", "✨"]
  },
  {
    name: "Expressões",
    stickers: ["🔥", "❤️", "😂", "😍", "💪", "👍", "👏", "💯", "🙌", "🤩"]
  }
];

const FONT_SIZES = {
  sm: 16,
  md: 24,
  lg: 36,
};

type ToolMode = "none" | "text" | "stickers" | "colors";

export const ReplayTextStickerEditor = ({
  mediaUrl,
  mediaType,
  onPublish,
  onCancel,
}: ReplayTextStickerEditorProps) => {
  const [elements, setElements] = useState<OverlayElement[]>([]);
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>("none");
  const [textInput, setTextInput] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [selectedFontSize, setSelectedFontSize] = useState<"sm" | "md" | "lg">("md");
  const [selectedFontStyle, setSelectedFontStyle] = useState<"normal" | "bold" | "cursive">("bold");
  const [isDragging, setIsDragging] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(null);

  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addTextElement = () => {
    if (!textInput.trim()) {
      toast.error("Digite um texto");
      return;
    }

    const newElement: OverlayElement = {
      id: generateId(),
      type: "text",
      content: textInput,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
      color: selectedColor,
      fontSize: selectedFontSize,
      fontStyle: selectedFontStyle,
      backgroundColor: null,
    };

    setElements(prev => [...prev, newElement]);
    setTextInput("");
    setToolMode("none");
  };

  const addStickerElement = (sticker: string) => {
    const newElement: OverlayElement = {
      id: generateId(),
      type: "sticker",
      content: sticker,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0,
    };

    setElements(prev => [...prev, newElement]);
  };

  const deleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId));
    if (activeElementId === elementId) {
      setActiveElementId(null);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    e.stopPropagation();
    setActiveElementId(elementId);
    setIsDragging(true);

    const element = elements.find(el => el.id === elementId);
    if (!element || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !activeElementId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newX = dragStartRef.current.elementX + (deltaX / rect.width) * 100;
    const newY = dragStartRef.current.elementY + (deltaY / rect.height) * 100;

    setElements(prev =>
      prev.map(el =>
        el.id === activeElementId
          ? { ...el, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) }
          : el
      )
    );
  }, [isDragging, activeElementId]);

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleContainerClick = () => {
    setActiveElementId(null);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const exportWithOverlays = async (): Promise<string> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    try {
      const img = await loadImage(mediaUrl);
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      for (const element of elements) {
        const x = (element.x / 100) * canvas.width;
        const y = (element.y / 100) * canvas.height;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.scale(element.scale, element.scale);

        if (element.type === "text") {
          const baseFontSize = FONT_SIZES[element.fontSize || "md"];
          const scaledFontSize = (baseFontSize / 400) * canvas.width;
          
          let fontWeight = "400";
          let fontFamily = "system-ui, -apple-system, sans-serif";
          
          if (element.fontStyle === "bold") {
            fontWeight = "700";
          } else if (element.fontStyle === "cursive") {
            fontFamily = "cursive, Georgia, serif";
          }

          ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          if (element.backgroundColor) {
            const metrics = ctx.measureText(element.content);
            const padding = scaledFontSize * 0.3;
            ctx.fillStyle = element.backgroundColor;
            ctx.fillRect(
              -metrics.width / 2 - padding,
              -scaledFontSize / 2 - padding / 2,
              metrics.width + padding * 2,
              scaledFontSize + padding
            );
          }

          ctx.fillStyle = element.color || "#FFFFFF";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = scaledFontSize * 0.1;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.fillText(element.content, 0, 0);
        } else if (element.type === "sticker") {
          const stickerSize = (48 / 400) * canvas.width * element.scale;
          ctx.font = `${stickerSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(element.content, 0, 0);
        }

        ctx.restore();
      }

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error exporting image:", error);
      throw error;
    }
  };

  const handlePublish = async () => {
    setIsExporting(true);
    try {
      let finalUrl = mediaUrl;
      
      if (elements.length > 0 && mediaType === "photo") {
        finalUrl = await exportWithOverlays();
      }
      
      onPublish(finalUrl);
    } catch (error) {
      toast.error("Erro ao processar imagem");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const getElementStyle = (element: OverlayElement): React.CSSProperties => {
    const baseFontSize = FONT_SIZES[element.fontSize || "md"];
    
    let fontWeight: string | number = 400;
    let fontFamily = "system-ui, -apple-system, sans-serif";
    
    if (element.fontStyle === "bold") {
      fontWeight = 700;
    } else if (element.fontStyle === "cursive") {
      fontFamily = "cursive, Georgia, serif";
    }

    return {
      position: "absolute",
      left: `${element.x}%`,
      top: `${element.y}%`,
      transform: `translate(-50%, -50%) rotate(${element.rotation}deg) scale(${element.scale})`,
      color: element.color,
      fontSize: element.type === "text" ? `${baseFontSize}px` : "48px",
      fontWeight: element.type === "text" ? fontWeight : undefined,
      fontFamily: element.type === "text" ? fontFamily : undefined,
      backgroundColor: element.backgroundColor || undefined,
      padding: element.backgroundColor ? "4px 12px" : undefined,
      borderRadius: element.backgroundColor ? "4px" : undefined,
      textShadow: element.type === "text" && !element.backgroundColor ? "2px 2px 4px rgba(0,0,0,0.5)" : undefined,
      cursor: "move",
      userSelect: "none",
      touchAction: "none",
      whiteSpace: "nowrap",
    };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined text-[24px] text-white">arrow_back</span>
        </button>

        <span className="text-base font-semibold text-white">Editar Replay</span>

        <Button
          onClick={handlePublish}
          size="sm"
          variant="ghost"
          className="text-primary font-semibold text-sm hover:bg-transparent"
          disabled={isExporting}
        >
          {isExporting ? "Salvando..." : "Publicar"}
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onClick={handleContainerClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Media */}
        {mediaType === "video" ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={mediaUrl}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        )}

        {/* Overlay Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            style={getElementStyle(element)}
            onPointerDown={(e) => handlePointerDown(e, element.id)}
            className={`${activeElementId === element.id ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent" : ""}`}
          >
            {element.content}
            
            {activeElementId === element.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteElement(element.id);
                }}
                className="absolute -top-3 -right-3 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="material-symbols-outlined text-[14px] text-white">close</span>
              </button>
            )}
          </div>
        ))}

        {/* Video overlay notice */}
        {mediaType === "video" && elements.length > 0 && (
          <div className="absolute top-4 left-4 right-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
            <p className="text-white/80 text-xs text-center">
              Textos e stickers serão visíveis apenas na prévia
            </p>
          </div>
        )}
      </div>

      {/* Tool Panels */}
      {toolMode === "text" && (
        <div className="bg-card border-t border-border p-4 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Digite seu texto..."
              className="flex-1 bg-muted border-0"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && addTextElement()}
            />
            <Button onClick={addTextElement} size="sm" className="px-4">
              Adicionar
            </Button>
          </div>

          {/* Font Size */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground w-16">Tamanho:</span>
            <div className="flex gap-1">
              {(["sm", "md", "lg"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedFontSize(size)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedFontSize === size
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {size === "sm" ? "P" : size === "md" ? "M" : "G"}
                </button>
              ))}
            </div>
          </div>

          {/* Font Style */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground w-16">Estilo:</span>
            <div className="flex gap-1">
              {(["normal", "bold", "cursive"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedFontStyle(style)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedFontStyle === style
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                  style={{
                    fontWeight: style === "bold" ? 700 : 400,
                    fontStyle: style === "cursive" ? "italic" : "normal",
                  }}
                >
                  {style === "normal" ? "Normal" : style === "bold" ? "Negrito" : "Cursivo"}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16">Cor:</span>
            <div className="flex gap-2">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor === color ? "scale-110 border-primary" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {toolMode === "stickers" && (
        <div className="bg-card border-t border-border p-4 animate-in slide-in-from-bottom-4 max-h-[40vh] overflow-y-auto">
          {STICKER_CATEGORIES.map((category) => (
            <div key={category.name} className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">{category.name}</h4>
              <div className="flex flex-wrap gap-2">
                {category.stickers.map((sticker) => (
                  <button
                    key={sticker}
                    onClick={() => addStickerElement(sticker)}
                    className="w-12 h-12 text-2xl bg-muted rounded-lg hover:bg-muted/80 transition-colors flex items-center justify-center"
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-center gap-6">
        <button
          onClick={() => setToolMode(toolMode === "text" ? "none" : "text")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            toolMode === "text" ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">text_fields</span>
          <span className="text-xs">Texto</span>
        </button>

        <button
          onClick={() => setToolMode(toolMode === "stickers" ? "none" : "stickers")}
          className={`flex flex-col items-center gap-1 transition-colors ${
            toolMode === "stickers" ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">emoji_emotions</span>
          <span className="text-xs">Stickers</span>
        </button>

        {elements.length > 0 && (
          <button
            onClick={() => setElements([])}
            className="flex flex-col items-center gap-1 text-destructive"
          >
            <span className="material-symbols-outlined text-[24px]">delete</span>
            <span className="text-xs">Limpar</span>
          </button>
        )}
      </div>
    </div>
  );
};
