/** English search tokens + nav.* message keys for labels. */
export const OUTFIT_SEARCH_CHIPS = [
  { query: "saree", labelKey: "drawerOutfitSaree" },
  { query: "churidar", labelKey: "drawerOutfitChuridar" },
  { query: "lehenga", labelKey: "drawerOutfitLehenga" },
  { query: "kurta", labelKey: "drawerOutfitKurta" },
  { query: "salwar", labelKey: "drawerOutfitSalwar" },
  { query: "kurti", labelKey: "drawerOutfitKurti" },
  { query: "dupatta", labelKey: "drawerOutfitDupatta" },
  { query: "anarkali", labelKey: "drawerOutfitAnarkali" },
  { query: "palazzo", labelKey: "drawerOutfitPalazzo" },
  { query: "gown", labelKey: "drawerOutfitGown" },
  { query: "sharara", labelKey: "drawerOutfitSharara" },
  { query: "punjabi", labelKey: "drawerOutfitPunjabi" },
] as const satisfies readonly { query: string; labelKey: string }[];
