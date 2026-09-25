CREATE TABLE `bootstrap_registros` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`status` text DEFAULT 'OPERACIONAL' NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sistema_info` (
	`id` text PRIMARY KEY NOT NULL,
	`chave` text NOT NULL,
	`valor` text NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sistema_info_chave_unique` ON `sistema_info` (`chave`);