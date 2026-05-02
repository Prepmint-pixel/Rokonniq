CREATE TABLE `emailDeliveryLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`followUpId` int NOT NULL,
	`contactId` int NOT NULL,
	`gmailMessageId` varchar(255),
	`recipientEmail` varchar(320) NOT NULL,
	`subject` text NOT NULL,
	`status` enum('pending','sent','failed','bounced','opened','clicked') NOT NULL DEFAULT 'pending',
	`attemptCount` int NOT NULL DEFAULT 0,
	`maxAttempts` int NOT NULL DEFAULT 3,
	`lastAttemptAt` timestamp,
	`nextRetryAt` timestamp,
	`errorMessage` text,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailDeliveryLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailDeliveryQueue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deliveryLogId` int NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`isProcessing` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailDeliveryQueue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailEngagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryLogId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('opened','clicked','replied','forwarded','marked_spam') NOT NULL,
	`linkUrl` varchar(2048),
	`userAgent` text,
	`ipAddress` varchar(45),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailEngagement_id` PRIMARY KEY(`id`)
);
