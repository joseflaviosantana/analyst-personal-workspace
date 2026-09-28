CREATE TABLE `atributos_analiticos` (
	`id` text PRIMARY KEY NOT NULL,
	`entidade_id` text NOT NULL,
	`nome_original` text NOT NULL,
	`nome_amigavel` text NOT NULL,
	`tipo_dado` text DEFAULT 'TEXTO' NOT NULL,
	`papel` text DEFAULT 'ATRIBUTO_DESCRITIVO' NOT NULL,
	`ordem` integer DEFAULT 0 NOT NULL,
	`oculto` integer DEFAULT 0 NOT NULL,
	`descricao` text,
	`formato_exibicao` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`entidade_id`) REFERENCES `entidades_analiticas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_atributos_analiticos_entidade` ON `atributos_analiticos` (`entidade_id`);--> statement-breakpoint
CREATE TABLE `entidades_analiticas` (
	`id` text PRIMARY KEY NOT NULL,
	`modelo_id` text NOT NULL,
	`ativo_dados_id` text,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`papel` text DEFAULT 'DIMENSAO_PADRAO' NOT NULL,
	`origem_tipo` text DEFAULT 'DATASET_AUTORIZADO' NOT NULL,
	`descricao` text,
	`ordem_apresentacao` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`modelo_id`) REFERENCES `modelos_analiticos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ativo_dados_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_entidades_analiticas_modelo` ON `entidades_analiticas` (`modelo_id`);--> statement-breakpoint
CREATE INDEX `idx_entidades_analiticas_ativo` ON `entidades_analiticas` (`ativo_dados_id`);--> statement-breakpoint
CREATE TABLE `metricas_analiticas` (
	`id` text PRIMARY KEY NOT NULL,
	`modelo_id` text NOT NULL,
	`entidade_id` text,
	`nome` text NOT NULL,
	`descricao` text,
	`tipo_agregacao` text DEFAULT 'SOMA' NOT NULL,
	`tipo_aditividade` text DEFAULT 'TOTALMENTE_ADITIVA' NOT NULL,
	`formula_declarativa` text NOT NULL,
	`unidade_medida` text DEFAULT 'MOEDA' NOT NULL,
	`formato_exibicao` text,
	`status` text DEFAULT 'RASCUNHO' NOT NULL,
	`atributos_dependentes_ids` text DEFAULT '[]' NOT NULL,
	`metricas_dependentes_ids` text DEFAULT '[]' NOT NULL,
	`pergunta_negocio_associada` text,
	`objetivo_negocio_associado` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`modelo_id`) REFERENCES `modelos_analiticos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entidade_id`) REFERENCES `entidades_analiticas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_metricas_analiticas_modelo` ON `metricas_analiticas` (`modelo_id`);--> statement-breakpoint
CREATE INDEX `idx_metricas_analiticas_entidade` ON `metricas_analiticas` (`entidade_id`);--> statement-breakpoint
CREATE TABLE `modelos_analiticos` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`dataset_autorizado_id` text NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`tipo_arquitetura` text DEFAULT 'ESTRELA' NOT NULL,
	`status` text DEFAULT 'RASCUNHO' NOT NULL,
	`homologado_em` text,
	`homologado_por` text,
	`justificativa_homologacao` text,
	`revogado_em` text,
	`motivo_revogacao` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dataset_autorizado_id`) REFERENCES `datasets_autorizados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_unique_modelo_analitico_homologado` ON `modelos_analiticos` (`demanda_id`) WHERE status = 'HOMOLOGADO';--> statement-breakpoint
CREATE INDEX `idx_modelos_analiticos_demanda` ON `modelos_analiticos` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_modelos_analiticos_dataset` ON `modelos_analiticos` (`dataset_autorizado_id`);--> statement-breakpoint
CREATE TABLE `relacionamentos_analiticos` (
	`id` text PRIMARY KEY NOT NULL,
	`modelo_id` text NOT NULL,
	`entidade_origem_id` text NOT NULL,
	`atributo_origem_id` text NOT NULL,
	`entidade_destino_id` text NOT NULL,
	`atributo_destino_id` text NOT NULL,
	`tipo_relacionamento` text DEFAULT 'MUITOS_PARA_UM' NOT NULL,
	`direcao_filtro` text DEFAULT 'UNIDIRECIONAL' NOT NULL,
	`ativo` integer DEFAULT 1 NOT NULL,
	`justificativa` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`modelo_id`) REFERENCES `modelos_analiticos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entidade_origem_id`) REFERENCES `entidades_analiticas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`atributo_origem_id`) REFERENCES `atributos_analiticos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entidade_destino_id`) REFERENCES `entidades_analiticas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`atributo_destino_id`) REFERENCES `atributos_analiticos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_relacionamentos_analiticos_modelo` ON `relacionamentos_analiticos` (`modelo_id`);--> statement-breakpoint
CREATE INDEX `idx_relacionamentos_analiticos_origem` ON `relacionamentos_analiticos` (`entidade_origem_id`);--> statement-breakpoint
CREATE INDEX `idx_relacionamentos_analiticos_destino` ON `relacionamentos_analiticos` (`entidade_destino_id`);