import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import FeatherIcon from '@react-native-vector-icons/feather';
import type {MainTabParams} from './types';
import {useTheme} from '../theme';
import {useAppStore} from '../stores/app.store';
import {useConfigStore} from '../stores/config.store';
import {scale} from '../utils/responsive';
import HomeStack from './HomeStack';
import RoomStack from './RoomStack';
import FriendsStack from './FriendsStack';
import ProfileStack from './ProfileStack';

// Root screens where the bottom tabs should be visible
const TAB_VISIBLE_SCREENS: Record<string, string[]> = {
  HomeTab: ['Home', 'CreateRoom'],
  RoomsTab: ['RoomList'],
  FriendsTab: ['FriendsList'],
  ProfileTab: ['ProfileMain'],
};

const TAB_HEIGHT = scale(68);

const Tab = createBottomTabNavigator<MainTabParams>();

// Placeholder — never rendered; tab press is intercepted to navigate to CreateRoom
function Noop() {
  return null;
}

function TabIcon({
  name,
  color,
  focused,
  label,
  badge,
  primaryColor,
}: {
  name: React.ComponentProps<typeof FeatherIcon>['name'];
  color: string;
  focused: boolean;
  label: string;
  badge?: number;
  primaryColor: string;
}) {
  return (
    <View style={styles.tabIconContainer}>
      {focused && (
        <View
          style={[styles.activeIndicator, {backgroundColor: primaryColor}]}
        />
      )}
      <View style={styles.iconWrapper}>
        <FeatherIcon name={name} color={color} size={scale(22)} />
        {badge != null && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.tabLabel,
          {color, fontWeight: focused ? '600' : '400'},
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Returns hidden style for non-root screens, undefined otherwise */
function shouldHideTabBar(route: any, tabName: string): boolean {
  const focusedRoute = getFocusedRouteNameFromRoute(route);
  const allowedScreens = TAB_VISIBLE_SCREENS[tabName] || [];
  return focusedRoute != null && !allowedScreens.includes(focusedRoute);
}

export default function MainTabs() {
  const {colors} = useTheme();
  const unreadNotifications = useAppStore(s => s.unreadNotifications);
  const features = useConfigStore(s => s.config.features);

  const baseTabBarStyle = {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.border,
    borderTopWidth: 0,
    height: TAB_HEIGHT,
    paddingBottom: Platform.OS === 'ios' ? scale(4) : scale(8),
    paddingTop: scale(6),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  };

  const hiddenStyle = {display: 'none' as const};

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: baseTabBarStyle,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={({route}) => ({
          tabBarIcon: ({color, focused}) => (
            <TabIcon
              name="home"
              color={color}
              focused={focused}
              label="Home"
              primaryColor={colors.primary}
            />
          ),
          tabBarStyle: shouldHideTabBar(route, 'HomeTab')
            ? hiddenStyle
            : baseTabBarStyle,
        })}
      />
      {features.rooms && (
        <Tab.Screen
          name="RoomsTab"
          component={RoomStack}
          options={({route}) => ({
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                name="grid"
                color={color}
                focused={focused}
                label="Rooms"
                primaryColor={colors.primary}
              />
            ),
            tabBarStyle: shouldHideTabBar(route, 'RoomsTab')
              ? hiddenStyle
              : baseTabBarStyle,
          })}
        />
      )}
      {features.rooms && (
        <Tab.Screen
          name="CreateRoomTab"
          component={Noop}
          options={{
            tabBarShowLabel: false,
            tabBarIcon: () => (
              <View style={[styles.fab, {backgroundColor: colors.primary}]}>
                <FeatherIcon name="plus" color="#FFF" size={scale(24)} />
              </View>
            ),
          }}
          listeners={({navigation}) => ({
            tabPress: e => {
              e.preventDefault();
              navigation.navigate('HomeTab', {screen: 'CreateRoom'});
            },
          })}
        />
      )}
      {features.friends && (
        <Tab.Screen
          name="FriendsTab"
          component={FriendsStack}
          options={({route}) => ({
            tabBarIcon: ({color, focused}) => (
              <TabIcon
                name="users"
                color={color}
                focused={focused}
                label="Friends"
                badge={unreadNotifications}
                primaryColor={colors.primary}
              />
            ),
            tabBarStyle: shouldHideTabBar(route, 'FriendsTab')
              ? hiddenStyle
              : baseTabBarStyle,
          })}
        />
      )}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={({route}) => ({
          tabBarIcon: ({color, focused}) => (
            <TabIcon
              name="user"
              color={color}
              focused={focused}
              label="Profile"
              primaryColor={colors.primary}
            />
          ),
          tabBarStyle: shouldHideTabBar(route, 'ProfileTab')
            ? hiddenStyle
            : baseTabBarStyle,
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(56),
    paddingTop: scale(2),
  },
  activeIndicator: {
    position: 'absolute',
    top: -scale(6),
    width: scale(24),
    height: scale(3),
    borderRadius: scale(2),
  },
  iconWrapper: {
    position: 'relative',
  },
  tabLabel: {
    fontSize: scale(10),
    marginTop: scale(4),
    letterSpacing: 0.2,
  },
  fab: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: scale(16),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: -scale(4),
    right: -scale(8),
    backgroundColor: '#D32F2F',
    borderRadius: scale(8),
    minWidth: scale(16),
    height: scale(16),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: scale(4),
  },
  badgeText: {
    color: '#FFF',
    fontSize: scale(9),
    fontWeight: '700',
  },
});
