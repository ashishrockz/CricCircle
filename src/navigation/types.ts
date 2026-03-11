import type {NavigatorScreenParams} from '@react-navigation/native';
import type {User} from '../models';

export type AuthStackParams = {
  Splash: undefined;
  Login: undefined;
  OtpVerify: {identifier: string; method: 'phone' | 'email'};
  ProfileSetup: {token: string; user: User};
};

export type HomeStackParams = {
  Home: undefined;
  CreateRoom: undefined;
};

export type RoomStackParams = {
  RoomList: undefined;
  RoomDetail: {roomId: string};
  Toss: {roomId: string};
  CricketScoring: {matchId: string; roomId: string};
  MatchDetail: {matchId: string};
  Commentary: {matchId: string};
  CricbuzzScorecard: {matchId: string; roomId: string};
};

export type FriendsStackParams = {
  FriendsList: undefined;
  UserSearch: undefined;
  UserProfile: {userId: string};
};

export type ProfileStackParams = {
  ProfileMain: undefined;
  EditProfile: undefined;
  Leaderboard: undefined;
};

export type MainTabParams = {
  HomeTab: NavigatorScreenParams<HomeStackParams>;
  RoomsTab: NavigatorScreenParams<RoomStackParams>;
  CreateRoomTab: undefined;
  FriendsTab: NavigatorScreenParams<FriendsStackParams>;
  ProfileTab: NavigatorScreenParams<ProfileStackParams>;
};

export type RootStackParams = {
  Auth: NavigatorScreenParams<AuthStackParams>;
  Main: NavigatorScreenParams<MainTabParams>;
};
