import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../theme';
import {scale} from '../../utils/responsive';

export interface ModalAction {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AppModalProps {
  visible: boolean;
  title: string;
  message?: string;
  actions?: ModalAction[];
  onClose: () => void;
  children?: React.ReactNode;
}

export default function AppModal({
  visible,
  title,
  message,
  actions,
  onClose,
  children,
}: AppModalProps) {
  const {colors, borderRadius} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, modalScale]);

  if (!visible) return null;

  const resolvedActions = actions && actions.length > 0
    ? actions
    : [{text: 'OK', onPress: onClose}];

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, {opacity}]} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          styles.modal,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            opacity,
            transform: [{scale: modalScale}],
          },
        ]}>
        <Text style={[styles.title, {color: colors.text}]}>{title}</Text>
        {message ? (
          <Text style={[styles.message, {color: colors.textSecondary}]}>
            {message}
          </Text>
        ) : null}
        {children}
        <View
          style={[
            styles.actions,
            {borderTopColor: colors.divider},
          ]}>
          {resolvedActions.map((action, i) => {
            let textColor = colors.primary;
            let fontWeight: '500' | '600' | '700' = '600';
            if (action.style === 'destructive') {
              textColor = colors.error || '#E53935';
            } else if (action.style === 'cancel') {
              textColor = colors.textSecondary;
              fontWeight = '500';
            }

            return (
              <TouchableOpacity
                key={i}
                style={[
                  styles.actionBtn,
                  i > 0 && {borderLeftWidth: 0.5, borderLeftColor: colors.divider},
                ]}
                onPress={() => {
                  action.onPress?.();
                  onClose();
                }}>
                <Text style={[styles.actionText, {color: textColor, fontWeight}]}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(32),
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: '100%',
    maxWidth: scale(320),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    fontSize: scale(17),
    fontWeight: '700',
    paddingHorizontal: scale(20),
    paddingTop: scale(20),
    paddingBottom: scale(4),
  },
  message: {
    fontSize: scale(14),
    lineHeight: scale(20),
    paddingHorizontal: scale(20),
    paddingBottom: scale(16),
    paddingTop: scale(4),
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: scale(14),
    alignItems: 'center',
  },
  actionText: {
    fontSize: scale(15),
  },
});
