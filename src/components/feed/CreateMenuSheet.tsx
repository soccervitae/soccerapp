import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useProfile } from "@/hooks/useProfile";

type CreateOption = "post" | "replay" | "highlight" | "times" | "championship" | "achievement";

interface CreateMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectOption: (option: CreateOption) => void;
}

const allMenuOptions = [
  {
    id: "post" as CreateOption,
    label: "Post",
    description: "Compartilhe uma foto ou vídeo",
    icon: "add_photo_alternate",
    colorClass: "bg-blue-500/20 text-blue-500",
    adminOnly: false,
  },
  {
    id: "replay" as CreateOption,
    label: "Replay",
    description: "Adicione um replay de 24h",
    icon: "slow_motion_video",
    colorClass: "bg-purple-500/20 text-purple-500",
    adminOnly: false,
  },
  {
    id: "highlight" as CreateOption,
    label: "Destaque",
    description: "Adicione aos seus destaques",
    icon: "auto_awesome",
    colorClass: "bg-amber-500/20 text-amber-500",
    adminOnly: false,
  },
  {
    id: "times" as CreateOption,
    label: "Times",
    description: "Selecione seus times",
    icon: "shield",
    colorClass: "bg-red-500/20 text-red-500",
    adminOnly: false,
  },
  {
    id: "championship" as CreateOption,
    label: "Campeonato",
    description: "Adicione ao seu currículo",
    icon: "emoji_events",
    colorClass: "bg-yellow-500/20 text-yellow-500",
    adminOnly: false,
  },
  {
    id: "achievement" as CreateOption,
    label: "Conquista",
    description: "Registre suas conquistas",
    icon: "military_tech",
    colorClass: "bg-emerald-500/20 text-emerald-500",
    adminOnly: false,
  },
];

// Options blocked for non-official admin accounts (they should use admin page)
const contentCreationOptions: CreateOption[] = ["post", "replay", "highlight"];

export const CreateMenuSheet = ({
  open,
  onOpenChange,
  onSelectOption,
}: CreateMenuSheetProps) => {
  const { isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  
  // Check if user is official account (can create content anywhere)
  const isOfficialAccount = profile?.is_official_account === true;
  
  // Admin users (except official account) can't create posts/replays/highlights from public app
  const filteredOptions = allMenuOptions.filter(option => {
    if (isAdmin && !isOfficialAccount && contentCreationOptions.includes(option.id)) {
      return false;
    }
    return true;
  });

  const handleSelect = (option: CreateOption) => {
    onOpenChange(false);
    // Small delay to allow sheet close animation
    setTimeout(() => {
      onSelectOption(option);
    }, 150);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-md" useFullHeight>
        <ResponsiveModalHeader className="pb-4">
          <ResponsiveModalTitle className="text-center">O que você quer criar?</ResponsiveModalTitle>
        </ResponsiveModalHeader>

        <div className="flex flex-col gap-2 px-2">
          {filteredOptions.map((option) => (
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
          
          {/* Show message for admin users */}
          {isAdmin && !isOfficialAccount && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                Para criar posts e destaques, acesse a{" "}
                <span className="font-semibold">área administrativa</span>.
              </p>
            </div>
          )}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
