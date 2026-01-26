import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

/**
 * Utility for triggering haptic feedback on iOS/Android native platforms
 */
export const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Medium) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Ignore errors if haptics fail
    }
  }
};

export const triggerNotificationHaptic = async (type: NotificationType = NotificationType.Success) => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type });
    } catch (e) {
      // Ignore
    }
  }
};

export const triggerSelectionHaptic = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionStart();
    } catch (e) {
      // Ignore
    }
  }
};
