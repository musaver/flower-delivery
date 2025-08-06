-- Migration: Add notification preference columns to user table
-- This script adds notification preference settings to the user table
-- Run this migration after updating the schema files

-- Check if columns already exist before adding them
SET @sql = '';

-- Add notify_order_updates column if it doesn't exist
SELECT COUNT(*) INTO @column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'notify_order_updates';

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE `user` ADD COLUMN `notify_order_updates` TINYINT DEFAULT 1;', 
  'SELECT "Column notify_order_updates already exists" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add notify_promotions column if it doesn't exist
SELECT COUNT(*) INTO @column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'notify_promotions';

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE `user` ADD COLUMN `notify_promotions` TINYINT DEFAULT 0;', 
  'SELECT "Column notify_promotions already exists" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add notify_driver_messages column if it doesn't exist
SELECT COUNT(*) INTO @column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'notify_driver_messages';

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE `user` ADD COLUMN `notify_driver_messages` TINYINT DEFAULT 1;', 
  'SELECT "Column notify_driver_messages already exists" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the columns were added
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME IN ('notify_order_updates', 'notify_promotions', 'notify_driver_messages')
ORDER BY COLUMN_NAME;