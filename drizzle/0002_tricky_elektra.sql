CREATE TABLE `trilha_auditoria` (
	`id` text PRIMARY KEY NOT NULL,
	`demanda_id` text,
	`entidade` text NOT NULL,
	`entidade_id` text NOT NULL,
	`tipo_evento` text NOT NULL,
	`autor_tipo` text NOT NULL,
	`dados_anteriores` text,
	`dados_novos` text,
	`justificativa` text,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`demanda_id`) REFERENCES `demandas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_demandas` (
	`id` text PRIMARY KEY NOT NULL,
	`projeto_id` text NOT NULL,
	`titulo` text NOT NULL,
	`solicitacao_bruta` text NOT NULL,
	`contexto` text,
	`objetivo_inicial` text,
	`prazo_esperado` text,
	`restricoes_declaradas` text,
	`estado` text DEFAULT 'NOVA' NOT NULL,
	`estado_anterior` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	`data_conclusao` text,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_demandas`("id", "projeto_id", "titulo", "solicitacao_bruta", "contexto", "objetivo_inicial", "prazo_esperado", "restricoes_declaradas", "estado", "estado_anterior", "criado_em", "atualizado_em", "data_conclusao") SELECT "id", "projeto_id", "titulo", "solicitacao_bruta", "contexto", "objetivo_inicial", "prazo_esperado", "restricoes_declaradas", "estado", NULL, "criado_em", "atualizado_em", "data_conclusao" FROM `demandas`;--> statement-breakpoint
DROP TABLE `demandas`;--> statement-breakpoint
ALTER TABLE `__new_demandas` RENAME TO `demandas`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
UPDATE `demandas` SET `estado` = 'NOVA' WHERE `estado` = 'BACKLOG';