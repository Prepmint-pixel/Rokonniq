CREATE TABLE `gmailCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`isConnected` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gmailCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `gmailCredentials_userId_unique` UNIQUE(`userId`)
);
