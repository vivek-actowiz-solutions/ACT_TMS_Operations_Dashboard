import { createPortal } from "react-dom";

export default function TopPopupPortal({ children }) {
  return createPortal(
    children,
    document.getElementById("popup-root")
  );
}
