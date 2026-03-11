import {Platform} from 'react-native';

let ReactNativeHapticFeedback: any = null;

try {
  ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
} catch {}

const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const haptics = {
  light: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('impactLight', options);
    }
  },
  medium: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('impactMedium', options);
    }
  },
  heavy: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('impactHeavy', options);
    }
  },
  success: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('notificationSuccess', options);
    }
  },
  warning: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('notificationWarning', options);
    }
  },
  error: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('notificationError', options);
    }
  },
  selection: () => {
    if (ReactNativeHapticFeedback) {
      ReactNativeHapticFeedback.trigger('selection', options);
    }
  },
};
