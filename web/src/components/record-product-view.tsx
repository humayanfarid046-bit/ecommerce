"use client";

import { useEffect } from "react";
import { useRecent } from "@/context/recent-context";

type Props = { productId: string };

export function RecordProductView({ productId }: Props) {
  const { recordView } = useRecent();

  useEffect(() => {
    recordView(productId);
  }, [productId, recordView]);

  return null;
}
