import { Skeleton } from "@/components/ui/skeleton";

export const ProfileCardSkeleton = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 animate-fade-in">
      <Skeleton className="w-11 h-11 rounded-full shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-32 mb-1.5" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-7 w-16 rounded-md shrink-0" />
    </div>
  );
};

export const ExploreSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <ProfileCardSkeleton key={i} />
      ))}
    </div>
  );
};
