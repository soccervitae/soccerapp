import { usePwaUpdate } from "@/hooks/usePwaUpdate";

// Component that handles automatic PWA updates
const PwaAutoUpdate = () => {
  usePwaUpdate();
  return null;
};

export default PwaAutoUpdate;
