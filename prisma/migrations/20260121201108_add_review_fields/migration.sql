-- AlterTable
ALTER TABLE `reviews` ADD COLUMN `orderId` VARCHAR(191) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'website',
    ADD COLUMN `imageUrl` VARCHAR(191) NULL,
    ADD COLUMN `approved` BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
