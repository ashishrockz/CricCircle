export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatOvers = (
  completedOvers: number,
  ballsInCurrentOver?: number,
): string => {
  if (ballsInCurrentOver !== undefined && ballsInCurrentOver > 0) {
    return `${completedOvers}.${ballsInCurrentOver}`;
  }
  return `${completedOvers}.0`;
};

export const formatScore = (runs: number, wickets: number): string =>
  `${runs}/${wickets}`;

export const formatRunRate = (runs: number, overs: number): string => {
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
};

export const formatStrikeRate = (runs: number, balls: number): string => {
  if (balls === 0) return '0.00';
  return ((runs / balls) * 100).toFixed(1);
};

export const formatEconomy = (runs: number, overs: number): string => {
  if (overs === 0) return '0.00';
  return (runs / overs).toFixed(2);
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getResultText = (
  result: {winner?: string | null; margin?: string; description?: string} | undefined,
  teamAName: string,
  teamBName: string,
): string | null => {
  if (!result) return null;
  if (result.description) return result.description;
  if (!result.winner) return null;
  if (result.winner === 'draw') return 'Match Drawn';
  if (result.winner === 'no_result') return 'No Result';
  const winnerName = result.winner === 'A' ? teamAName : teamBName;
  return result.margin
    ? `${winnerName} won by ${result.margin}`
    : `${winnerName} won`;
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
};
