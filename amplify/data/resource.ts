import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== Bachelor Fantasy League Schema =======================================
This schema defines all the data models for the Bachelor Fantasy League
application including Users, Leagues, Teams, Contestants, and Scoring.
=========================================================================*/
const schema = a.schema({
  // User model
  User: a
    .model({
      email: a.string().required(),
      displayName: a.string().required(),
      preferences: a.json(),

      // Relationships
      commissionedLeagues: a.hasMany('League', 'commissionerId'),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read'])
    ]),

  // League model
  League: a
    .model({
      name: a.string().required(),
      season: a.string().required(),
      leagueCode: a.string().required(),
      commissionerId: a.id().required(),
      settings: a.json(),
      status: a.enum(['created', 'draft_in_progress', 'active', 'completed', 'archived']),

      // Relationships
      commissioner: a.belongsTo('User', 'commissionerId'),
      teams: a.hasMany('Team', 'leagueId'),
      contestants: a.hasMany('Contestant', 'leagueId'),
      episodes: a.hasMany('Episode', 'leagueId'),
      draft: a.hasOne('Draft', 'leagueId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),

  // Team model
  Team: a
    .model({
      leagueId: a.id().required(),
      ownerId: a.id().required(),
      name: a.string().required(),
      draftedContestants: a.string().array(),
      totalPoints: a.integer().default(0),
      episodeScores: a.json(),

      // Relationships
      league: a.belongsTo('League', 'leagueId'),
    })
    .authorization((allow) => [
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read', 'delete'])
    ]),

  // Contestant model
  Contestant: a
    .model({
      leagueId: a.id().required(),
      name: a.string().required(),
      age: a.integer(),
      hometown: a.string(),
      occupation: a.string(),
      bio: a.string(),
      profileImageUrl: a.url(),
      isEliminated: a.boolean().default(false),
      eliminationEpisode: a.integer(),
      totalPoints: a.integer().default(0),
      episodeScores: a.json(),

      // Relationships
      league: a.belongsTo('League', 'leagueId'),
      scoringEvents: a.hasMany('ScoringEvent', 'contestantId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete'])
    ]),

  // Draft model
  Draft: a
    .model({
      leagueId: a.id().required(),
      status: a.enum(['not_started', 'in_progress', 'completed', 'paused']),
      currentPick: a.integer().default(0),
      currentTurnStartedAt: a.datetime(), // Track when current turn started for timer persistence
      draftOrder: a.string().array(),
      picks: a.json(),
      settings: a.json(),

      // Relationships
      league: a.belongsTo('League', 'leagueId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]),

  // Episode model
  Episode: a
    .model({
      leagueId: a.id().required(),
      episodeNumber: a.integer().required(),
      airDate: a.datetime(),
      isActive: a.boolean().default(false),
      totalEvents: a.integer().default(0),

      // Relationships
      league: a.belongsTo('League', 'leagueId'),
      scoringEvents: a.hasMany('ScoringEvent', 'episodeId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]),

  // ScoringEvent model
  ScoringEvent: a
    .model({
      episodeId: a.id().required(),
      contestantId: a.id().required(),
      actionType: a.string().required(),
      points: a.integer().required(),
      description: a.string(),
      scoredBy: a.id().required(),

      // Relationships
      episode: a.belongsTo('Episode', 'episodeId'),
      contestant: a.belongsTo('Contestant', 'contestantId'),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'update', 'delete'])
    ]),

  // Real-time notification model for cross-user notifications
  Notification: a
    .model({
      leagueId: a.id().required(),
      type: a.enum(['draft_started', 'draft_turn', 'draft_pick_made', 'draft_completed', 'draft_deleted', 'scoring_event', 'standings_update', 'league_update', 'episode_started', 'episode_ended']),
      title: a.string().required(),
      message: a.string(),
      data: a.json(),
      targetUserId: a.id(), // Optional - if specified, only for this user
      expiresAt: a.datetime(), // Auto-cleanup old notifications
    })
    .authorization((allow) => [
      allow.authenticated().to(['read', 'create', 'delete'])
    ]),


});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
