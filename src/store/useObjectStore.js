import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useObjectStore = create()(
  persist(
    (set) => ({
      selectedMapId: null,
      mapType: "y", // default: hybrid
      objectType: "MAP", // default: MAP
      
      setSelectedMapId: (id) => set({ selectedMapId: id }),
      setMapType: (type) => set({ mapType: type }),
      setObjectType: (type) => set({ objectType: type }),
      
      // Reset function
      resetObjectSettings: () => set({
        selectedMapId: null,
        mapType: "y",
        objectType: "MAP",
      }),
    }),
    {
      name: "object-settings",
    }
  )
);
