-- DropForeignKey
ALTER TABLE `order_items` DROP FOREIGN KEY `order_items_productId_fkey`;

-- DropIndex
DROP INDEX `order_items_productId_fkey` ON `order_items`;

-- AlterTable
ALTER TABLE `order_items` MODIFY `productId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `avatarUrl` VARCHAR(191) NULL,
    ADD COLUMN `bio` VARCHAR(191) NULL,
    ADD COLUMN `displayName` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NULL,
    `content` VARCHAR(191) NOT NULL,
    `rating` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
