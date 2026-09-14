const TOAST_EVENT = "admin-admin-toast";

export function showToast(toast) {
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: {
        type: "error",
        duration: 4500,
        ...toast,
      },
    }),
  );
}

export function onToast(callback) {
  const handler = (event) => callback(event.detail);
  window.addEventListener(TOAST_EVENT, handler);
  return () => window.removeEventListener(TOAST_EVENT, handler);
}
