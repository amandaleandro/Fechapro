"use client";

export function SlidesPrintButton() {
  return (
    <button type="button" onClick={() => window.print()}>
      Imprimir slides
    </button>
  );
}
