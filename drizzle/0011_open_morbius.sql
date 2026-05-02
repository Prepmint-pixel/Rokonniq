CREATE TABLE `capturedContacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` varchar(64) NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`company` varchar(255),
	`position` varchar(255),
	`notes` text,
	`source` varchar(50) NOT NULL DEFAULT 'card_form',
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `capturedContacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walletCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` varchar(64) NOT NULL,
	`walletCardId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`logoUrl` text,
	`backgroundColor` varchar(7) NOT NULL DEFAULT '#000000',
	`foregroundColor` varchar(7) NOT NULL DEFAULT '#FFFFFF',
	`labelColor` varchar(7) NOT NULL DEFAULT '#CCCCCC',
	`organizationName` varchar(255),
	`serialNumber` varchar(255) NOT NULL,
	`passTypeIdentifier` varchar(255),
	`teamIdentifier` varchar(255),
	`qrCodeUrl` text,
	`barcodeUrl` text,
	`barcodeFormat` varchar(20) NOT NULL DEFAULT 'QR',
	`barcodeValue` text,
	`relevantDate` timestamp,
	`expirationDate` timestamp,
	`voided` smallint NOT NULL DEFAULT 0,
	`passData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walletCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `walletCards_walletCardId_unique` UNIQUE(`walletCardId`)
);
--> statement-breakpoint
ALTER TABLE `capturedContacts` ADD CONSTRAINT `capturedContacts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `walletCards` ADD CONSTRAINT `walletCards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;