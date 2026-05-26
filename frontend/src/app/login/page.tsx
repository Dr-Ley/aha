"use client";

import { useState, Suspense } from "react";
import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Lock, Mail, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setFormError("Invalid email or password.");
        return;
      }

      if (result?.ok) {
        const permRes = await fetch("/api/dashboard/permissions");
        if (!permRes.ok) {
          await signOut({ redirect: false });
          setFormError(
            "This sign-in page is for staff only. Traveller accounts should use Sign In on the main website."
          );
          return;
        }
        router.push(result.url ?? callbackUrl);
        router.refresh();
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-base-content/60 transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to website
      </Link>

      <div className="overflow-hidden rounded-2xl border border-base-content/10 bg-base-100 shadow-xl">
        <div className="bg-neutral px-8 py-10 text-neutral-content">
          <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">
            Staff sign in
          </h1>
          <p className="mt-2 text-sm text-neutral-content/80">
            African Home Adventure &amp; Enchoro Wildlife Camp operations portal
          </p>
        </div>

        <div className="p-8">
          {formError ? (
            <div className="mb-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error" role="alert">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="form-control">
              <label className="label" htmlFor="staff-email">
                <span className="label-text font-medium">Work email</span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
                  aria-hidden
                />
                <input
                  id="staff-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`input input-bordered w-full pl-10 ${fieldErrors.email ? "input-error" : ""}`}
                  placeholder="you@africahomeadventure.com"
                  disabled={loading}
                />
              </div>
              {fieldErrors.email ? (
                <p className="mt-1 text-xs text-error">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div className="form-control">
              <label className="label" htmlFor="staff-password">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/40"
                  aria-hidden
                />
                <input
                  id="staff-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input input-bordered w-full pl-10 pr-12 ${fieldErrors.password ? "input-error" : ""}`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-base-content/50 hover:bg-base-200 hover:text-base-content"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="mt-1 text-xs text-error">{fieldErrors.password}</p>
              ) : null}
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      }
    >
      <StaffLoginForm />
    </Suspense>
  );
}
