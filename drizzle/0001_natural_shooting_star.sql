CREATE TABLE `analyticsEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` varchar(64) NOT NULL,
	`eventType` enum('wallet_add_apple','wallet_add_google','qr_scan','card_view','card_share','vcard_download','qr_download') NOT NULL,
	`platform` varchar(32),
	`userAgent` text,
	`ipAddress` varchar(45),
	`referrer` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analyticsEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cardStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cardId` varchar(64) NOT NULL,
	`walletAddCount` int NOT NULL DEFAULT 0,
	`walletAddAppleCount` int NOT NULL DEFAULT 0,
	`walletAddGoogleCount` int NOT NULL DEFAULT 0,
	`qrScanCount` int NOT NULL DEFAULT 0,
	`cardViewCount` int NOT NULL DEFAULT 0,
	`cardShareCount` int NOT NULL DEFAULT 0,
	`vcardDownloadCount` int NOT NULL DEFAULT 0,
	`qrDownloadCount` int NOT NULL DEFAULT 0,
	`lastWalletAddAt` timestamp,
	`lastQrScanAt` timestamp,
	`lastCardViewAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cardStats_id` PRIMARY KEY(`id`)
);
