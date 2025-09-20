// Root response
export interface TeamResponse {
  data: {
    head_infos: HeadInfos;
    balancesheet: BalanceSheet[];
  };
  season: string;
  season_filter: string;
  association: string;
  groupname: string;
  urlid: string;
  teamid: string;
  teamname: string;
  tableData: TableData;
  tableError: string | null;
}

// ----- Shared info -----
export interface HeadInfos {
  region: string;
  season: string;
  club_name: string;
  team_name: string;
  league_name: string;
  club_image_url: string | null;
  team_table_rank: number;
  team_matches_won: number;
  team_matches_lost: number;
  organization_short: string;
}

// ----- Balance sheet -----
export interface BalanceSheet {
  club_id: string;
  team_id: string;
  group_id: string;
  club_name: string;
  team_name: string;
  league_name: string;
  team_total_points_won: number;
  team_double_points_won: number;
  team_single_points_won: number;
  team_total_points_lost: number;
  team_double_points_lost: number;
  team_single_points_lost: number;
  double_player_statistics: DoublePlayerStat[];
  single_player_statistics: SinglePlayerStat[];
}

export interface DoublePlayerStat {
  points_won: string; // could be number, but API gives string
  points_lost: string;
  meeting_count: string;
  id_player_1: string;
  id_player_2: string;
  firstname_player_1: string;
  lastname_player_1: string;
  firstname_player_2: string;
  lastname_player_2: string;
}

export interface SinglePlayerStat {
  player_id: string;
  player_rank: string;
  team_number: string;
  meeting_count: string;
  player_lastname: string;
  player_firstname: string;
  points_won: string;
  points_lost: string;
  single_statistics: SingleMatchStat[];
}

export interface SingleMatchStat {
  points_won: string;
  points_lost: string;
  opponent_rank: string;
}

// ----- Table data -----
export interface TableData {
  table: TableEntry[];
  head_infos: HeadInfos;
  no_meetings: boolean;
  meetings_excerpt: MeetingsExcerpt;
  pdf_version_url: string;
  pdf_materials_url: string | null;
}

export interface TableEntry {
  club_id: string;
  team_id: string;
  team_name: string;
  table_rank: number;
  tendency: string;
  points_won: number;
  points_lost: number;
  matches_won: number;
  matches_lost: number;
  matches_relation: string;
  meetings_tie: number;
  meetings_won: number;
  meetings_lost: number;
  meetings_count: number;
  sets_won: number;
  sets_lost: number;
  sets_relation: string;
  games_won: number;
  games_lost: number;
  games_relation: string;
  rise_fall_state: string | null;
}

export interface MeetingsExcerpt {
  remarks: string;
  meetings: MeetingDate[];
}

export interface MeetingDate {
  [date: string]: Meeting[];
}

export interface Meeting {
  date: string; // ISO timestamp
  live: boolean;
  state: "done" | "scheduled";
  pdf_url: string;
  league_id: string;
  league_name: string;
  league_short_name: string;
  league_org_short_name: string;
  round_name: string | null;
  round_type: string;
  hall_number: string;
  matches_won: string;
  matches_lost: string;
  team_home: string;
  team_home_id: string;
  team_home_club_id: string;
  team_away: string;
  team_away_id: string;
  team_away_club_id: string;
  meeting_id: string;
  original_date: string | null;
  // Flags
  is_letter_h: boolean;
  is_letter_t: boolean;
  is_letter_u: boolean;
  is_letter_v: boolean;
  is_letter_w: boolean;
  is_letter_z: boolean;
  is_letter_na: boolean;
  is_letter_w2: boolean;
  // Optional extra info fields
  letter_h_info: string | null;
  letter_w_info: string | null;
  letter_z_info: string | null;
  letter_na_info: string | null;
  nu_score_live_enabled: boolean;
}
