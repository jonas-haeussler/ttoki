
export enum Venue {Home,  Abroad};
export enum Option {Yes = 'ja', No = 'nein', Maybe = 'vielleicht', Dunno = '?'};

export interface GoogleConfig {
  readonly spreadSheetId:string,
  readonly ranges:{
    readonly meta:string,
    readonly players:string,
    readonly dates:string,
    readonly gamesFirstTeam:string,
    readonly gamesSecondTeam:string,
    readonly entries:string
  }
}

export interface Tables {
  readonly playingPlanDesktop: string[][],
  readonly gamestatsTable: string[][]
}

export interface TeamConfig {
  readonly league:string,
  readonly groupId:string,
  readonly teamId:string,
  readonly teamName:string,
  enemies?:{enemyId:string, enemyName:string}[]
}
export interface Config {
  readonly saison:string,
  readonly round:string,
  readonly vereinId:string,
  readonly teams:TeamConfig[]
}

export interface Game {
  readonly time:string,
  readonly enemy:string,
  readonly venue:Venue
}
export interface Player {
  readonly team:1 | 2 | 3 | 4 | 5 | 6 | 7,
  readonly position:number,
  readonly name:string,
  readonly actions:number,
  readonly wins:number,
  readonly loses:number,
  readonly ttr:number,
  readonly qttr:number
}

export interface Team {
  readonly name:string,
  readonly members:Player[]
}

export interface TTDates {
  readonly ttDates:TTDate[],
  readonly allPlayers:string[]
}

export interface TTDate {
  readonly id:string,
  readonly date:string,
  readonly activePlayers:string[],
  readonly availablePlayers:string[],
  readonly firstTeam:Game,
  readonly secondTeam:Game,
  option:Option,

  }
