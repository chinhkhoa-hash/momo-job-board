"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="p-form">
      <input type="hidden" name="next" value={next} />
      <label className="p-field">
        <span>Tên đăng nhập</span>
        <input name="username" autoComplete="username" required autoFocus />
      </label>
      <label className="p-field">
        <span>Mật khẩu</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state?.error && <p className="p-error" role="alert">{state.error}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Đang đăng nhập…" : "Đăng nhập"}</button>
    </form>
  );
}
