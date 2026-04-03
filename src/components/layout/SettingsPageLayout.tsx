import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopHeader } from "@/components/layout/DesktopHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { ReactNode } from "react";

interface SettingsPageLayoutProps {
  title: string;
  children: ReactNode;
  backPath?: string;
}

export function SettingsPageLayout({ title, children, backPath = "/settings" }: SettingsPageLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-muted/30">
        <DesktopHeader />
        <div className="flex pt-14 max-w-screen-2xl mx-auto">
          <DesktopSidebar />
          <main className="flex-1 min-w-0 px-4 py-4 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => navigate(backPath)}
                  className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted text-foreground transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">arrow_back</span>
                </button>
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              </div>
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 h-[50px] flex items-center">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-base font-bold text-foreground ml-2">{title}</h1>
      </header>
      <div className="pt-[50px] pb-20">
        {children}
      </div>
    </div>
  );
}
