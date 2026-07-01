import type React from "react";
import { useEffect } from "react";
import "./components.css";

type ModalProps = {
  title: string;
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

export function Modal({ title, open, children, onClose }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
