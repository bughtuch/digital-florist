'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="text-[9px] tracking-[0.22em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
    >
      PRINT ·
    </button>
  );
}
