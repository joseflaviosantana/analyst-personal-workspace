CREATE TABLE `entregaveis_demanda` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text NOT NULL,
	`versao` text DEFAULT '1.0' NOT NULL,
	`caminho_arquivo_ou_link` text NOT NULL,
	`descricao_sumario` text,
	`obrigatorio` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'DISPONIVEL' NOT NULL,
	`aceite_status` text DEFAULT 'PENDENTE' NOT NULL,
	`aceite_justificativa` text,
	`aceite_por` text,
	`aceite_em` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_entregaveis_demanda_id` ON `entregaveis_demanda` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_entregaveis_aceite_status` ON `entregaveis_demanda` (`aceite_status`);--> statement-breakpoint
CREATE TABLE `validacoes_conciliacao` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text NOT NULL,
	`modelo_id` text,
	`metrica_id` text,
	`titulo` text NOT NULL,
	`camada` text NOT NULL,
	`metodo_verificacao` text NOT NULL,
	`base_referencia` text,
	`valor_esperado` real,
	`valor_obtido` real,
	`divergencia_absoluta` real,
	`divergencia_percentual` real,
	`tolerancia_permitida` real DEFAULT 0 NOT NULL,
	`unidade_medida` text,
	`resultado` text DEFAULT 'PENDENTE_RETESTE' NOT NULL,
	`obrigatoria` integer DEFAULT true NOT NULL,
	`acao_corretiva` text,
	`notas_evidencia` text,
	`executado_por` text,
	`executado_em` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`modelo_id`) REFERENCES `modelos_analiticos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`metrica_id`) REFERENCES `metricas_analiticas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_validacoes_demanda_id` ON `validacoes_conciliacao` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_validacoes_resultado` ON `validacoes_conciliacao` (`resultado`);