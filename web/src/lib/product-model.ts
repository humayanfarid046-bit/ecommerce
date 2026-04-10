/** Shared product/category types + category taxonomy (no seeded products). */

export type Category = {
  id: string;
  slug: string;
  icon: string;
  children?: { slug: string }[];
};

export type Review = {
  id: string;
  user: string;
  rating: number;
  text: string;
  date: string;
  images?: string[];
  verifiedPurchase?: boolean;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  categorySlug: string;
  price: number;
  mrp: number;
  discountPct: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  images: string[];
  highlights: string[];
  specifications?: { label: string; value: string }[];
  description: string;
  reviews: Review[];
  stockLeft?: number;
  activeViewers?: number;
  ratingBreakdown?: { 1: number; 2: number; 3: number; 4: number; 5: number };
  openBoxDelivery?: boolean;
  bundleIds?: string[];
  demoVideoUrl?: string;
  sizeOptions?: string[];
  colorOptions?: { id: string; label: string; hex: string }[];
  /** Hex (e.g. #fafafa) behind product photos on PDP gallery */
  galleryBackground?: string;
  /** ISO timestamp — product hidden from shoppers; admin can still list / restore */
  deletedAt?: string;
};

export const categories: Category[] = [
  {
    id: "1",
    slug: "mens-wear",
    icon: "👔",
    children: [
      { slug: "shirts" },
      { slug: "t-shirts" },
      { slug: "pants-jeans" },
      { slug: "formal-suits" },
      { slug: "kurta-waistcoat" },
      { slug: "mens-activewear" },
    ],
  },
  {
    id: "2",
    slug: "womens-wear",
    icon: "👗",
    children: [
      { slug: "kurti-tops" },
      { slug: "saree" },
      { slug: "lehenga" },
      { slug: "dresses-skirts" },
      { slug: "maternity-nursing" },
      { slug: "dupatta-scarves" },
    ],
  },
  {
    id: "3",
    slug: "kids-wear",
    icon: "🧒",
    children: [
      { slug: "baby-infant" },
      { slug: "toddler" },
      { slug: "boys" },
      { slug: "girls" },
      { slug: "teen-boys" },
      { slug: "teen-girls" },
      { slug: "school-uniform" },
    ],
  },
  {
    id: "4",
    slug: "seniors-wear",
    icon: "🧓",
    children: [
      { slug: "senior-men" },
      { slug: "senior-women" },
      { slug: "comfort-easy-wear" },
    ],
  },
  {
    id: "5",
    slug: "ethnic-traditional",
    icon: "🥻",
    children: [
      { slug: "panjabi" },
      { slug: "frock-salwar" },
      { slug: "sherwani" },
      { slug: "shalwar-kameez" },
    ],
  },
  {
    id: "6",
    slug: "jeans-casual",
    icon: "👖",
    children: [
      { slug: "jeans" },
      { slug: "jackets" },
      { slug: "shorts-cargo" },
      { slug: "t-shirts-polos" },
    ],
  },
  {
    id: "7",
    slug: "innerwear-nightwear",
    icon: "🛏️",
    children: [
      { slug: "innerwear" },
      { slug: "nightwear" },
      { slug: "socks-legwear" },
      { slug: "thermals" },
    ],
  },
  {
    id: "8",
    slug: "winter-wear",
    icon: "🧥",
    children: [
      { slug: "sweater" },
      { slug: "hoodie" },
      { slug: "coat-raincoat" },
      { slug: "shawls" },
    ],
  },
  {
    id: "9",
    slug: "sportswear-activewear",
    icon: "🏃",
    children: [
      { slug: "gym-yoga" },
      { slug: "sports-shorts" },
      { slug: "tracksuits" },
    ],
  },
  {
    id: "10",
    slug: "plus-size",
    icon: "➕",
    children: [{ slug: "plus-men" }, { slug: "plus-women" }],
  },
  {
    id: "11",
    slug: "footwear-accessories",
    icon: "👟",
    children: [
      { slug: "shoes" },
      { slug: "bags-belts" },
      { slug: "caps-hats" },
      { slug: "jewelry-watches" },
    ],
  },
];
