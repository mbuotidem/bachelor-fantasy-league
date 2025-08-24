// Export all services and their types
export { BaseService, APIError, ValidationError, NotFoundError, UnauthorizedError } from './base-service';
export { LeagueService } from './league-service';
export { TeamService } from './team-service';
export { ContestantService } from './contestant-service';
export { ScoringService } from './scoring-service';
export { DraftService } from './draft-service';
export { StandingsService } from './standings-service';
export { UserService } from './user-service';
export { UserMigrationService } from './user-migration-service';

// Export service input/output types
export type { JoinLeagueInput, UpdateLeagueSettingsInput } from './league-service';
export type { UpdateTeamInput, AddContestantToTeamInput } from './team-service';
export type { UpdateContestantInput, EliminateContestantInput } from './contestant-service';
export type { UndoScoringInput, GetEpisodeScoresInput } from './scoring-service';
export type { CreateDraftInput, MakePickInput, DraftUpdate } from './draft-service';
export type { CreateUserInput, UpdateUserInput } from './user-service';

// Import service classes
import { LeagueService } from './league-service';
import { TeamService } from './team-service';
import { ContestantService } from './contestant-service';
import { ScoringService } from './scoring-service';
import { DraftService } from './draft-service';
import { StandingsService } from './standings-service';
import { UserService } from './user-service';
import { UserMigrationService } from './user-migration-service';

// Create service instances for easy import
export const leagueService = new LeagueService();
export const teamService = new TeamService();
export const contestantService = new ContestantService();
export const scoringService = new ScoringService();
export const draftService = new DraftService();
export const standingsService = new StandingsService();
export const userService = new UserService();
export const userMigrationService = new UserMigrationService();