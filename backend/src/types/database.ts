/**
 * Database row types for PostgreSQL queries
 */

export interface UserRow {
  id: string;
  username: string;
  email?: string;
  passwordhash: string;
  displayname?: string;
  createdat: string;
  updatedat: string;
}

export interface PromptRow {
  id: string;
  title: string;
  description?: string;
  content: string;
  category?: string;
  author?: string;
  ispublic: boolean;
  views: number;
  likes: number;
  createdat: string;
  updatedat: string;
  deletedat?: string;
  metadata?: string | Record<string, any>;
}

export interface TagRow {
  id: string;
  name: string;
  count: number;
}

export interface PermissionRow {
  id: string;
  promptid: string;
  userid: string;
  role: string;
  grantedby?: string;
  grantedat: string;
  revokedat?: string;
}

export interface CommentRow {
  id: string;
  promptid: string;
  userid?: string;
  content: string;
  parentid?: string;
  createdat: string;
  updatedat: string;
  deletedat?: string;
}

export interface RatingRow {
  id: string;
  promptid: string;
  userid?: string;
  overall?: number;
  helpfulness?: number;
  accuracy?: number;
  relevance?: number;
  createdat: string;
  updatedat: string;
}

export interface ApiTokenRow {
  id: string;
  userid: string;
  name: string;
  token: string;
  createdat: string;
  lastused?: string;
  expiresat?: string;
}

export interface EvalLogRow {
  id: string;
  promptid?: string;
  modelid: string;
  variables?: string;
  content: string;
  output: string;
  score?: number;
  latency?: number;
  tokens?: number;
  createdat: string;
}
