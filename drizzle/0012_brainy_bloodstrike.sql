CREATE TABLE `eventos_analiticos_log` (
	`id` text PRIMARY KEY NOT NULL,
	`id_evento` text NOT NULL,
	`demanda_id` text NOT NULL,
	`projeto_id` text,
	`tipo_evento` text NOT NULL,
	`etapa_origem` text NOT NULL,
	`politica_aplicada` text NOT NULL,
	`status_processamento` text NOT NULL,
	`evidencia_gerada_id` text,
	`correlation_id` text,
	`causation_id` text,
	`motivo` text,
	`erro_detalhe` text,
	`payload_snapshot` text,
	`processado_em` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`evidencia_gerada_id`) REFERENCES `evidencias_analiticas`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `eventos_analiticos_log_id_evento_unique` ON `eventos_analiticos_log` (`id_evento`);--> statement-breakpoint
CREATE INDEX `idx_eventos_analiticos_log_demanda_id` ON `eventos_analiticos_log` (`demanda_id`);--> statement-breakpoint
CREATE INDEX `idx_eventos_analiticos_log_tipo` ON `eventos_analiticos_log` (`tipo_evento`);--> statement-breakpoint
CREATE INDEX `idx_eventos_analiticos_log_id_evento` ON `eventos_analiticos_log` (`id_evento`);