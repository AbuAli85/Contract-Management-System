CREATE TABLE `attachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceRequestId` int NOT NULL,
	`uploadedByUserId` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`originalName` varchar(500) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`fileSize` int NOT NULL,
	`storageKey` varchar(1000) NOT NULL,
	`storageUrl` text NOT NULL,
	`documentType` enum('identity','proof_of_address','supporting','legal','financial','medical','other') DEFAULT 'other',
	`validationStatus` enum('pending','valid','invalid','requires_review') DEFAULT 'pending',
	`validationNotes` text,
	`isRequired` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `attachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` int,
	`oldValues` json,
	`newValues` json,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceRequestId` int NOT NULL,
	`fromUserId` int,
	`toUserId` int,
	`messageType` enum('system','reviewer_note','client_message','status_update','request_info') DEFAULT 'system',
	`subject` varchar(500),
	`bodyEn` text,
	`bodyAr` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `communications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` varchar(128) NOT NULL,
	`queueName` varchar(64) NOT NULL,
	`jobType` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`status` enum('waiting','active','completed','failed','delayed') DEFAULT 'waiting',
	`payload` json,
	`result` json,
	`errorMessage` text,
	`attempts` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `job_queue_id` PRIMARY KEY(`id`),
	CONSTRAINT `job_queue_jobId_unique` UNIQUE(`jobId`)
);
--> statement-breakpoint
CREATE TABLE `service_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serviceRequestId` int NOT NULL,
	`assignedReviewerId` int,
	`assignedCoordinatorId` int,
	`status` enum('open','assigned','in_review','pending_info','escalated','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`reviewerNotes` text,
	`internalNotes` text,
	`decision` enum('approved','rejected','deferred','pending') DEFAULT 'pending',
	`decisionReason` text,
	`decisionAt` timestamp,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_cases_serviceRequestId_unique` UNIQUE(`serviceRequestId`)
);
--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(32),
	`clientUserId` int NOT NULL,
	`serviceTypeId` int NOT NULL,
	`status` enum('draft','submitted','intake_processing','intake_complete','under_review','pending_info','approved','rejected','cancelled') NOT NULL DEFAULT 'draft',
	`titleEn` varchar(500),
	`titleAr` varchar(500),
	`descriptionEn` text,
	`descriptionAr` text,
	`applicantName` varchar(255),
	`applicantEmail` varchar(320),
	`applicantPhone` varchar(32),
	`formData` json,
	`aiSummary` text,
	`aiConfidenceScore` decimal(5,2),
	`aiFlags` json,
	`intakeJobId` varchar(128),
	`submittedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `service_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `service_requests_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `service_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nameEn` varchar(255) NOT NULL,
	`nameAr` varchar(255) NOT NULL,
	`descriptionEn` text,
	`descriptionAr` text,
	`category` varchar(100),
	`estimatedDays` int DEFAULT 7,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `service_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','client_user','reviewer','coordinator','operations_admin','platform_admin','super_admin') NOT NULL DEFAULT 'client_user';--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `preferredLanguage` enum('en','ar') DEFAULT 'en';--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_att_request` ON `attachments` (`serviceRequestId`);--> statement-breakpoint
CREATE INDEX `idx_att_uploader` ON `attachments` (`uploadedByUserId`);--> statement-breakpoint
CREATE INDEX `idx_audit_user` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_logs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_audit_created` ON `audit_logs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_comm_request` ON `communications` (`serviceRequestId`);--> statement-breakpoint
CREATE INDEX `idx_job_entity` ON `job_queue` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `idx_job_status` ON `job_queue` (`status`);--> statement-breakpoint
CREATE INDEX `idx_case_reviewer` ON `service_cases` (`assignedReviewerId`);--> statement-breakpoint
CREATE INDEX `idx_case_status` ON `service_cases` (`status`);--> statement-breakpoint
CREATE INDEX `idx_case_request` ON `service_cases` (`serviceRequestId`);--> statement-breakpoint
CREATE INDEX `idx_sr_client` ON `service_requests` (`clientUserId`);--> statement-breakpoint
CREATE INDEX `idx_sr_status` ON `service_requests` (`status`);--> statement-breakpoint
CREATE INDEX `idx_sr_service_type` ON `service_requests` (`serviceTypeId`);