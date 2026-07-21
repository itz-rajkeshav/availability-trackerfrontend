import { useEffect } from "react";

// one shared modal instead of everyone rolling their own (also handles Escape to close)
export default function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="mq-modal-backdrop" onClick={onClose}>
      <div
        className={`mq-modal-panel ${maxWidth}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="text-base font-semibold text-ink-50">{title}</h3>}
        <div className={title ? "mt-3" : ""}>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
