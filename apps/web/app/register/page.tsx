import { RedirectIfAuthenticated } from "@/modules/auth/auth-gate";
import { RegisterFlow } from "@/modules/auth/register-flow";

export default function RegisterPage() {
  return (
    <RedirectIfAuthenticated>
      <RegisterFlow />
    </RedirectIfAuthenticated>
  );
}
