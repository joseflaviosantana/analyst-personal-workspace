CREATE TABLE `medidas_dax` (
	`id` text PRIMARY KEY NOT NULL,
	`modelo_powerbi_id` text NOT NULL,
	`metrica_analitica_id` text,
	`nome` text NOT NULL,
	`tabela_hospedeira` text DEFAULT '_Medidas' NOT NULL,
	`expressao_dax` text NOT NULL,
	`descricao` text,
	`formato_string` text,
	`categoria_dax` text DEFAULT 'AGREGACAO_SIMPLES' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`modelo_powerbi_id`) REFERENCES `modelos_powerbi`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`metrica_analitica_id`) REFERENCES `metricas_analiticas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_medidas_dax_modelo_powerbi_id` ON `medidas_dax` (`modelo_powerbi_id`);--> statement-breakpoint
CREATE INDEX `idx_medidas_dax_metrica_id` ON `medidas_dax` (`metrica_analitica_id`);--> statement-breakpoint
CREATE TABLE `modelos_powerbi` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`modelo_analitico_id` text,
	`nome_arquivo` text NOT NULL,
	`caminho_local` text,
	`tipo_formato` text DEFAULT 'PBIX' NOT NULL,
	`status` text DEFAULT 'EM_DESENVOLVIMENTO' NOT NULL,
	`justificativa_isencao` text,
	`hash_sha256` text,
	`versao_powerbi` text,
	`tamanho_bytes` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modelo_analitico_id`) REFERENCES `modelos_analiticos`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_modelos_powerbi_demanda_id` ON `modelos_powerbi` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_modelos_powerbi_modelo_analitico_id` ON `modelos_powerbi` (`modelo_analitico_id`);--> statement-breakpoint
CREATE TABLE `paginas_relatorio` (
	`id` text PRIMARY KEY NOT NULL,
	`modelo_powerbi_id` text NOT NULL,
	`nome` text NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`objetivo_analitico` text,
	`publico_alvo` text DEFAULT 'EXECUTIVO' NOT NULL,
	`layout_grid` text DEFAULT 'PADRAO_16_9' NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`modelo_powerbi_id`) REFERENCES `modelos_powerbi`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_paginas_relatorio_modelo_id` ON `paginas_relatorio` (`modelo_powerbi_id`);--> statement-breakpoint
CREATE TABLE `visuais_dashboard` (
	`id` text PRIMARY KEY NOT NULL,
	`pagina_id` text NOT NULL,
	`titulo` text NOT NULL,
	`tipo_visual` text DEFAULT 'CARTAO_KPI' NOT NULL,
	`posicao_layout` text DEFAULT 'CENTRAL_TENDENCIAS' NOT NULL,
	`medidas_utilizadas_ids` text DEFAULT '[]' NOT NULL,
	`atributos_utilizados_ids` text DEFAULT '[]' NOT NULL,
	`justificativa_dataviz` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`pagina_id`) REFERENCES `paginas_relatorio`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_visuais_dashboard_pagina_id` ON `visuais_dashboard` (`pagina_id`);