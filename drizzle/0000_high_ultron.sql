CREATE TABLE `account` (
	`userId` varchar(255) NOT NULL,
	`type` varchar(255) NOT NULL,
	`provider` varchar(255) NOT NULL,
	`providerAccountId` varchar(255) NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` datetime,
	`token_type` varchar(255),
	`scope` varchar(255),
	`id_token` text,
	`session_state` varchar(255),
	CONSTRAINT `account_provider_providerAccountId_pk` PRIMARY KEY(`provider`,`providerAccountId`)
);
--> statement-breakpoint
CREATE TABLE `addon_groups` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `addon_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `addons` (
	`id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`description` text,
	`image` varchar(500),
	`group_id` varchar(255),
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `addons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_logs` (
	`id` varchar(255) NOT NULL,
	`adminId` varchar(255) NOT NULL,
	`action` varchar(255) NOT NULL,
	`details` text,
	`createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_roles` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`permissions` text NOT NULL,
	`createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_roles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_users` (
	`id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255),
	`roleId` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image` varchar(500),
	`icon` varchar(500),
	`icon_name` varchar(100),
	`is_featured` boolean DEFAULT false,
	`parent_id` varchar(255),
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `driver_assignment_history` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`assignment_id` varchar(255),
	`previous_driver_id` varchar(255),
	`new_driver_id` varchar(255),
	`change_type` varchar(30) NOT NULL,
	`change_reason` text,
	`changed_by` varchar(255) NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `driver_assignment_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `driver_assignments` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`driver_id` varchar(255) NOT NULL,
	`assigned_by` varchar(255) NOT NULL,
	`assigned_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`assignment_type` varchar(20) DEFAULT 'manual',
	`estimated_distance` decimal(8,2),
	`estimated_duration` int,
	`priority` varchar(20) DEFAULT 'normal',
	`delivery_status` varchar(30) DEFAULT 'assigned',
	`picked_up_at` datetime,
	`out_for_delivery_at` datetime,
	`delivered_at` datetime,
	`failed_at` datetime,
	`delivery_notes` text,
	`delivery_proof` varchar(500),
	`customer_signature` varchar(500),
	`failure_reason` text,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `driver_assignments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drivers` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`license_number` varchar(100) NOT NULL,
	`vehicle_type` varchar(100) NOT NULL,
	`vehicle_make` varchar(100),
	`vehicle_model` varchar(100),
	`vehicle_year` int,
	`vehicle_plate_number` varchar(50) NOT NULL,
	`vehicle_color` varchar(50),
	`base_location` varchar(255) NOT NULL,
	`base_latitude` decimal(10,8),
	`base_longitude` decimal(11,8),
	`current_latitude` decimal(10,8),
	`current_longitude` decimal(11,8),
	`status` varchar(20) DEFAULT 'offline',
	`is_active` boolean DEFAULT true,
	`max_delivery_radius` int DEFAULT 50,
	`emergency_contact` varchar(20),
	`emergency_contact_name` varchar(255),
	`date_of_joining` datetime DEFAULT CURRENT_TIMESTAMP,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `drivers_id` PRIMARY KEY(`id`),
	CONSTRAINT `drivers_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `drivers_license_number_unique` UNIQUE(`license_number`)
);
--> statement-breakpoint
CREATE TABLE `loyalty_points_history` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`order_id` varchar(255),
	`transaction_type` varchar(20) NOT NULL,
	`status` varchar(20) DEFAULT 'available',
	`points` int NOT NULL,
	`points_balance` int NOT NULL,
	`description` text,
	`order_amount` decimal(10,2),
	`discount_amount` decimal(10,2),
	`expires_at` datetime,
	`is_expired` boolean DEFAULT false,
	`processed_by` varchar(255),
	`metadata` json,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `loyalty_points_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`variant_id` varchar(255),
	`product_name` varchar(255) NOT NULL,
	`variant_title` varchar(255),
	`sku` varchar(100),
	`quantity` int NOT NULL DEFAULT 0,
	`weight_quantity` decimal(12,2) DEFAULT '0.00',
	`weight_unit` varchar(10),
	`price` decimal(10,2) NOT NULL,
	`cost_price` decimal(10,2),
	`total_price` decimal(10,2) NOT NULL,
	`total_cost` decimal(10,2),
	`product_image` varchar(500),
	`addons` json,
	`group_title` varchar(255),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(255) NOT NULL,
	`order_number` varchar(100) NOT NULL,
	`user_id` varchar(255),
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`payment_status` varchar(50) DEFAULT 'pending',
	`fulfillment_status` varchar(50) DEFAULT 'pending',
	`subtotal` decimal(10,2) NOT NULL,
	`tax_amount` decimal(10,2) DEFAULT '0.00',
	`shipping_amount` decimal(10,2) DEFAULT '0.00',
	`discount_amount` decimal(10,2) DEFAULT '0.00',
	`total_amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'USD',
	`delivery_time` varchar(255),
	`billing_first_name` varchar(100),
	`billing_last_name` varchar(100),
	`billing_address1` varchar(255),
	`billing_address2` varchar(255),
	`billing_city` varchar(100),
	`billing_state` varchar(100),
	`billing_postal_code` varchar(20),
	`billing_country` varchar(100),
	`shipping_first_name` varchar(100),
	`shipping_last_name` varchar(100),
	`shipping_address1` varchar(255),
	`shipping_address2` varchar(255),
	`shipping_city` varchar(100),
	`shipping_state` varchar(100),
	`shipping_postal_code` varchar(20),
	`shipping_country` varchar(100),
	`shipping_method` varchar(100),
	`tracking_number` varchar(255),
	`notes` text,
	`cancel_reason` text,
	`service_date` varchar(10),
	`service_time` varchar(8),
	`assigned_driver_id` varchar(255),
	`delivery_status` varchar(30) DEFAULT 'pending',
	`points_to_redeem` int DEFAULT 0,
	`points_discount_amount` decimal(10,2) DEFAULT '0.00',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `product_addons` (
	`id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`addon_id` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`is_required` boolean DEFAULT false,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_addons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_inventory` (
	`id` varchar(255) NOT NULL,
	`product_id` varchar(255),
	`variant_id` varchar(255),
	`quantity` int NOT NULL DEFAULT 0,
	`reserved_quantity` int DEFAULT 0,
	`available_quantity` int DEFAULT 0,
	`reorder_point` int DEFAULT 0,
	`reorder_quantity` int DEFAULT 0,
	`weight_quantity` decimal(12,2) DEFAULT '0.00',
	`reserved_weight` decimal(12,2) DEFAULT '0.00',
	`available_weight` decimal(12,2) DEFAULT '0.00',
	`reorder_weight_point` decimal(12,2) DEFAULT '0.00',
	`reorder_weight_quantity` decimal(12,2) DEFAULT '0.00',
	`location` varchar(255),
	`supplier` varchar(255),
	`last_restock_date` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_tags` (
	`id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`tag_id` varchar(255) NOT NULL,
	`custom_value` text,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`sku` varchar(100),
	`title` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`compare_price` decimal(10,2),
	`cost_price` decimal(10,2),
	`weight` decimal(8,2),
	`image` varchar(500),
	`position` int DEFAULT 0,
	`inventory_quantity` int DEFAULT 0,
	`inventory_management` boolean DEFAULT true,
	`allow_backorder` boolean DEFAULT false,
	`variant_options` json,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`short_description` text,
	`sku` varchar(100),
	`price` decimal(10,2) NOT NULL,
	`compare_price` decimal(10,2),
	`cost_price` decimal(10,2),
	`images` json,
	`banner` varchar(500),
	`category_id` varchar(255),
	`subcategory_id` varchar(255),
	`tags` json,
	`weight` decimal(8,2),
	`dimensions` json,
	`is_featured` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`is_digital` boolean DEFAULT false,
	`requires_shipping` boolean DEFAULT true,
	`taxable` boolean DEFAULT true,
	`meta_title` varchar(255),
	`meta_description` text,
	`product_type` varchar(50) DEFAULT 'simple',
	`variation_attributes` json,
	`stock_management_type` varchar(20) DEFAULT 'quantity',
	`price_per_unit` decimal(10,2),
	`base_weight_unit` varchar(10) DEFAULT 'grams',
	`thc` decimal(5,2),
	`cbd` decimal(5,2),
	`difficulty` varchar(50),
	`flowering_time` varchar(100),
	`yield_amount` varchar(100),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`return_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`reason` varchar(255),
	`method` varchar(50),
	`transaction_id` varchar(255),
	`status` varchar(50) DEFAULT 'pending',
	`processed_by` varchar(255),
	`notes` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `return_items` (
	`id` varchar(255) NOT NULL,
	`return_id` varchar(255) NOT NULL,
	`order_item_id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`variant_id` varchar(255),
	`quantity` int NOT NULL,
	`condition` varchar(50),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `return_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `returns` (
	`id` varchar(255) NOT NULL,
	`return_number` varchar(100) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`status` varchar(50) DEFAULT 'pending',
	`reason` varchar(255) NOT NULL,
	`description` text,
	`refund_amount` decimal(10,2),
	`restock_fee` decimal(10,2) DEFAULT '0.00',
	`admin_notes` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `returns_id` PRIMARY KEY(`id`),
	CONSTRAINT `returns_return_number_unique` UNIQUE(`return_number`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sessionToken` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `sessions_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`type` varchar(50) DEFAULT 'string',
	`description` text,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `shipping_labels` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`carrier` varchar(100) NOT NULL,
	`service` varchar(100),
	`tracking_number` varchar(255) NOT NULL,
	`label_url` varchar(500),
	`cost` decimal(10,2),
	`weight` decimal(8,2),
	`dimensions` json,
	`status` varchar(50) DEFAULT 'created',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `shipping_labels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` varchar(255) NOT NULL,
	`inventory_id` varchar(255) NOT NULL,
	`product_id` varchar(255) NOT NULL,
	`variant_id` varchar(255),
	`movement_type` varchar(50) NOT NULL,
	`quantity` int NOT NULL DEFAULT 0,
	`previous_quantity` int NOT NULL DEFAULT 0,
	`new_quantity` int NOT NULL DEFAULT 0,
	`weight_quantity` decimal(12,2) DEFAULT '0.00',
	`previous_weight_quantity` decimal(12,2) DEFAULT '0.00',
	`new_weight_quantity` decimal(12,2) DEFAULT '0.00',
	`reason` varchar(255) NOT NULL,
	`location` varchar(255),
	`reference` varchar(255),
	`notes` text,
	`cost_price` decimal(10,2),
	`supplier` varchar(255),
	`processed_by` varchar(255),
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`image` varchar(500),
	`category_id` varchar(255) NOT NULL,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `subcategories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tag_groups` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7),
	`icon` varchar(100),
	`allow_custom_values` boolean DEFAULT false,
	`is_required` boolean DEFAULT false,
	`max_selections` int DEFAULT 0,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tag_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_groups_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`color` varchar(7),
	`icon` varchar(100),
	`group_id` varchar(255) NOT NULL,
	`is_custom` boolean DEFAULT false,
	`custom_value` text,
	`sort_order` int DEFAULT 0,
	`is_active` boolean DEFAULT true,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twilio_call_sessions` (
	`id` varchar(255) NOT NULL,
	`conversation_id` varchar(255) NOT NULL,
	`caller_id` varchar(255) NOT NULL,
	`receiver_id` varchar(255) NOT NULL,
	`twilio_call_sid` varchar(255),
	`status` varchar(20) DEFAULT 'initiated',
	`started_at` datetime,
	`ended_at` datetime,
	`duration` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `twilio_call_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `twilio_conversations` (
	`id` varchar(255) NOT NULL,
	`order_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`driver_id` varchar(255) NOT NULL,
	`twilio_conversation_sid` varchar(255) NOT NULL,
	`status` varchar(20) DEFAULT 'active',
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `twilio_conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `twilio_conversations_twilio_conversation_sid_unique` UNIQUE(`twilio_conversation_sid`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255),
	`first_name` varchar(100),
	`last_name` varchar(100),
	`email` varchar(255) NOT NULL,
	`emailVerified` datetime,
	`image` text,
	`profile_picture` varchar(255),
	`username` varchar(100),
	`display_name` varchar(100),
	`phone` varchar(20),
	`country` varchar(100),
	`city` varchar(100),
	`address` varchar(255),
	`state` varchar(100),
	`postal_code` varchar(20),
	`user_type` varchar(20) DEFAULT 'customer',
	`newsletter` boolean DEFAULT false,
	`date_of_birth` datetime,
	`otp` varchar(6),
	`otp_expiry` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_loyalty_points` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`total_points_earned` int DEFAULT 0,
	`total_points_redeemed` int DEFAULT 0,
	`available_points` int DEFAULT 0,
	`pending_points` int DEFAULT 0,
	`points_expiring_soon` int DEFAULT 0,
	`last_earned_at` datetime,
	`last_redeemed_at` datetime,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `user_loyalty_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variation_attribute_values` (
	`id` varchar(255) NOT NULL,
	`attribute_id` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`color_code` varchar(7),
	`image` varchar(500),
	`description` text,
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `variation_attribute_values_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variation_attributes` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`type` varchar(50) DEFAULT 'select',
	`is_active` boolean DEFAULT true,
	`sort_order` int DEFAULT 0,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `variation_attributes_id` PRIMARY KEY(`id`),
	CONSTRAINT `variation_attributes_name_unique` UNIQUE(`name`),
	CONSTRAINT `variation_attributes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`otp` varchar(255) NOT NULL,
	`expires` datetime NOT NULL,
	CONSTRAINT `verification_tokens_identifier_token_otp_pk` PRIMARY KEY(`identifier`,`token`,`otp`)
);
