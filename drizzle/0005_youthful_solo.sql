CREATE TABLE `workflowConditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowStepId` int NOT NULL,
	`conditionType` enum('email_opened','email_clicked','engagement_score','contact_status','time_elapsed','custom_field') NOT NULL,
	`operator` varchar(32) NOT NULL,
	`value` text,
	`nextStepIdIfTrue` int,
	`nextStepIdIfFalse` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowConditions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowExecutionSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`stepId` int NOT NULL,
	`status` enum('pending','executing','completed','failed','skipped') NOT NULL DEFAULT 'pending',
	`result` text,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowExecutionSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`contactId` int NOT NULL,
	`userId` int NOT NULL,
	`status` enum('started','in_progress','completed','paused','failed') NOT NULL DEFAULT 'started',
	`currentStepId` int,
	`executionData` text,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflowExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workflowId` int NOT NULL,
	`nodeId` varchar(64) NOT NULL,
	`stepType` enum('delay','send_email','update_status','add_tag','condition','webhook') NOT NULL,
	`config` text,
	`order` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workflowSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`trigger` enum('contact_added','contact_status_changed','email_opened','email_clicked','qr_scanned','manual') NOT NULL,
	`triggerConfig` text,
	`isActive` int NOT NULL DEFAULT 1,
	`nodeData` text,
	`edgeData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workflows_id` PRIMARY KEY(`id`)
);
