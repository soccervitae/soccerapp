import { useEffect, useCallback, useRef } from "react";
import { useAdminRefresh } from "@/components/admin/AdminLayout";

export function useAdminPageRefresh(refetch: () => Promise<any>) {
  const context = useAdminRefresh();
  const refetchRef = useRef(refetch);
  
  // Keep ref updated
  refetchRef.current = refetch;

  const handleRefresh = useCallback(async () => {
    await refetchRef.current();
  }, []);

  useEffect(() => {
    // Only register callback if context is available
    if (context?.onRefreshCallback) {
      context.onRefreshCallback(handleRefresh);
    }
  }, [handleRefresh, context]);
}

