export interface PoolSummaryResponse {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  memberCount: number;
}

export interface WorkspaceItem {
  id: string | null; // null represents the unique personal prediction workspace
  name: string;
  type: 'personal' | 'group';
  memberCount?: number;
  inviteCode?: string;
}

export interface PoolDetailsResponse {
  poolId: string;
  poolName: string;
  leaderBoard: MemberPredictionDTO[];
}

export interface MemberPredictionDTO {
  userId: string;
  username: string;
  picture: string;
  predictedTeamNames: string[];
}