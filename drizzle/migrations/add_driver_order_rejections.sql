-- Migration to add driver_order_rejections table
-- This table tracks which orders each driver has rejected to prevent showing them again

CREATE TABLE `driver_order_rejections` (
	`id` varchar(255) NOT NULL,
	`driver_id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`rejected_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	`reason` text,
	`created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
	CONSTRAINT `driver_order_rejections_id` PRIMARY KEY(`id`),
	-- Add unique constraint to prevent duplicate rejections
	CONSTRAINT `driver_order_unique_rejection` UNIQUE(`driver_id`, `order_id`)
);

-- Add indexes for better query performance
CREATE INDEX `idx_driver_order_rejections_driver_id` ON `driver_order_rejections`(`driver_id`);
CREATE INDEX `idx_driver_order_rejections_order_id` ON `driver_order_rejections`(`order_id`);
CREATE INDEX `idx_driver_order_rejections_created_at` ON `driver_order_rejections`(`created_at`);