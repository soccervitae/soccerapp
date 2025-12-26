import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsPWA } from "@/hooks/useIsPWA";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResponsiveModalContentProps {
  children: React.ReactNode;
  className?: string;
  useFullHeight?: boolean;
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveModalContext = React.createContext<{ isMobile: boolean; isPWA: boolean }>({
  isMobile: false,
  isPWA: false,
});

export function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();

  if (isMobile) {
    return (
      <ResponsiveModalContext.Provider value={{ isMobile: true, isPWA }}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveModalContext.Provider>
    );
  }

  return (
    <ResponsiveModalContext.Provider value={{ isMobile: false, isPWA }}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {children}
      </Dialog>
    </ResponsiveModalContext.Provider>
  );
}

export function ResponsiveModalContent({ children, className, useFullHeight = false }: ResponsiveModalContentProps) {
  const { isMobile, isPWA } = React.useContext(ResponsiveModalContext);

  // Para sheets com useFullHeight: PWA = 100%, Web = 90vh
  const shouldUseFullHeight = useFullHeight && isPWA;

  if (isMobile) {
    return (
      <DrawerContent 
        fullHeight={shouldUseFullHeight}
        className={cn(
          "px-4 pb-6",
          useFullHeight && !isPWA && "h-[90vh]",
          className
        )}
      >
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn(useFullHeight && "h-[90vh]", className)}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveModalHeader({ children, className }: ResponsiveModalHeaderProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext);

  if (isMobile) {
    return <DrawerHeader className={cn("text-left", className)}>{children}</DrawerHeader>;
  }

  return <DialogHeader className={className}>{children}</DialogHeader>;
}

export function ResponsiveModalTitle({ children, className }: ResponsiveModalTitleProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext);

  if (isMobile) {
    return <DrawerTitle className={className}>{children}</DrawerTitle>;
  }

  return <DialogTitle className={className}>{children}</DialogTitle>;
}

export function ResponsiveModalDescription({ children, className }: ResponsiveModalDescriptionProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext);

  if (isMobile) {
    return <DrawerDescription className={className}>{children}</DrawerDescription>;
  }

  return <DialogDescription className={className}>{children}</DialogDescription>;
}

export function ResponsiveModalFooter({ children, className }: ResponsiveModalFooterProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext);

  if (isMobile) {
    return <DrawerFooter className={cn("pt-4", className)}>{children}</DrawerFooter>;
  }

  return <DialogFooter className={className}>{children}</DialogFooter>;
}

// Trigger component for sheets with triggers
interface ResponsiveModalTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function ResponsiveModalTrigger({ children, asChild }: ResponsiveModalTriggerProps) {
  const { isMobile } = React.useContext(ResponsiveModalContext);

  if (isMobile) {
    return <DrawerTrigger asChild={asChild}>{children}</DrawerTrigger>;
  }

  return <DialogTrigger asChild={asChild}>{children}</DialogTrigger>;
}

// ScrollArea wrapper for consistent scrolling
interface ResponsiveModalScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveModalScrollArea({ children, className }: ResponsiveModalScrollAreaProps) {
  return <ScrollArea className={cn("flex-1", className)}>{children}</ScrollArea>;
}

// Alert Modal for confirmations

interface ResponsiveAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  confirmVariant?: "default" | "destructive";
}

export function ResponsiveAlertModal({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  onConfirm,
  confirmVariant = "default",
}: ResponsiveAlertModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pt-4">
            <Button
              variant={confirmVariant}
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirmText}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">{cancelText}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
