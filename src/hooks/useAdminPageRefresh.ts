import { useEffect, useCallback, useRef } from "react";
import { useAdminRefresh } from "@/components/admin/AdminLayout";

export function useAdminPageRefresh(refetch: () => Promise<any>) {
  const { onRefreshCallback } = useAdminRefresh();
  const refetchRef = useRef(refetch);
  
  // Keep ref updated
  refetchRef.current = refetch;

  const handleRefresh = useCallback(async () => {
    await refetchRef.current();
  }, []);

  useEffect(() => {
    onRefreshCallback(handleRefresh);
  }, [handleRefresh, onRefreshCallback]);
}

