import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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

interface DrawPath {
  points: { x: number; y: number }[];
  color: string;
  size: number;
}

interface ReplayTextStickerEditorProps {
  mediaUrl: string;
  mediaType: "photo" | "video";
  onPublish: (finalMediaUrl: string, caption: string) => void;
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

const BRUSH_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFCC00",
  "#34C759",
  "#007AFF",
  "#5856D6",
  "#FFFFFF",
  "#000000",
];

const STICKER_CATEGORIES = [
  {
    name: "Futebol",
    stickers: ["⚽", "🥅", "🏟️", "🎽", "🧤", "🦵", "🏃", "🏃‍♀️", "📣", "🎺"]
  },
  {
    name: "Celebração", 
    stickers: ["🏆", "🥇", "🥈", "🥉", "🎉", "🎊", "🎯", "⭐", "💫", "✨"]
  },
  {
    name: "Expressões",
    stickers: ["🔥", "❤️", "😂", "😍", "💪", "👍", "👏", "💯", "🙌", "🤩"]
  },
  {
    name: "Países",
    stickers: ["🇧🇷", "🇦🇷", "🇩🇪", "🇫🇷", "🇪🇸", "🇮🇹", "🇵🇹", "🇬🇧", "🇳🇱", "🇺🇾"]
  },
  {
    name: "Números",
    stickers: ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"]
  },
  {
    name: "Clima",
    stickers: ["☀️", "🌧️", "⛈️", "🌙", "🌪️", "❄️", "💨", "🌈", "🌅", "🌃"]
  },
  {
    name: "Gestos",
    stickers: ["🤝", "✊", "👊", "🤙", "☝️", "✌️", "🤟", "👆", "🫶", "🙏"]
  },
  {
    name: "Símbolos",
    stickers: ["⚡", "💥", "💢", "🎵", "🔊", "📍", "⏱️", "📅", "🔔", "🆚"]
  }
];

const FONT_SIZES = {
  sm: 16,
  md: 24,
  lg: 36,
};

type ToolMode = "none" | "text" | "stickers" | "draw";
type GestureMode = "none" | "drag" | "pinch-rotate";

// Helpers para gestos multi-touch
const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

