const CANONICAL_ORIGIN = (import.meta.env.VITE_PUBLIC_APP_URL || "").replace(/\/$/, "");

export const redirectToCanonicalOrigin = () => {
  if (!CANONICAL_ORIGIN || typeof window === "undefined") return;
  if (window.location.origin === CANONICAL_ORIGIN) return;

  const currentHost = window.location.hostname;
  const canonicalHost = new URL(CANONICAL_ORIGIN).hostname;
  const isLocalAlias =
    ["localhost", "127.0.0.1"].includes(currentHost) &&
    ["localhost", "127.0.0.1"].includes(canonicalHost);

  if (!isLocalAlias && import.meta.env.DEV) return;

  window.location.replace(
    `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
};
