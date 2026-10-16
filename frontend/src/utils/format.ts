export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const errorMessage = (err: unknown): string => {
  const e = err as { response?: { data?: { error?: string; issues?: { message: string }[] } } };
  return e.response?.data?.issues?.[0]?.message ?? e.response?.data?.error ?? 'Something went wrong. Try again.';
};
