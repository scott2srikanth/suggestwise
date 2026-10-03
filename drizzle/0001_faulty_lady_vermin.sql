CREATE TABLE `admin_auth` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`secret` text NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`pending_until` integer NOT NULL,
	`last_counter` integer DEFAULT -1 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`attempt_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `admin_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
