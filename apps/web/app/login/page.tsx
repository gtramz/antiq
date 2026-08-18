import { Suspense } from "react";
import { RedirectIfAuthenticated } from "@/modules/auth/auth-gate";
import { LoginForm } from "@/modules/auth/login-form";

export default function LoginPage() {
  return (
    <RedirectIfAuthenticated>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <p className="voice text-[11px] text-muted">Loading…</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </RedirectIfAuthenticated>
  );
}
