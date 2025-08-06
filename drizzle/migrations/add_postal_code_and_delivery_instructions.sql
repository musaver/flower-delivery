-- Migration: Add postal_code to user table and delivery_instructions to orders table

-- Check if postal_code column exists in user table and add if missing
SELECT COUNT(*) INTO @column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'postal_code';

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE `user` ADD COLUMN `postal_code` VARCHAR(20) DEFAULT NULL;', 
  'SELECT "Column postal_code already exists in user table" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if delivery_instructions column exists in orders table and add if missing
SELECT COUNT(*) INTO @column_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_instructions';

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE `orders` ADD COLUMN `delivery_instructions` TEXT DEFAULT NULL;', 
  'SELECT "Column delivery_instructions already exists in orders table" AS message;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the columns were added
SELECT 
  'user' as table_name,
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'user' 
  AND COLUMN_NAME = 'postal_code'
  
UNION ALL

SELECT 
  'orders' as table_name,
  COLUMN_NAME, 
  DATA_TYPE, 
  COLUMN_DEFAULT, 
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'delivery_instructions'
ORDER BY table_name, COLUMN_NAME;