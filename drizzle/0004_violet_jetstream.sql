CREATE TABLE `image_blobs` (
	`key` text PRIMARY KEY NOT NULL,
	`bytes` blob NOT NULL,
	`content_type` text NOT NULL,
	`hash` text NOT NULL,
	`size` integer NOT NULL
);
