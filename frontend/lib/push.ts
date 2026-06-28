export async function requestNotificationPermission() {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeToPush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  // In production, subscribe with VAPID public key
  console.log("Push ready");
}
