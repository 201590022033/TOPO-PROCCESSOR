CREATE TABLE IF NOT EXISTS `analysis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`image_url` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`start_angle` integer DEFAULT 0 NOT NULL,
	`end_angle` integer DEFAULT 360 NOT NULL,
	`n_mires` integer DEFAULT 22 NOT NULL,
	`working_distance` integer DEFAULT 75 NOT NULL,
	`zernike_degree` integer DEFAULT 8 NOT NULL,
	`mire_seg_method` text DEFAULT 'dl' NOT NULL,
	`results` text,
	`output_files` text,
	`error_message` text,
	`created_at` integer
);
