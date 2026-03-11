import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {FriendsStackParams} from './types';
import FriendsScreen from '../screens/friends/FriendsScreen';
import UserSearchScreen from '../screens/friends/UserSearchScreen';
import UserProfileScreen from '../screens/friends/UserProfileScreen';

const Stack = createNativeStackNavigator<FriendsStackParams>();

export default function FriendsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="FriendsList" component={FriendsScreen} />
      <Stack.Screen name="UserSearch" component={UserSearchScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
    </Stack.Navigator>
  );
}
