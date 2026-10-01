CREATE TABLE `ativos_aprendizado` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text,
	`titulo` text NOT NULL,
	`categoria` text NOT NULL,
	`descricao` text,
	`procedimento_padrao` text NOT NULL,
	`contexto_aplicacao` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_ativos_aprendizado_demanda_id` ON `ativos_aprendizado` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_ativos_aprendizado_categoria` ON `ativos_aprendizado` (`categoria`);--> statement-breakpoint
CREATE TABLE `estudos_caso_portfolio` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`projeto_id` text,
	`titulo` text NOT NULL,
	`problema_negocio` text NOT NULL,
	`processo_preparacao` text NOT NULL,
	`modelagem_decisoes` text NOT NULL,
	`validacao_resultados` text NOT NULL,
	`competencias_demonstradas` text DEFAULT '[]' NOT NULL,
	`ferramentas_utilizadas` text DEFAULT '[]' NOT NULL,
	`metricas_fatos` text DEFAULT '[]' NOT NULL,
	`tecnicas_sanitizacao` text DEFAULT '[]' NOT NULL,
	`checklist_sanitizacao` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'RASCUNHO' NOT NULL,
	`homologado_em` text,
	`homologado_por` text,
	`versao` integer DEFAULT 1 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `estudos_caso_portfolio_demanda_id_unique` ON `estudos_caso_portfolio` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_estudos_caso_demanda_id` ON `estudos_caso_portfolio` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_estudos_caso_status` ON `estudos_caso_portfolio` (`status`);