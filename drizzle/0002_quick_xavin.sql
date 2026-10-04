CREATE TABLE `speech_token_limits` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
