import { useEffect, useState } from "react";
import { listOffline, subscribeOffline, type SavedMovie } from "@/lib/offline";

export function useOfflineLibrary(): SavedMovie[] {
  const [items, setItems] = useState<SavedMovie[]>([]);

  useEffect(() => {
    const sync = () => setItems(listOffline());
    sync();
    return subscribeOffline(sync);
  }, []);

  return items;
}
