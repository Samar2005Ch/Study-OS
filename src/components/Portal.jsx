import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

/**
 * Portal component to render children outside the main DOM hierarchy
 * Useful for modals, tooltips, and overlays to avoid z-index/overflow issues.
 */
export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  return mounted ? createPortal(children, document.body) : null;
}
