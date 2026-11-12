"use client";
import { SignIn } from "@clerk/nextjs";

/** Login Google (Clerk). Akun baru otomatis dibuat; data diri diisi setelahnya. */
export function GoogleSignIn({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="flex justify-center">
      <SignIn routing="hash" withSignUp forceRedirectUrl={redirectTo} signUpForceRedirectUrl={redirectTo} />
    </div>
  );
}
