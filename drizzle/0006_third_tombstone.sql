CREATE TABLE `regras_qualidade` (
	`id` text PRIMARY KEY NOT NULL,
	`ativo_dados_id` text NOT NULL,
	`tipo` text NOT NULL,
	`coluna` text,
	`colunas` text DEFAULT '[]' NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`parametros` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'ATIVA' NOT NULL,
	`versao` integer DEFAULT 1 NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`ativo_dados_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_problemas_qualidade` (
	`id` text PRIMARY KEY NOT NULL,
	`diagnostico_id` text,
	`ativo_dados_id` text NOT NULL,
	`demanda_id` text NOT NULL,
	`categoria` text NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text NOT NULL,
	`tabela_afetada` text NOT NULL,
	`coluna_afetada` text,
	`total_linhas_afetadas` integer DEFAULT 0 NOT NULL,
	`percentual_linhas_afetadas` real DEFAULT 0 NOT NULL,
	`amostra_evidencias` text DEFAULT '[]' NOT NULL,
	`severidade` text DEFAULT 'PENDENTE' NOT NULL,
	`impacto_calculo` text,
	`acao_deliberada` text,
	`justificativa_deliberacao` text,
	`deliberado_por_humano` integer DEFAULT 0 NOT NULL,
	`deliberado_em` text,
	`status` text DEFAULT 'ABERTO' NOT NULL,
	`origem_deteccao` text DEFAULT 'AUTOMATICA' NOT NULL,
	`regra_id` text,
	`regra_snapshot` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	FOREIGN KEY (`diagnostico_id`) REFERENCES `diagnosticos_qualidade`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ativo_dados_id`) REFERENCES `ativos_dados`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`regra_id`) REFERENCES `regras_qualidade`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_problemas_qualidade`("id", "diagnostico_id", "ativo_dados_id", "demanda_id", "categoria", "titulo", "descricao", "tabela_afetada", "coluna_afetada", "total_linhas_afetadas", "percentual_linhas_afetadas", "amostra_evidencias", "severidade", "impacto_calculo", "acao_deliberada", "justificativa_deliberacao", "deliberado_por_humano", "deliberado_em", "status", "origem_deteccao", "criado_em", "atualizado_em") SELECT "id", "diagnostico_id", "ativo_dados_id", "demanda_id", "categoria", "titulo", "descricao", "tabela_afetada", "coluna_afetada", "total_linhas_afetadas", "percentual_linhas_afetadas", "amostra_evidencias", "severidade", "impacto_calculo", "acao_deliberada", "justificativa_deliberacao", "deliberado_por_humano", "deliberado_em", "status", "origem_deteccao", "criado_em", "atualizado_em" FROM `problemas_qualidade`;--> statement-breakpoint
DROP TABLE `problemas_qualidade`;--> statement-breakpoint
ALTER TABLE `__new_problemas_qualidade` RENAME TO `problemas_qualidade`;--> statement-breakpoint
PRAGMA foreign_keys=ON;