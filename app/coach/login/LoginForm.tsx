"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { loginCoach } from "./actions";
import { Field, inputCls } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginCoach, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className={`space-y-4 ${state?.error ? "shake" : ""}`} key={state?.error ? Date.now() : "f"}>
      <Field label="Username" required>
        <input name="username" autoComplete="username" autoCapitalize="none" className={inputCls} placeholder="coach" required />
      </Field>
      <Field label="Password" required>
        <div className="relative">
          <input name="password" type={show ? "text" : "password"} autoComplete="current-password" className={`${inputCls} pr-11`} required />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyikan password" : "Tampilkan password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-ink-muted">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>
      {state?.error && <p role="alert" className="rounded-[6px] bg-alpa-bg px-3 py-2 text-sm text-alpa-ink">⚠ {state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        <LogIn size={18} /> {pending ? "Memeriksa…" : "Masuk"}
      </Button>
    </form>
  );
}
