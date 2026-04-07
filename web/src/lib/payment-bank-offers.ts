/** Demo bank / issuer offers shown on checkout (replace with offers API). */

export type BankOffer = {
  id: string;
  title: string;
  detail: string;
  /** Highlight when user picks matching method */
  matchPayKey?: string;
  matchCardPrefix?: string;
};

export const BANK_OFFERS_DEMO: BankOffer[] = [
  {
    id: "hdfc10",
    title: "HDFC Debit — 10% off",
    detail: "Up to ₹750. Min order ₹2,499.",
    matchCardPrefix: "4",
  },
  {
    id: "icici_cb",
    title: "ICICI Credit — 5% cashback",
    detail: "Credited within 90 days. T&C apply.",
    matchCardPrefix: "5",
  },
  {
    id: "upi_first",
    title: "First UPI on Razorpay",
    detail: "Extra ₹50 off for first UPI txn this month (demo).",
    matchPayKey: "upi_gpay",
  },
  {
    id: "amex",
    title: "RuPay / select cards",
    detail: "Zero EMI on 3 months for orders ₹5,000+ (demo).",
  },
];
