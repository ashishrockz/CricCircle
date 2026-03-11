import type {Adapter} from './base.adapter';
import type {
  Match,
  Innings,
  Over,
  Ball,
  CommentaryEntry,
  MatchTeam,
  MatchResult,
  InningsExtras,
} from '../models';

const adaptBall = (data: any): Ball => ({
  ballNumber: data.ballNumber || 0,
  batsmanId: data.batsmanId,
  bowlerId: data.bowlerId,
  runs: data.runs || 0,
  extras: data.extras?.type
    ? {type: data.extras.type, runs: data.extras.runs || 0}
    : undefined,
  wicket: data.wicket?.type
    ? {type: data.wicket.type, fielderId: data.wicket.fielderId}
    : undefined,
  isLegal: data.isLegal ?? true,
});

const adaptOver = (data: any): Over => ({
  overNumber: data.overNumber || 0,
  bowlerId: data.bowlerId,
  balls: (data.balls || []).map(adaptBall),
  runs: data.runs || 0,
  wickets: data.wickets || 0,
  isComplete: data.isComplete ?? false,
});

const adaptExtras = (data: any): InningsExtras => ({
  wide: data?.wide || 0,
  noball: data?.noball || 0,
  bye: data?.bye || 0,
  legbye: data?.legbye || 0,
});

const adaptInnings = (data: any): Innings => ({
  number: data.number || 1,
  battingTeam: data.battingTeam || 'A',
  bowlingTeam: data.bowlingTeam || 'B',
  overs: (data.overs || []).map(adaptOver),
  totalRuns: data.totalRuns || 0,
  totalWickets: data.totalWickets || 0,
  completedOvers: data.completedOvers || 0,
  extras: adaptExtras(data.extras),
  currentBatsmen: {
    striker: data.currentBatsmen?.striker,
    nonStriker: data.currentBatsmen?.nonStriker,
  },
  currentBowler: data.currentBowler,
  status: data.status || 'active',
});

const adaptTeam = (data: any): MatchTeam => ({
  name: data?.name || '',
  players: data?.players || [],
  captain: data?.captain,
});

const adaptResult = (data: any): MatchResult => ({
  winner: data?.winner || null,
  margin: data?.margin,
  description: data?.description,
  completedAt: data?.completedAt ? new Date(data.completedAt) : undefined,
});

const adaptCommentary = (data: any): CommentaryEntry => ({
  text: data.text || '',
  type: data.type || 'ball',
  inningsNumber: data.inningsNumber,
  overNumber: data.overNumber,
  ballNumber: data.ballNumber,
  timestamp: new Date(data.timestamp),
});

export const matchAdapter: Adapter<Match> = {
  adapt(data: any): Match {
    return {
      id: data._id || data.id,
      roomId: data.roomId?._id || data.roomId,
      sportTypeId:
        typeof data.sportTypeId === 'object'
          ? data.sportTypeId._id
          : data.sportTypeId,
      sport: data.sport || 'cricket',
      teamA: adaptTeam(data.teamA),
      teamB: adaptTeam(data.teamB),
      toss: {
        winnerTeam: data.toss?.winnerTeam || null,
        choice: data.toss?.choice || '',
      },
      innings: (data.innings || []).map(adaptInnings),
      currentInnings: data.currentInnings || 1,
      commentary: (data.commentary || []).map(adaptCommentary),
      status: data.status || 'not_started',
      config: data.config || {},
      result: adaptResult(data.result),
      createdAt: new Date(data.createdAt),
    };
  },
};
