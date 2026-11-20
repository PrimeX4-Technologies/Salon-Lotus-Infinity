import { useCallback, useState, type FormEvent } from "react";
import { LoaderCircle, LockKeyhole, Mail, UserRound, X } from "lucide-react";

import { apiErrorMessage, apiValidationErrors } from "../api/client";
import { useAuth } from "./AuthProvider";
import { GoogleSignIn } from "./GoogleSignIn";

type Mode = "login" | "register";
type AuthField = "name" | "identifier" | "password";
type FieldErrors = Partial<Record<AuthField, string>>;

const registrationIdentifierError = (value: string): string | undefined => {
  if (value.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : "Enter a valid email address.";
  }
  const compact = value.replace(/[\s().-]/g, "");
  return /^(?:0\d{9}|94\d{9}|\+[1-9]\d{7,14})$/.test(compact)
    ? undefined
    : "Enter a valid mobile number, such as 0786766354 or +94786766354.";
};

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const { login, register, googleLogin } = useAuth();

  const complete = useCallback(async (work: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await work();
      onClose();
    } catch (requestError) {
      const validation = apiValidationErrors(requestError);
      const nextFields: FieldErrors = {
        ...(validation.name ? { name: validation.name } : {}),
        ...(validation.password ? { password: validation.password } : {}),
        ...((validation.identifier || validation.email || validation.phone)
          ? { identifier: validation.identifier || validation.email || validation.phone }
          : {}),
      };
      setFieldErrors(nextFields);
      setError(
        Object.keys(nextFields).length > 0
          ? "Please correct the highlighted fields."
          : apiErrorMessage(requestError, "We could not sign you in. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }, [onClose]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const normalized = identifier.trim();
    const nextFields: FieldErrors = {};
    if (!normalized) nextFields.identifier = "Enter your email address or mobile number.";
    if (!password) nextFields.password = "Enter your password.";
    if (mode === "register") {
      if (name.trim().length < 2) nextFields.name = "Enter your full name.";
      if (normalized) nextFields.identifier = registrationIdentifierError(normalized);
      if (password && password.length < 8) {
        nextFields.password = "Use at least 8 characters.";
      }
    }
    if (Object.values(nextFields).some(Boolean)) {
      setFieldErrors(nextFields);
      setError("Please correct the highlighted fields.");
      return;
    }
    setFieldErrors({});
    setError(null);
    if (mode === "login") {
      void complete(() => login({ identifier: normalized, password }));
      return;
    }
    void complete(() => register({
      name: name.trim(),
      ...(normalized.includes("@") ? { email: normalized } : { phone: normalized }),
      password,
    }));
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div className="w-full max-w-md rounded-t-3xl border border-zinc-800 bg-[#0e0e0e] p-6 shadow-2xl sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">Customer portal</p>
            <h2 id="auth-title" className="font-serif text-2xl text-white">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="mt-1 text-sm text-zinc-400">Sign in to book and manage appointments.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} noValidate className="space-y-4">
          {mode === "register" && (
            <label className="block text-sm text-zinc-300">Full name
              <span className="relative mt-1.5 block"><UserRound className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><input required minLength={2} value={name} onChange={(event) => { setName(event.target.value); setFieldErrors((value) => ({ ...value, name: undefined })); }} autoComplete="name" aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "name-error" : undefined} className={`w-full rounded-xl border bg-zinc-950 py-2.5 pl-10 pr-3 text-white outline-none transition focus:border-[#d4af37] ${fieldErrors.name ? "border-red-700" : "border-zinc-800"}`} /></span>
              {fieldErrors.name && <span id="name-error" className="mt-1.5 block text-xs text-red-300">{fieldErrors.name}</span>}
            </label>
          )}
          <label className="block text-sm text-zinc-300">Email or mobile number
            <span className="relative mt-1.5 block"><Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><input required value={identifier} onChange={(event) => { setIdentifier(event.target.value); setFieldErrors((value) => ({ ...value, identifier: undefined })); }} autoComplete={mode === "login" ? "username" : "email"} inputMode="email" placeholder="Email or 0786766354" aria-invalid={Boolean(fieldErrors.identifier)} aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined} className={`w-full rounded-xl border bg-zinc-950 py-2.5 pl-10 pr-3 text-white outline-none transition focus:border-[#d4af37] ${fieldErrors.identifier ? "border-red-700" : "border-zinc-800"}`} /></span>
            {fieldErrors.identifier && <span id="identifier-error" className="mt-1.5 block text-xs text-red-300">{fieldErrors.identifier}</span>}
          </label>
          <label className="block text-sm text-zinc-300">Password
            <span className="relative mt-1.5 block"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><input required minLength={mode === "register" ? 8 : undefined} type="password" value={password} onChange={(event) => { setPassword(event.target.value); setFieldErrors((value) => ({ ...value, password: undefined })); }} autoComplete={mode === "login" ? "current-password" : "new-password"} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} className={`w-full rounded-xl border bg-zinc-950 py-2.5 pl-10 pr-3 text-white outline-none transition focus:border-[#d4af37] ${fieldErrors.password ? "border-red-700" : "border-zinc-800"}`} /></span>
            {fieldErrors.password && <span id="password-error" className="mt-1.5 block text-xs text-red-300">{fieldErrors.password}</span>}
          </label>
          {mode === "register" && <p className="text-xs leading-5 text-zinc-500">Use at least 8 characters. You can enter a local mobile number such as 0786766354 or include +94.</p>}
          {error && <p className="rounded-xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d4af37] py-3 font-semibold text-black transition hover:bg-[#b8962a] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}{mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-600"><span className="h-px flex-1 bg-zinc-800" />OR<span className="h-px flex-1 bg-zinc-800" /></div>
        <GoogleSignIn onCredential={(credential) => void complete(() => googleLogin(credential))} />
        <button onClick={() => { setMode((value) => value === "login" ? "register" : "login"); setError(null); setFieldErrors({}); }} className="mt-5 w-full text-sm text-zinc-400 hover:text-[#d4af37]">
          {mode === "login" ? "New here? Create a customer account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
