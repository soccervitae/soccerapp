import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";

type CreateOption = "post" | "replay" | "championship" | "achievement";

interface CreateMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: CreateOption) => void;
}

const menuOptions = [
  {
    id: "post" as CreateOption,
    label: "Post",
    description: "Compartilhe uma foto ou vídeo",
    icon: "add_photo_alternate",
    colorClass: "bg-blue-500/20 text-blue-500",
  },
  {
    id: "replay" as CreateOption,
    label: "Replay",
    description: "Crie um story temporário",
    icon: "slideshow",
    colorClass: "bg-red-500/20 text-red-500",
  },
  {
    id: "championship" as CreateOption,
    label: "Campeonato",
    description: "Adicione ao seu currículo",
    icon: "emoji_events",
    colorClass: "bg-yellow-500/20 text-yellow-500",
  },
  {
    id: "achievement" as CreateOption,
    label: "Conquista",
    description: "Registre suas conquistas",
    icon: "military_tech",
    colorClass: "bg-emerald-500/20 text-emerald-500",
  },
];

export const CreateMenuSheet = ({
  open,
  onOpenChange,
  onSelectOption,
}: CreateMenuSheetProps) => {
  const handleSelect = (option: CreateOption) => {
    onOpenChange(false);
    // Small delay to allow sheet close animation
    setTimeout(() => {
      onSelectOption(option);
    }, 150);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md">
        <ResponsiveModalHeader className="pb-4">
          <ResponsiveModalTitle className="text-center">O que você quer criar?</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="flex flex-col gap-2 px-2">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-[0.98]"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${option.colorClass}`}>
                <span className="material-symbols-outlined text-[24px]">
                  {option.icon}
                </span>
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
