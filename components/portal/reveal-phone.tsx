"use client";

import { useState, useTransition } from "react";
import { revealPhoneAction } from "@/app/portal/actions";

export default function RevealPhone({ id, masked }: { id: string; masked: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (phone) return <a href={`tel:${phone}`} className="p-strong">{phone}</a>;
  return (
    <span className="p-reveal">
      <span>{masked}</span>
      <button
        type="button"
        className="btn btn-link"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await revealPhoneAction(id);
            if (r.phone) setPhone(r.phone);
            else setError(r.error ?? "Không hiện được số.");
          })
        }
      >
        {pending ? "Đang mở…" : "Hiện số điện thoại"}
      </button>
      {error && <span className="p-error">{error}</span>}
    </span>
  );
}
