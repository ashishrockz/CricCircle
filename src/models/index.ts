// ── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  friendsCount: number;
  role: 'user' | 'admin' | 'superadmin';
  status: 'active' | 'inactive' | 'banned';
  createdAt: Date;
  updatedAt: Date;
}

// ── Sport Type ──────────────────────────────────────────────────────────────

export interface CricketRole {
  name: string;
  perTeam: number;
  required: boolean;
}

export interface SportConfig {
  minPlayers: number;
  maxPlayers: number;
  teamSize: number;
  innings: number;
  oversPerInnings: number;
  tossOptions: string[];
  roles: CricketRole[];
}

export interface SportType {
  id: string;
  name: string;
  slug: string;
  sport: string;
  description?: string;
  config: SportConfig;
  isActive: boolean;
  createdAt: Date;
}

// ── Sport Profile ───────────────────────────────────────────────────────────

export interface BattingStats {
  runs: number;
  innings: number;
  highScore: number;
  fifties: number;
  hundreds: number;
  doubleHundreds: number;
  fours: number;
  sixes: number;
  notOuts: number;
  average: number;
  strikeRate: number;
}

export interface BowlingStats {
  wickets: number;
  runsConceded: number;
  oversBowled: number;
  bestBowling: string;
  economy: number;
  maidens: number;
  fiveWicketHauls: number;
  hatTricks: number;
}

export interface SportProfile {
  id: string;
  userId: string;
  sport: string;
  local: {
    matchesPlayed: number;
    battingStats: BattingStats;
    bowlingStats: BowlingStats;
  };
  tournament: {
    matchesPlayed: number;
    battingStats: BattingStats;
    bowlingStats: BowlingStats;
  };
  createdAt: Date;
}

// ── Room ────────────────────────────────────────────────────────────────────

export interface PlayerSlot {
  id: string;
  userId?: string;
  name: string;
  isStatic: boolean;
  team: 'A' | 'B' | null;
  role: string;
  isActive: boolean;
}

export interface TossResult {
  initiatedBy: string;
  coinResult: 'heads' | 'tails';
  call: 'heads' | 'tails';
  callerTeam: 'A' | 'B';
  winnerTeam: 'A' | 'B';
  choice: string | null;
  completedAt: Date | null;
}

export type RoomStatus = 'waiting' | 'toss_pending' | 'active' | 'completed' | 'abandoned';

export interface Room {
  id: string;
  sportTypeId: string;
  name: string;
  creator: string | User;
  status: RoomStatus;
  matchType: 'local' | 'tournament';
  players: PlayerSlot[];
  toss: TossResult | null;
  matchId?: string;
  maxPlayers: number;
  minPlayers: number;
  teamAName: string;
  teamBName: string;
  oversPerInnings: number | null;
  captainA: string | null;
  captainB: string | null;
  createdAt: Date;
}

// ── Match ───────────────────────────────────────────────────────────────────

export interface Extras {
  type: 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';
  runs: number;
}

export interface Wicket {
  type: 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket' | 'obstructed';
  fielderId?: string;
}

export interface Ball {
  ballNumber: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  extras?: Extras;
  wicket?: Wicket;
  isLegal: boolean;
}

export interface Over {
  overNumber: number;
  bowlerId: string;
  balls: Ball[];
  runs: number;
  wickets: number;
  isComplete: boolean;
}

export interface InningsExtras {
  wide: number;
  noball: number;
  bye: number;
  legbye: number;
}

export type InningsStatus = 'active' | 'completed';

export interface Innings {
  number: number;
  battingTeam: 'A' | 'B';
  bowlingTeam: 'A' | 'B';
  overs: Over[];
  totalRuns: number;
  totalWickets: number;
  completedOvers: number;
  extras: InningsExtras;
  currentBatsmen: {
    striker?: string;
    nonStriker?: string;
  };
  currentBowler?: string;
  status: InningsStatus;
}

export interface MatchTeam {
  name: string;
  players: string[];
  captain?: string;
}

export interface MatchResult {
  winner: 'A' | 'B' | 'draw' | 'no_result' | null;
  margin?: string;
  description?: string;
  completedAt?: Date;
}

export interface CommentaryEntry {
  text: string;
  type: string;
  inningsNumber?: number;
  overNumber?: number;
  ballNumber?: number;
  timestamp: Date;
}

export type MatchStatus =
  | 'not_started'
  | 'active'
  | 'innings_break'
  | 'set_break'
  | 'completed'
  | 'abandoned';

export interface Match {
  id: string;
  roomId: string;
  sportTypeId: string;
  sport: string;
  teamA: MatchTeam;
  teamB: MatchTeam;
  toss: {
    winnerTeam: 'A' | 'B' | null;
    choice: string;
  };
  innings: Innings[];
  currentInnings: number;
  commentary: CommentaryEntry[];
  status: MatchStatus;
  config: SportConfig;
  result: MatchResult;
  createdAt: Date;
}

// ── Friends ─────────────────────────────────────────────────────────────────

export interface Friend {
  id: string;
  user: User;
  since: Date;
}

export interface FriendRequest {
  id: string;
  from: User;
  to: User;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface FriendStats {
  total: number;
  incoming: number;
  outgoing: number;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'blocked';

// ── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatar?: string;
  value: number;
  extra?: Record<string, number | string>;
}

// ── Highlights ──────────────────────────────────────────────────────────────

export interface HighlightItem {
  type: string;
  title: string;
  description: string;
  value?: string | number;
}

export interface MatchHighlights {
  matchId: string;
  sport: string;
  highlights: HighlightItem[];
}

// ── API Request/Response ────────────────────────────────────────────────────

export interface RecordBallPayload {
  batsmanId: string;
  bowlerId: string;
  runs: number;
  isLegal: boolean;
  extras?: Extras;
  wicket?: Wicket;
}

export interface SetLineupPayload {
  inningsNum?: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
}

export interface TossPayload {
  call: 'heads' | 'tails';
  callerTeam: 'A' | 'B';
}

export interface TossChoicePayload {
  choice: string;
}

export interface CreateRoomPayload {
  name: string;
  sportTypeId: string;
  teamAName?: string;
  teamBName?: string;
  oversPerInnings?: number;
  matchType?: 'local' | 'tournament';
}

export interface AddFriendPlayerPayload {
  friendUserId: string;
  playerName: string;
  team: 'A' | 'B';
}

export interface AddStaticPlayerPayload {
  name: string;
  team: 'A' | 'B';
}

export interface SwitchPlayerTeamPayload {
  team: 'A' | 'B';
}

export interface SetPlayerRolePayload {
  role: string;
}
