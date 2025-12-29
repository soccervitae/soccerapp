import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "👎"];

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
  return (
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
            <div className="flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji);
                    onClose();
                  }}
                  className="text-xl hover:scale-125 transition-transform p-1 hover:bg-muted rounded-full"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
