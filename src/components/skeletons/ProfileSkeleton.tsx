import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="animate-fade-in">
      {/* Cover skeleton */}
      <Skeleton className="w-full h-32" />
      
      {/* Avatar and info skeleton */}
      <div className="flex flex-col items-center -mt-16 px-4">
        <Skeleton className="w-28 h-28 rounded-full border-4 border-background" />
        <Skeleton className="h-6 w-40 mt-4" />
        <Skeleton className="h-4 w-32 mt-2" />
        
        {/* Stats skeleton */}
        <div className="flex gap-8 mt-4">
          <div className="flex flex-col items-center">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-12 mt-1" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
          <div className="flex flex-col items-center">
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-3 w-14 mt-1" />
          </div>
        </div>
        
        {/* Bio skeleton */}
        <Skeleton className="h-16 w-full mt-4 rounded-xl" />
        
        {/* Button skeleton */}
        <Skeleton className="h-10 w-full mt-4 rounded-lg" />
      </div>
      
      {/* Highlights skeleton */}
      <div className="mt-6 px-4">
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="w-16 h-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Posts grid skeleton */}
      <div className="mt-6 px-4">
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-sm" />
          ))}
        </div>
      </div>
    </div>
  );
};
