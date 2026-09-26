CREATE TABLE `demandas` (
	`id` text PRIMARY KEY NOT NULL,
	`projeto_id` text NOT NULL,
	`titulo` text NOT NULL,
	`solicitacao_bruta` text NOT NULL,
	`contexto` text,
	`objetivo_inicial` text,
	`prazo_esperado` text,
	`restricoes_declaradas` text,
	`estado` text DEFAULT 'BACKLOG' NOT NULL,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL,
	`data_conclusao` text,
	FOREIGN KEY (`projeto_id`) REFERENCES `projetos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projetos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`status` text DEFAULT 'ATIVO' NOT NULL,
	`data_inicio` text,
	`data_conclusao_prevista` text,
	`data_conclusao_real` text,
	`criado_em` text NOT NULL,
	`atualizado_em` text NOT NULL
);
