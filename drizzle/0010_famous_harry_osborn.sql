ALTER TABLE `digitalCards` DROP INDEX `digitalCards_cardId_unique`;
ALTER TABLE `digitalCards` ADD CONSTRAINT `userCardIdUnique` UNIQUE (`userId`, `cardId`);