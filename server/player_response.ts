export interface PlayerDataResponse {
  data: {
    player_infos: {
      ttr: number;
      qttr: number;
      clubnr: string;
      user_id: string;
      lastname: string;
      club_name: string;
      firstname: string;
      organization_short: string;
    };
    team_results: {
      season: string;
      team_id: string;
      group_id: string;
      group_name: string;
      wins_firstround: number;
      wins_secondround: number;
      losses_firstround: number;
      losses_secondround: number;
      organization_short: string;
      match_statistics_total: {
        team_nr: string;
        player_rank: number;
        match_results: any[]; // can be typed further if match structure is known
        total_matches: number;
        total_set_result: string;
        total_match_result: string;
      };
      match_statistics_firstround: any[]; // can be typed further
      match_statistics_secondround: any[]; // can be typed further
    }[];
    accumulated_results: {
      matches_won: number;
      matches_lost: number;
      total_matches: number;
    };
  };
  filters: {
    seasons: {
      season: string;
      season_readable: string;
    }[];
    match_types: {
      match_type: string;
      match_type_readable: string;
    }[];
  };
  association: string;
  season: string;
  mtype: string;
  externalUserId: string;
  playerId: string;
  currentUserProfile: null | any;
  id: string;
  envMode: string;
};