const getAngle = (touch1: React.Touch, touch2: React.Touch): number => {
  return Math.atan2(
    touch2.clientY - touch1.clientY,
    touch2.clientX - touch1.clientX
  ) * (180 / Math.PI);
};

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
  const [gestureMode, setGestureMode] = useState<GestureMode>("none");

  // Caption state (WhatsApp style)
  const [caption, setCaption] = useState("");

  // Drawing state
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [brushColor, setBrushColor] = useState("#FF3B30");
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawingActive, setIsDrawingActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; elementX: number; elementY: number } | null>(null);
  const initialGestureRef = useRef<{
    distance: number;
    angle: number;
    scale: number;
    rotation: number;
  } | null>(null);

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

  // Get point from event relative to container (as percentage)
  const getPointFromEvent = (e: React.PointerEvent | React.TouchEvent): { x: number; y: number } => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    
    const rect = container.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  // Drawing handlers
  const handleDrawStart = (e: React.PointerEvent) => {
    if (toolMode !== "draw") return;
    e.preventDefault();
    const point = getPointFromEvent(e);
    setCurrentPath([point]);
    setIsDrawingActive(true);
  };

  const handleDrawMove = (e: React.PointerEvent) => {
    if (toolMode !== "draw" || !isDrawingActive) return;
    e.preventDefault();
    const point = getPointFromEvent(e);
    setCurrentPath(prev => [...prev, point]);
  };

  const handleDrawEnd = () => {
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, {
        points: currentPath,
        color: brushColor,
        size: brushSize
      }]);
    }
    setCurrentPath([]);
    setIsDrawingActive(false);
  };

  const undoLastPath = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  // Touch handlers para gestos de pinça
  const handleTouchStart = (e: React.TouchEvent, elementId: string) => {
    if (toolMode === "draw") return;
    e.stopPropagation();
    setActiveElementId(elementId);

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (e.touches.length === 2) {
      // Gesto de pinça/rotação
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      initialGestureRef.current = {
        distance: getDistance(touch1, touch2),
        angle: getAngle(touch1, touch2),
        scale: element.scale,
        rotation: element.rotation,
      };
      setGestureMode("pinch-rotate");
    } else if (e.touches.length === 1) {
      // Arraste simples
      setGestureMode("drag");
      setIsDragging(true);
      
      if (containerRef.current) {
        dragStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          elementX: element.x,
          elementY: element.y,
        };
      }
    }
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (toolMode === "draw") return;
    if (!activeElementId || !containerRef.current) return;

    if (e.touches.length === 2 && initialGestureRef.current && gestureMode === "pinch-rotate") {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // Calcular nova escala
      const currentDistance = getDistance(touch1, touch2);
      const scaleFactor = currentDistance / initialGestureRef.current.distance;
      const newScale = Math.max(0.5, Math.min(3, initialGestureRef.current.scale * scaleFactor));

      // Calcular nova rotação
      const currentAngle = getAngle(touch1, touch2);
      const angleDiff = currentAngle - initialGestureRef.current.angle;
      const newRotation = initialGestureRef.current.rotation + angleDiff;

      setElements(prev =>
        prev.map(el =>
          el.id === activeElementId
            ? { ...el, scale: newScale, rotation: newRotation }
            : el
        )
      );
    } else if (e.touches.length === 1 && gestureMode === "drag" && dragStartRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;

      const newX = dragStartRef.current.elementX + (deltaX / rect.width) * 100;
      const newY = dragStartRef.current.elementY + (deltaY / rect.height) * 100;

      setElements(prev =>
        prev.map(el =>
          el.id === activeElementId
            ? { ...el, x: Math.max(5, Math.min(95, newX)), y: Math.max(5, Math.min(95, newY)) }
            : el
        )
      );
    }
  }, [activeElementId, gestureMode, toolMode]);

  const handleTouchEnd = () => {
    if (toolMode === "draw") {
      handleDrawEnd();
      return;
    }
    initialGestureRef.current = null;
    setGestureMode("none");
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent, elementId: string) => {
    if (toolMode === "draw") return;
    // Ignorar se for touch (será tratado pelo handleTouchStart)
    if (e.pointerType === "touch") return;
    
    e.stopPropagation();
    setActiveElementId(elementId);
    setIsDragging(true);

    const element = elements.find(el => el.id === elementId);
    if (!element || !containerRef.current) return;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      elementX: element.x,
      elementY: element.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (toolMode === "draw") {
      handleDrawMove(e);
      return;
    }
    if (e.pointerType === "touch") return;
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
  }, [isDragging, activeElementId, toolMode, isDrawingActive, currentPath, brushColor, brushSize]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (toolMode === "draw") {
      handleDrawEnd();
      return;
    }
    if (e.pointerType === "touch") return;
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const updateElementProperty = (elementId: string, property: keyof OverlayElement, value: number) => {
    setElements(prev =>
      prev.map(el =>
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  const handleContainerClick = () => {
    if (toolMode !== "draw") {
      setActiveElementId(null);
    }
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

      // Draw paths (drawings)
      for (const path of paths) {
        if (path.points.length < 2) continue;
        
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = (path.size / 100) * canvas.width * 0.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        path.points.forEach((point, i) => {
          const x = (point.x / 100) * canvas.width;
          const y = (point.y / 100) * canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Draw elements (text/stickers)
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
      
      if ((elements.length > 0 || paths.length > 0) && mediaType === "photo") {
        finalUrl = await exportWithOverlays();
      }
      
      onPublish(finalUrl, caption);
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
      cursor: toolMode === "draw" ? "crosshair" : "move",
      userSelect: "none",
      touchAction: "none",
      whiteSpace: "nowrap",
    };
  };

  const clearAll = () => {
    setElements([]);
    setPaths([]);
    setActiveElementId(null);
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
        onPointerDown={toolMode === "draw" ? handleDrawStart : undefined}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={toolMode === "draw" ? handleDrawEnd : undefined}
        style={{ cursor: toolMode === "draw" ? "crosshair" : "default", touchAction: toolMode === "draw" ? "none" : "auto" }}
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

        {/* SVG Canvas for Drawings */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {/* Saved paths */}
          {paths.map((path, i) => (
            <polyline
              key={i}
              points={path.points.map(p => `${p.x}%,${p.y}%`).join(' ')}
              fill="none"
              stroke={path.color}
              strokeWidth={path.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {/* Current path being drawn */}
          {currentPath.length > 0 && (
            <polyline
              points={currentPath.map(p => `${p.x}%,${p.y}%`).join(' ')}
              fill="none"
              stroke={brushColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Overlay Elements */}
        {elements.map((element) => (
          <div
            key={element.id}
            style={getElementStyle(element)}
            onPointerDown={(e) => handlePointerDown(e, element.id)}
            onTouchStart={(e) => handleTouchStart(e, element.id)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`${activeElementId === element.id ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent" : ""}`}
          >
            {element.content}
            
            {activeElementId === element.id && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteElement(element.id);
                  }}
                  className="absolute -top-3 -right-3 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-lg"
                >
                  <span className="material-symbols-outlined text-[14px] text-white">close</span>
                </button>
                
                {/* Indicador de escala/rotação */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full whitespace-nowrap backdrop-blur-sm">
                  {Math.round(element.rotation)}° • {element.scale.toFixed(1)}x
                </div>
              </>
            )}
          </div>
        ))}

        {/* Video overlay notice */}
        {mediaType === "video" && (elements.length > 0 || paths.length > 0) && (
          <div className="absolute top-4 left-4 right-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg">
            <p className="text-white/80 text-xs text-center">
              Textos, stickers e desenhos serão visíveis apenas na prévia
            </p>
          </div>
        )}

        {/* Drawing mode indicator */}
        {toolMode === "draw" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full">
            <p className="text-primary-foreground text-xs font-medium">
              Toque na tela para desenhar
            </p>
          </div>
        )}
      </div>

      {/* Caption Input (WhatsApp style) */}
      <div className="bg-black/60 backdrop-blur-sm px-4 py-3 border-t border-white/10">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Adicionar legenda..."
          className="w-full bg-transparent text-white placeholder:text-white/50 text-sm outline-none"
          maxLength={200}
        />
      </div>

      {/* Controles de Escala e Rotação para elemento ativo */}
      {activeElementId && toolMode === "none" && (
        <div className="bg-card border-t border-border p-3 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            {/* Slider de Escala */}
            <div className="flex-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">zoom_in</span>
              <Slider
                value={[elements.find(el => el.id === activeElementId)?.scale || 1]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={([value]) => updateElementProperty(activeElementId, "scale", value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {(elements.find(el => el.id === activeElementId)?.scale || 1).toFixed(1)}x
              </span>
            </div>
            
            {/* Slider de Rotação */}
            <div className="flex-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-muted-foreground">rotate_right</span>
              <Slider
                value={[elements.find(el => el.id === activeElementId)?.rotation || 0]}
                min={-180}
                max={180}
                step={5}
                onValueChange={([value]) => updateElementProperty(activeElementId, "rotation", value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(elements.find(el => el.id === activeElementId)?.rotation || 0)}°
              </span>
            </div>
          </div>
        </div>
      )}

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

      {toolMode === "draw" && (
        <div className="bg-card border-t border-border p-4 animate-in slide-in-from-bottom-4">
          {/* Brush Colors */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-muted-foreground w-12">Cor:</span>
            <div className="flex gap-2 flex-wrap">
              {BRUSH_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    brushColor === color
                      ? "scale-110 border-primary ring-2 ring-primary/50"
                      : "border-white/20"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Brush Size */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-muted-foreground w-12">Tamanho:</span>
            <Slider
              value={[brushSize]}
              min={2}
              max={20}
              step={1}
              onValueChange={([value]) => setBrushSize(value)}
              className="flex-1"
            />
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center border border-border"
              style={{ backgroundColor: brushColor }}
            >
              <div
                className="rounded-full bg-white"
                style={{ width: brushSize, height: brushSize }}
              />
            </div>
          </div>

          {/* Undo Button */}
          {paths.length > 0 && (
            <button
              onClick={undoLastPath}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">undo</span>
              Desfazer último traço
            </button>
          )}
        </div>
      )}

      {/* Bottom Toolbar */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center justify-center gap-6">
        <button
          onClick={() => {
            setToolMode(toolMode === "draw" ? "none" : "draw");
            setActiveElementId(null);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            toolMode === "draw" ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">edit</span>
          <span className="text-xs">Desenhar</span>
        </button>

        <button
          onClick={() => {
            setToolMode(toolMode === "text" ? "none" : "text");
            setActiveElementId(null);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            toolMode === "text" ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">text_fields</span>
          <span className="text-xs">Texto</span>
        </button>

        <button
          onClick={() => {
            setToolMode(toolMode === "stickers" ? "none" : "stickers");
            setActiveElementId(null);
          }}
          className={`flex flex-col items-center gap-1 transition-colors ${
            toolMode === "stickers" ? "text-primary" : "text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">emoji_emotions</span>
          <span className="text-xs">Stickers</span>
        </button>

        {(elements.length > 0 || paths.length > 0) && (
          <button
            onClick={clearAll}
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
