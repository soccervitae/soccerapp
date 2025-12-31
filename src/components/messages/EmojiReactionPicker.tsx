import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RedCardAnimation } from "./RedCardAnimation";
import { GoalAnimation } from "./GoalAnimation";

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
  const [pendingEmoji, setPendingEmoji] = useState<string | null>(null);

  const handleEmojiClick = (emoji: string) => {
    if (emoji === "🟥") {
      setPendingEmoji(emoji);
      setShowRedCardAnimation(true);
      onClose();
    } else if (emoji === "🥅") {
      setPendingEmoji(emoji);
      setShowGoalAnimation(true);
      onClose();
    } else {
      onSelect(emoji);
      onClose();
    }
  };

  const handleAnimationComplete = () => {
    setShowRedCardAnimation(false);
    setShowGoalAnimation(false);
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
              className={`fixed ${
                position === "top" ? "bottom-auto" : "top-auto"
              } left-1/2 -translate-x-1/2 z-50`}
              style={{ 
                maxWidth: 'calc(100vw - 1rem)',
                [position === "top" ? "bottom" : "top"]: "auto"
              }}
            >
              <div className="flex items-center gap-0.5 bg-card border border-border rounded-full px-1.5 py-1 shadow-lg">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-lg hover:scale-110 transition-transform p-0.5 hover:bg-muted rounded-full"
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
