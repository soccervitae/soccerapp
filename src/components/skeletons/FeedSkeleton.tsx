import { Skeleton } from "@/components/ui/skeleton";

export const FeedPostSkeleton = () => {
  return (
    <div className="bg-card border-b border-border p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Media */}
      <Skeleton className="w-full aspect-square rounded-lg mb-3" />
      
      {/* Actions */}
      <div className="flex items-center gap-4 mb-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      
      {/* Likes and caption */}
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
};

export const FeedSkeleton = () => {
  return (
    <div className="space-y-0">
      {[1, 2, 3].map((i) => (
        <FeedPostSkeleton key={i} />
      ))}
    </div>
  );
};

export const StoriesSkeleton = () => {
  return (
    <div className="flex gap-4 overflow-hidden px-4 py-3 border-b border-border">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 animate-fade-in">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
};
