import { Skeleton } from "@/components/ui/skeleton";

const MessageBubbleSkeleton = ({ isOwn }: { isOwn: boolean }) => {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        <Skeleton 
          className={`h-12 rounded-2xl ${
            isOwn 
              ? "w-48 rounded-br-md" 
              : "w-56 rounded-bl-md"
          }`} 
        />
        <Skeleton className={`h-3 w-12 mt-1 ${isOwn ? "ml-auto" : ""}`} />
      </div>
    </div>
  );
};

export const ChatHeaderSkeleton = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border h-14 flex items-center px-4 gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-4 w-28 mb-1" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
};

export const ChatMessagesSkeleton = () => {
  const messagePatterns = [
    { isOwn: false },
    { isOwn: false },
    { isOwn: true },
    { isOwn: false },
    { isOwn: true },
    { isOwn: true },
    { isOwn: false },
  ];

  return (
    <div className="space-y-3 px-2">
      {messagePatterns.map((pattern, i) => (
        <MessageBubbleSkeleton key={i} isOwn={pattern.isOwn} />
      ))}
    </div>
  );
};

export const ChatInputSkeleton = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      </div>
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ChatHeaderSkeleton />
      <div className="flex-1 overflow-hidden pt-16 pb-24">
        <ChatMessagesSkeleton />
      </div>
      <ChatInputSkeleton />
    </div>
  );
};
