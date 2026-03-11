import type {Innings} from '../models';

export interface BattingStatEntry {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: string;
}

export interface BowlingStatEntry {
  id: string;
  name: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
}

export interface FallOfWicket {
  score: number;
  wicketNumber: number;
  batsmanName: string;
  overNumber: number;
}

export function getBattingStats(
  inn: Innings,
  getPlayerName: (id: string) => string,
): BattingStatEntry[] {
  const stats: Record<
    string,
    {runs: number; balls: number; fours: number; sixes: number; out: string}
  > = {};

  for (const over of inn.overs) {
    for (const ball of over.balls) {
      if (!stats[ball.batsmanId]) {
        stats[ball.batsmanId] = {runs: 0, balls: 0, fours: 0, sixes: 0, out: ''};
      }
      const s = stats[ball.batsmanId];
      s.runs += ball.runs;
      if (ball.isLegal) s.balls++;
      if (ball.runs === 4) s.fours++;
      if (ball.runs === 6) s.sixes++;
      if (ball.wicket?.type) {
        s.out = ball.wicket.type;
      }
    }
  }

  return Object.entries(stats).map(([id, s]) => ({
    id,
    name: getPlayerName(id),
    ...s,
  }));
}

export function getBowlingStats(
  inn: Innings,
  getPlayerName: (id: string) => string,
): BowlingStatEntry[] {
  const stats: Record<
    string,
    {overs: number; maidens: number; runs: number; wickets: number; balls: number}
  > = {};

  for (const over of inn.overs) {
    const bowlerId = over.bowlerId;
    if (!stats[bowlerId]) {
      stats[bowlerId] = {overs: 0, maidens: 0, runs: 0, wickets: 0, balls: 0};
    }
    const s = stats[bowlerId];
    if (over.isComplete) s.overs++;
    s.runs += over.runs;
    s.wickets += over.wickets;
    const legalBalls = over.balls.filter(b => b.isLegal).length;
    s.balls += legalBalls;
    if (over.isComplete && over.runs === 0) s.maidens++;
  }

  return Object.entries(stats).map(([id, s]) => ({
    id,
    name: getPlayerName(id),
    overs: s.overs + (s.balls % 6 > 0 ? (s.balls % 6) / 10 : 0),
    maidens: s.maidens,
    runs: s.runs,
    wickets: s.wickets,
  }));
}

export function getFallOfWickets(
  inn: Innings,
  getPlayerName: (id: string) => string,
): FallOfWicket[] {
  const fow: FallOfWicket[] = [];
  let runningScore = 0;
  let wicketCount = 0;

  for (const over of inn.overs) {
    for (const ball of over.balls) {
      runningScore += ball.runs + (ball.extras?.runs || 0);
      if (ball.wicket?.type) {
        wicketCount++;
        fow.push({
          score: runningScore,
          wicketNumber: wicketCount,
          batsmanName: getPlayerName(ball.batsmanId),
          overNumber: over.overNumber,
        });
      }
    }
  }

  return fow;
}

export interface OverSummary {
  overNumber: number;
  bowlerName: string;
  runs: number;
  wickets: number;
  balls: string[];
}

export function getOverSummaries(
  inn: Innings,
  getPlayerName: (id: string) => string,
): OverSummary[] {
  return inn.overs.map(over => {
    const balls = over.balls.map(ball => {
      if (ball.wicket?.type) return 'W';
      if (ball.extras?.type === 'wide') return `${ball.extras.runs}wd`;
      if (ball.extras?.type === 'noball') return `${ball.runs}nb`;
      if (ball.extras?.type === 'bye' || ball.extras?.type === 'legbye')
        return `${ball.extras.runs}b`;
      if (ball.runs === 0) return '\u00B7';
      return String(ball.runs);
    });

    return {
      overNumber: over.overNumber + 1,
      bowlerName: getPlayerName(over.bowlerId),
      runs: over.runs,
      wickets: over.wickets,
      balls,
    };
  });
}

export interface PartnershipEntry {
  batter1Name: string;
  batter2Name: string;
  runs: number;
  balls: number;
  wicketNumber: number;
}

export function getPartnerships(
  inn: Innings,
  getPlayerName: (id: string) => string,
): PartnershipEntry[] {
  const partnerships: PartnershipEntry[] = [];
  let runs = 0;
  let balls = 0;
  let currentBatsmen = new Set<string>();
  let wicketNum = 0;

  for (const over of inn.overs) {
    for (const ball of over.balls) {
      currentBatsmen.add(ball.batsmanId);
      runs += ball.runs + (ball.extras?.runs || 0);
      if (ball.isLegal) balls++;

      if (ball.wicket?.type) {
        wicketNum++;
        const batters = Array.from(currentBatsmen);
        partnerships.push({
          batter1Name: getPlayerName(batters[0] || ''),
          batter2Name: getPlayerName(batters[1] || batters[0] || ''),
          runs,
          balls,
          wicketNumber: wicketNum,
        });
        runs = 0;
        balls = 0;
        currentBatsmen.delete(ball.batsmanId);
      }
    }
  }

  // Current unbroken partnership
  if (runs > 0 || balls > 0) {
    const batters = Array.from(currentBatsmen);
    partnerships.push({
      batter1Name: getPlayerName(batters[0] || ''),
      batter2Name: getPlayerName(batters[1] || batters[0] || ''),
      runs,
      balls,
      wicketNumber: wicketNum + 1,
    });
  }

  return partnerships;
}
