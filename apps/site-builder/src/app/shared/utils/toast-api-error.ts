import { LocaleService } from '@invento/shared-util-i18n';
import { toast } from '@spartan/helm/sonner';

/**
 * Surfaces an API error as a toast.
 *
 * NestJS validation failures arrive as `error.message: string[]`, other
 * failures as a plain string, and an unreachable server yields an HTTP error
 * whose `message` is sometimes a whole HTML error page — which must never be
 * shown to the user.
 *
 * @param toastId when given, replaces that pending loading toast in place.
 */
export function toastApiError(
  err: unknown,
  fallbackKey: string,
  locale: LocaleService,
  toastId?: string | number,
): void {
  const messages = messagesFrom(err);

  if (messages.length > 1) {
    if (toastId !== undefined) toast.dismiss(toastId);
    messages.forEach((m) => toast.error(m));
    return;
  }

  const text = messages[0] ?? locale.translate(fallbackKey);
  toast.error(text, toastId !== undefined ? { id: toastId } : undefined);
}

function messagesFrom(err: unknown): string[] {
  const e = err as { error?: { message?: string | string[] }; message?: string } | null;

  const apiMessage = e?.error?.message;
  if (Array.isArray(apiMessage)) return apiMessage.filter((m) => typeof m === 'string');
  if (typeof apiMessage === 'string' && apiMessage) return [apiMessage];

  // A raw HTML error page leaks through as `message` when the request never
  // reached the API — useless to the user, so fall through to the caller's key.
  if (typeof e?.message === 'string' && e.message && !e.message.includes('<!DOCTYPE')) {
    return [e.message];
  }

  return [];
}
