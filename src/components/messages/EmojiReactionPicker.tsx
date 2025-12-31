import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RedCardAnimation } from "./RedCardAnimation";
import { GoalAnimation } from "./GoalAnimation";
import { TrophyAnimation } from "./TrophyAnimation";
import { useWhistleSound } from "@/hooks/useWhistleSound";

const REACTION_EMOJIS = ["⚽", "🥅", "🏆", "🔥", "👏", "💪", "🟨", "🟥"];

interface EmojiReactionPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position?: "top" | "bottom";
}

export const EmojiReactionPicker = ({
  isOpen,
  onSelect,
  onClose,
  position = "top",
}: EmojiReactionPickerProps) => {
  const [showRedCardAnimation, setShowRedCardAnimation] = useState(false);
  const [showGoalAnimation, setShowGoalAnimation] = useState(false);
  const [showTrophyAnimation, setShowTrophyAnimation] = useState(false);
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);
  const { playWhistle } = useWhistleSound();

  const handleEmojiClick = (emoji: string) => {
    if (emoji === "🟥") {
      playWhistle();
      setPendingEmoji(emoji);
      setShowRedCardAnimation(true);
      onClose();
    } else if (emoji === "🟨") {
      playWhistle();
      onSelect(emoji);
      onClose();
    } else if (emoji === "🥅") {
      setPendingEmoji(emoji);
      setShowGoalAnimation(true);
      onClose();
    } else if (emoji === "🏆") {
      setPendingEmoji(emoji);
      setShowTrophyAnimation(true);
      onClose();
    } else {
      onSelect(emoji);
      onClose();
    }
  };

  const handleAnimationComplete = () => {
    setShowRedCardAnimation(false);
    setShowGoalAnimation(false);
    setShowTrophyAnimation(false);
    if (pendingEmoji) {
      onSelect(pendingEmoji);
      setPendingEmoji(null);
    }
  };

  return (
    <>
      <RedCardAnimation 
        isVisible={showRedCardAnimation} 
        onComplete={handleAnimationComplete} 
      />
      <GoalAnimation
        isVisible={showGoalAnimation}
        onComplete={handleAnimationComplete}
      />
      <TrophyAnimation
        isVisible={showTrophyAnimation}
        onComplete={handleAnimationComplete}
      />
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={onClose}
            />
            
            {/* Picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: position === "top" ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: position === "top" ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              className={`absolute ${
                position === "top" ? "bottom-full mb-2" : "top-full mt-2"
              } left-1/2 -translate-x-1/2 z-50`}
            >
              <div className="flex items-center justify-center gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-base hover:scale-110 transition-transform p-1 hover:bg-muted rounded-full min-w-[28px] flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
