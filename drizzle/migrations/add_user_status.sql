-- Add status column to user table
ALTER TABLE `user` ADD COLUMN `status` VARCHAR(20) DEFAULT 'pending';

-- Update existing users to have 'approved' status so they can continue logging in
UPDATE `user` SET `status` = 'approved' WHERE `status` IS NULL OR `status` = 'pending';
