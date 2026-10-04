CREATE TABLE `store_head` (
	`id` text PRIMARY KEY NOT NULL,
	`release_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_records` (
	`id` text PRIMARY KEY NOT NULL,
	`domain` text NOT NULL,
	`data_json` text NOT NULL,
	`status` text NOT NULL,
	`revision` integer NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_releases` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`data_json` text NOT NULL,
	`content_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`reason` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`revision` integer NOT NULL,
	`data_json` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `image_assets` ADD `content_hash` text;--> statement-breakpoint
ALTER TABLE `image_assets` ADD `variants_json` text DEFAULT '{}' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `image_assets_content_hash_unique` ON `image_assets` (`content_hash`);