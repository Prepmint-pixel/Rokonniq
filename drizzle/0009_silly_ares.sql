CREATE TABLE `paymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentMethodId` varchar(255) NOT NULL,
	`cardBrand` varchar(32) NOT NULL,
	`cardLast4` varchar(4) NOT NULL,
	`cardExpMonth` int NOT NULL,
	`cardExpYear` int NOT NULL,
	`cardHolderName` varchar(255),
	`isDefault` smallint NOT NULL DEFAULT 0,
	`billingAddress` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentMethods_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentMethods_stripePaymentMethodId_unique` UNIQUE(`stripePaymentMethodId`)
);
--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD CONSTRAINT `paymentMethods_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;