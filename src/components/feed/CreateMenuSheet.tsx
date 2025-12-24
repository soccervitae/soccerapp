import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-10">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">O que você quer criar?</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 px-2">
          {menuOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${option.colorClass}`}>
                <span className="material-symbols-outlined text-[28px]">
                  {option.icon}
                </span>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
