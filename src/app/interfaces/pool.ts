export interface PoolSummaryResponse {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  memberCount: number;
}

export interface WorkspaceItem {
  id: string | null;
  name: string;
  type: 'personal' | 'group';
  memberCount?: number;
  inviteCode?: string;
  creatorId?: string;
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