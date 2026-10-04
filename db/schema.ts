import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const catalogue=sqliteTable('catalogue',{id:text('id').primaryKey(),data:text('data_json').notNull(),published:integer('published').notNull().default(0),updatedAt:text('updated_at').notNull(),updatedBy:text('updated_by').notNull()});
export const imageAssets=sqliteTable('image_assets',{id:text('id').primaryKey(),storageKey:text('storage_key').notNull(),filename:text('filename').notNull(),contentType:text('content_type').notNull(),size:integer('size').notNull(),uploadedAt:text('uploaded_at').notNull(),uploadedBy:text('uploaded_by').notNull(),hash:text('content_hash').unique(),variants:text('variants_json').notNull().default('{}')});

export const adminAuth=sqliteTable('admin_auth',{id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),secret:text('secret').notNull(),enabled:integer('enabled').notNull().default(0),pendingUntil:integer('pending_until').notNull(),lastCounter:integer('last_counter').notNull().default(-1),attempts:integer('attempts').notNull().default(0),attemptUntil:integer('attempt_until').notNull().default(0)});
export const adminSessions=sqliteTable('admin_sessions',{tokenHash:text('token_hash').primaryKey(),ownerId:text('owner_id').notNull(),expiresAt:integer('expires_at').notNull()});

export const speechTokenLimits=sqliteTable('speech_token_limits',{ownerId:text('owner_id').primaryKey(),window:integer('window').notNull(),count:integer('count').notNull()});

export const storeRecords=sqliteTable('store_records',{id:text('id').primaryKey(),domain:text('domain').notNull(),data:text('data_json').notNull(),status:text('status').notNull(),revision:integer('revision').notNull(),updatedAt:text('updated_at').notNull(),updatedBy:text('updated_by').notNull()});
export const storeRevisions=sqliteTable('store_revisions',{id:text('id').primaryKey(),recordId:text('record_id').notNull(),revision:integer('revision').notNull(),data:text('data_json').notNull(),updatedAt:text('updated_at').notNull(),updatedBy:text('updated_by').notNull()});
export const storeReleases=sqliteTable('store_releases',{id:text('id').primaryKey(),parent:text('parent_id'),data:text('data_json').notNull(),hash:text('content_hash').notNull(),createdAt:text('created_at').notNull(),createdBy:text('created_by').notNull(),reason:text('reason').notNull()});
export const storeHead=sqliteTable('store_head',{id:text('id').primaryKey(),releaseId:text('release_id').notNull()});
