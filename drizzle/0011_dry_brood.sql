CREATE TABLE `evidencias_analiticas` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`projeto_id` text,
	`tipo` text DEFAULT 'DADOS' NOT NULL,
	`etapa_origem` text DEFAULT 'DADOS' NOT NULL,
	`artefato_origem_tipo` text,
	`artefato_origem_id` text,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`fato_observado` text NOT NULL,
	`estado_anterior` text,
	`acao_registrada` text NOT NULL,
	`estado_posterior` text,
	`resultado_mensuravel` text,
	`inferencia_recomendacao` text,
	`decisao_humana` text,
	`metodo_captura` text DEFAULT 'MANUAL' NOT NULL,
	`status_validacao` text DEFAULT 'CAPTURADA' NOT NULL,
	`classificacao_exposicao` text DEFAULT 'INTERNA' NOT NULL,
	`elegibilidade_portfolio` integer DEFAULT false NOT NULL,
	`executor` text DEFAULT 'ANALISTA' NOT NULL,
	`metadados` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_evidencias_analiticas_demanda_id` ON `evidencias_analiticas` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_evidencias_analiticas_projeto_id` ON `evidencias_analiticas` (`projeto_id`);--> statement-breakpoint
CREATE INDEX `idx_evidencias_analiticas_tipo` ON `evidencias_analiticas` (`tipo`);--> statement-breakpoint
CREATE INDEX `idx_evidencias_analiticas_status` ON `evidencias_analiticas` (`status_validacao`);