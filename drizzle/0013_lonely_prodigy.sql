CREATE TABLE `perguntas_clarificacao` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`requisito_id` text,
	`pergunta` text NOT NULL,
	`motivacao` text,
	`bloqueante` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'RASCUNHO' NOT NULL,
	`enviada_em` text,
	`resposta` text,
	`respondido_por` text,
	`respondida_em` text,
	`impacto_decisao` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requisito_id`) REFERENCES `requisitos_demanda`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_perguntas_demanda_id` ON `perguntas_clarificacao` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_perguntas_status` ON `perguntas_clarificacao` (`status`);--> statement-breakpoint
CREATE INDEX `idx_perguntas_bloqueante` ON `perguntas_clarificacao` (`bloqueante`);--> statement-breakpoint
CREATE TABLE `requisitos_demanda` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`categoria` text NOT NULL,
	`prioridade` text DEFAULT 'OBRIGATORIO' NOT NULL,
	`status` text DEFAULT 'IDENTIFICADO' NOT NULL,
	`origem` text DEFAULT 'MANUAL' NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_requisitos_demanda_id` ON `requisitos_demanda` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_requisitos_status` ON `requisitos_demanda` (`status`);--> statement-breakpoint
ALTER TABLE `demandas` ADD `periodo_analise` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `granularidade` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `formato_entrega` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `requisitos_homologados_em` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `requisitos_homologados_por` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `requisitos_justificativa_homologacao` text;--> statement-breakpoint
ALTER TABLE `demandas` ADD `requisitos_ressalvas` text;