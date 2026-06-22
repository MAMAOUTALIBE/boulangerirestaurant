"use client";

import { useEffect } from "react";

/** Déclenche la boîte d'impression à l'ouverture du ticket. */
export function PrintTrigger() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return null;
}
