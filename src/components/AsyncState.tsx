import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

import { apiErrorMessage } from "../api/client";

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="h-5 w-5 animate-spin text-[#d4af37]" />{label}…</div>;
}

export function ErrorBlock({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-center">
      <AlertCircle className="mb-3 h-7 w-7 text-red-400" />
      <p className="text-sm text-red-200">{apiErrorMessage(error, "This information could not be loaded.")}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 flex items-center gap-2 rounded-xl border border-red-800 px-4 py-2 text-sm text-red-200 hover:bg-red-950"><RefreshCw className="h-4 w-4" />Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/50 p-10 text-center"><p className="font-serif text-xl text-white">{title}</p><p className="mt-2 text-sm text-zinc-500">{message}</p></div>;
}
