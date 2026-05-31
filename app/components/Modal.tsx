"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

type ModalSize = "md" | "lg" | "full";

const sizeClass: Record<ModalSize, string> = {
  md: "sm:max-w-md",
  lg: "sm:max-w-2xl",
  full: "sm:max-w-5xl",
};

// Pilha de modais abertos para que o Esc feche apenas o do topo.
const modalStack: symbol[] = [];

export default function Modal({
  open,
  onClose,
  title,
  eyebrow,
  size = "lg",
  zClassName = "z-50",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  size?: ModalSize;
  zClassName?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const token = Symbol("modal");
    modalStack.push(token);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && modalStack[modalStack.length - 1] === token) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = modalStack.indexOf(token);
      if (index !== -1) modalStack.splice(index, 1);
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = `modal-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      role="dialog"
      className={`fixed inset-0 grid items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5 ${zClassName}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`flex max-h-[95vh] w-full flex-col overflow-hidden rounded-t-lg border border-black/10 bg-white shadow-xl shadow-slate-950/30 sm:mx-auto sm:rounded-lg ${sizeClass[size]}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-black/10 bg-white p-4 sm:p-5">
          <div className="min-w-0">
            {eyebrow ? <p className="text-xs font-black uppercase text-green-700">{eyebrow}</p> : null}
            <h2 id={titleId} className="mt-1 text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              {title}
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-black/10 bg-white text-slate-800"
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto p-4 sm:p-5">{children}</div>

        {footer ? (
          <div className="sticky bottom-0 z-10 border-t border-black/10 bg-white p-4 sm:p-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
