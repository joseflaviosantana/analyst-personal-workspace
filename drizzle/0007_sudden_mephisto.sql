CREATE TABLE `datasets_autorizados` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`ativo_dados_id` text NOT NULL,
	`diagnostico_qualidade_id` text NOT NULL,
	`receita_preparacao_id` text,
	`versao_rotulo` text NOT NULL,
	`hash_sha256_snapshot` text NOT NULL,
	`status` text DEFAULT 'VIGENTE' NOT NULL,
	`justificativa_autorizacao` text NOT NULL,
	`autorizado_por_tipo` text DEFAULT 'HUMANO' NOT NULL,
	`restricoes_aceitas_snapshot` text DEFAULT '[]' NOT NULL,
	`autorizado_em` text NOT NULL,
	`revogado_em` text,
	`motivo_revogacao` text,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ativo_dados_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`diagnostico_qualidade_id`) REFERENCES `diagnosticos_qualidade`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`receita_preparacao_id`) REFERENCES `receitas_preparacao`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_unique_dataset_autorizado_vigente` ON `datasets_autorizados` (`demanda_id`) WHERE status = 'VIGENTE';--> statement-breakpoint
CREATE TABLE `etapas_problemas_qualidade` (
	`id` text PRIMARY KEY NOT NULL,
	`etapa_transformacao_id` text NOT NULL,
	`problema_qualidade_id` text NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`etapa_transformacao_id`) REFERENCES `etapas_transformacao`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problema_qualidade_id`) REFERENCES `problemas_qualidade`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_etapas_problemas_lookup` ON `etapas_problemas_qualidade` (`etapa_transformacao_id`,`problema_qualidade_id`);--> statement-breakpoint
CREATE TABLE `etapas_transformacao` (
	`id` text PRIMARY KEY NOT NULL,
	`receita_id` text NOT NULL,
	`ordem` integer NOT NULL,
	`tipo_operacao` text NOT NULL,
	`capacidade_ferramenta` text NOT NULL,
	`ferramenta_nome` text NOT NULL,
	`ferramenta_versao` text,
	`descricao` text NOT NULL,
	`especificacao_tecnica` text,
	`status` text DEFAULT 'PLANEJADA' NOT NULL,
	`justificativa` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`receita_id`) REFERENCES `receitas_preparacao`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_etapas_receita_ordem` ON `etapas_transformacao` (`receita_id`,`ordem`);--> statement-breakpoint
CREATE TABLE `linhagem_ativos` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`ativo_origem_id` text NOT NULL,
	`ativo_destino_id` text NOT NULL,
	`etapa_transformacao_id` text,
	`papel_entrada` text DEFAULT 'ORIGEM_UNICA' NOT NULL,
	`criado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ativo_origem_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`ativo_destino_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`etapa_transformacao_id`) REFERENCES `etapas_transformacao`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_linhagem_origem` ON `linhagem_ativos` (`ativo_origem_id`);--> statement-breakpoint
CREATE INDEX `idx_linhagem_destino` ON `linhagem_ativos` (`ativo_destino_id`);--> statement-breakpoint
CREATE INDEX `idx_linhagem_demanda` ON `linhagem_ativos` (`demanda_id`);--> statement-breakpoint
CREATE TABLE `receitas_preparacao` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`status` text DEFAULT 'RASCUNHO' NOT NULL,
	`versao` integer DEFAULT 1 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_receitas_demanda` ON `receitas_preparacao` (`demanda_id`);--> statement-breakpoint
ALTER TABLE `ativos_dados` ADD `categoria_ativo` text DEFAULT 'BRUTO_RECEBIDO' NOT NULL;