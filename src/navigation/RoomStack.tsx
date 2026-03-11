import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {RoomStackParams} from './types';
import RoomListScreen from '../screens/room/RoomListScreen';
import RoomDetailScreen from '../screens/room/RoomDetailScreen';
import TossScreen from '../screens/room/TossScreen';
import CricketScoringScreen from '../screens/match/CricketScoringScreen';
import MatchDetailScreen from '../screens/match/MatchDetailScreen';
import CommentaryScreen from '../screens/match/CommentaryScreen';
import CricbuzzScorecardScreen from '../screens/match/CricbuzzScorecardScreen';

const Stack = createNativeStackNavigator<RoomStackParams>();

export default function RoomStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="RoomList" component={RoomListScreen} />
      <Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
      <Stack.Screen name="Toss" component={TossScreen} />
      <Stack.Screen name="CricketScoring" component={CricketScoringScreen} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
      <Stack.Screen name="Commentary" component={CommentaryScreen} />
      <Stack.Screen name="CricbuzzScorecard" component={CricbuzzScorecardScreen} />
    </Stack.Navigator>
  );
}
