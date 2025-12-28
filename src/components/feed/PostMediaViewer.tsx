import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

interface PostMediaViewerProps {
  mediaUrls: string[];
  mediaType: string | null;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  originRect?: DOMRect | null;
}

export const PostMediaViewer = ({
  mediaUrls,
  mediaType,
  initialIndex = 0,
  isOpen,
  onClose,
  originRect,
}: PostMediaViewerProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const dragY = useMotionValue(0);
  const dragOpacity = useTransform(dragY, [-200, 0, 200], [0.5, 1, 0.5]);
  const dragScale = useTransform(dragY, [-200, 0, 200], [0.9, 1, 0.9]);
  const overlayOpacity = useTransform(dragY, [-200, 0, 200], [0.3, 1, 0.3]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (carouselApi && isOpen) {
      carouselApi.scrollTo(initialIndex, true);
    }
  }, [carouselApi, initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragEnd = (_: any, info: { velocity: { y: number }; offset: { y: number } }) => {
    if (Math.abs(info.offset.y) > 100 || Math.abs(info.velocity.y) > 500) {
      onClose();
    } else {
      dragY.set(0);
    }
  };

  const getInitialPosition = () => {
    if (!originRect) {
      return { opacity: 0, scale: 0.8, borderRadius: "16px" };
    }

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const originCenterX = originRect.left + originRect.width / 2;
    const originCenterY = originRect.top + originRect.height / 2;

    return {
      opacity: 0,
      scale: Math.min(originRect.width / window.innerWidth, 0.15),
      x: originCenterX - centerX,
      y: originCenterY - centerY,
      borderRadius: "16px",
    };
  };

  const isCarousel = mediaUrls.length > 1;
  const isVideo = mediaType === "video";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: overlayOpacity }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative w-full h-full flex items-center justify-center pointer-events-none"
            initial={getInitialPosition()}
            animate={{
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              borderRadius: "0px",
            }}
            exit={getInitialPosition()}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8,
              opacity: { duration: 0.25 },
            }}
            style={{
              opacity: dragOpacity,
              scale: dragScale,
              y: dragY,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
          >
            <div className="w-full h-full max-w-3xl max-h-[90vh] pointer-events-auto overflow-hidden">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              {isVideo ? (
                <video
                  src={mediaUrls[0]}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  playsInline
                />
              ) : isCarousel ? (
                <div className="relative w-full h-full">
                  <Carousel
                    setApi={setCarouselApi}
                    className="w-full h-full"
                    opts={{ startIndex: initialIndex }}
                  >
                    <CarouselContent className="h-full">
                      {mediaUrls.map((url, index) => (
                        <CarouselItem key={index} className="h-full flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Foto ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>

                  {/* Counter */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full">
                    <span className="text-sm font-medium text-white">
                      {currentIndex + 1}/{mediaUrls.length}
                    </span>
                  </div>

                  {/* Indicators */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
                    {mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => carouselApi?.scrollTo(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? "bg-white w-6"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={mediaUrls[0]}
                    alt="Post"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
