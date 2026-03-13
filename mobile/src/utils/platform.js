// Cross-platform utilities — web + mobile safe
import { Platform, Dimensions, Alert } from 'react-native';

export const isWeb    = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// Screen dimensions — responsive layout helper
export const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// On web, cap the content width so it looks good on wide screens
export const CONTENT_WIDTH = isWeb ? Math.min(SCREEN_W, 480) : SCREEN_W;

// Web-safe Alert — falls back to window.alert on web
export const showAlert = (title, message, buttons) => {
  if (isWeb) {
    const msg = message ? `${title}\n\n${message}` : title;
    if (buttons?.length > 1) {
      const confirmed = window.confirm(msg);
      if (confirmed) buttons.find(b => b.style !== 'cancel')?.onPress?.();
      else           buttons.find(b => b.style === 'cancel')?.onPress?.();
    } else {
      window.alert(msg);
      buttons?.[0]?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

// Web-safe top padding (replaces paddingTop: 56 safe area)
export const TOP_PAD = isWeb ? 20 : 56;
