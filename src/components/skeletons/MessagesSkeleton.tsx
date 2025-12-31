import { Skeleton } from "@/components/ui/skeleton";

export const ConversationSkeleton = () => {
  return (
    <div className="flex items-center gap-3 p-3 animate-fade-in">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex flex-col items-end gap-1">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
    </div>
  );
};

export const OnlineUsersSkeleton = () => {
  return (
    <div className="flex gap-2 px-3 pb-2 overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 animate-fade-in">
          <Skeleton className="w-14 h-14 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
};

export const MessagesSkeleton = () => {
  return (
    <div className="space-y-0 divide-y divide-border bg-muted/30 rounded-lg overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <ConversationSkeleton key={i} />
      ))}
    </div>
  );
};
