/**
 * Notification Preferences Manager
 * Handles user preferences for analytics milestone notifications
 */

export interface NotificationMilestone {
  id: string;
  type: "wallet_adds" | "qr_scans" | "card_views" | "shares";
  threshold: number;
  enabled: boolean;
}

export interface NotificationPreferences {
  enableNotifications: boolean;
  milestones: NotificationMilestone[];
  soundEnabled: boolean;
  desktopNotificationsEnabled: boolean;
}

const STORAGE_KEY = "notification_preferences";

const DEFAULT_MILESTONES: NotificationMilestone[] = [
  { id: "wallet_100", type: "wallet_adds", threshold: 100, enabled: true },
  { id: "wallet_500", type: "wallet_adds", threshold: 500, enabled: false },
  { id: "qr_50", type: "qr_scans", threshold: 50, enabled: true },
  { id: "qr_250", type: "qr_scans", threshold: 250, enabled: false },
  { id: "views_100", type: "card_views", threshold: 100, enabled: true },
  { id: "shares_50", type: "shares", threshold: 50, enabled: false },
];

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableNotifications: true,
  milestones: DEFAULT_MILESTONES,
  soundEnabled: true,
  desktopNotificationsEnabled: true,
};

/**
 * Load notification preferences from localStorage
 */
export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading notification preferences:", error);
  }
  return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationPreferences(preferences: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error("Error saving notification preferences:", error);
  }
}

/**
 * Check if a milestone has been reached
 */
export function checkMilestoneReached(
  currentValue: number,
  previousValue: number,
  milestone: NotificationMilestone
): boolean {
  if (!milestone.enabled) return false;
  return previousValue < milestone.threshold && currentValue >= milestone.threshold;
}

/**
 * Get milestone description
 */
export function getMilestoneDescription(milestone: NotificationMilestone): string {
  const typeLabels: Record<string, string> = {
    wallet_adds: "Wallet Additions",
    qr_scans: "QR Code Scans",
    card_views: "Card Views",
    shares: "Shares",
  };
  return `${typeLabels[milestone.type]}: ${milestone.threshold}`;
}

/**
 * Request permission for desktop notifications
 */
export async function requestDesktopNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("Desktop notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Send desktop notification
 */
export function sendDesktopNotification(title: string, options?: NotificationOptions): void {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      ...options,
    });
  }
}

/**
 * Play notification sound
 */
export function playNotificationSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
}
