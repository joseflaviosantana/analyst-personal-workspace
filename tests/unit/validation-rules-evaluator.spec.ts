import { describe, it, expect } from 'vitest';
import { ValidationRulesEvaluator } from '@/core/domain/rules/validation-rules-evaluator';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';

function mockValidacao(overrides: Partial<ValidacaoConciliacao> = {}): ValidacaoConciliacao {
  return {
    id: `val_${Math.random().toString(36).substring(2, 9)}`,
    demanda_id: 'dem_test_1',
    modelo_id: 'mod_1',
    metrica_id: 'met_1',
    titulo: 'Conciliação Faturamento vs ERP',
    camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
    metodo_verificacao: 'SELECT SUM(valor) comparado com relatório contábil',
    base_referencia: 'Relatório Contábil Mensal',
    valor_esperado: 100000,
    valor_obtido: 100000,
    divergencia_absoluta: 0,
    divergencia_percentual: 0,
    tolerancia_permitida: 0,
    unidade_medida: 'BRL',
    resultado: ResultadoValidacao.APROVADO,
    obrigatoria: true,
    acao_corretiva: null,
    notas_evidencia: 'Evidência anexada no dossiê',
    executado_por: 'Analista Responsável',
    executado_em: new Date().toISOString(),
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    ...overrides,
  };
}

function mockEntregavel(overrides: Partial<EntregavelDemanda> = {}): EntregavelDemanda {
  return {
    id: `ent_${Math.random().toString(36).substring(2, 9)}`,
    demanda_id: 'dem_test_1',
    titulo: 'Dashboard Executivo Power BI',
    tipo: TipoEntregavel.DASHBOARD_POWERBI,
    versao: '1.0',
    caminho_arquivo_ou_link: 'https://app.powerbi.com/groups/me/reports/123',
    descricao_sumario: 'Dashboard com métricas consolidadas',
    obrigatorio: true,
    status: StatusEntregavel.HOMOLOGADO,
    aceite_status: StatusAceiteEntrega.ACEITO,
    aceite_justificativa: 'Validado em reunião com stakeholder',
    aceite_por: 'Diretoria de Operações',
    aceite_em: new Date().toISOString(),
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    ...overrides,
  };
}

describe('Unit Tests: ValidationRulesEvaluator — Regras V-01 a V-04 (Subunidade 3.7A)', () => {
  describe('REGRA V-01: Existência Mínima de Validação', () => {
    it('deve bloquear pronto_para_entrega se não houver nenhuma validação cadastrada', () => {
      const entregavel = mockEntregavel();
      const resultado = ValidationRulesEvaluator.avaliar([], [entregavel]);

      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega).toContain(
        'A demanda não possui nenhuma validação analítica ou conciliação cadastrada.'
      );
      expect(resultado.diagnosticos.some((d) => d.codigo === 'V-01')).toBe(true);
    });
  });

  describe('REGRA V-02: Resolução de Checks de Validação e Divergências', () => {
    it('deve bloquear se houver validação obrigatória com resultado DIVERGENTE', () => {
      const valDivergente = mockValidacao({
        resultado: ResultadoValidacao.DIVERGENTE,
        divergencia_absoluta: 1500,
        tolerancia_permitida: 0,
      });
      const entregavel = mockEntregavel();

      const resultado = ValidationRulesEvaluator.avaliar([valDivergente], [entregavel]);
      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega.some((b) => b.includes('DIVERGENTE'))).toBe(true);
      expect(resultado.diagnosticos.some((d) => d.codigo === 'V-02')).toBe(true);
    });

    it('deve bloquear se houver validação obrigatória com resultado REJEITADO', () => {
      const valRejeitada = mockValidacao({ resultado: ResultadoValidacao.REJEITADO });
      const entregavel = mockEntregavel();

      const resultado = ValidationRulesEvaluator.avaliar([valRejeitada], [entregavel]);
      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega.some((b) => b.includes('REJEITADA'))).toBe(true);
    });

    it('deve bloquear se houver validação obrigatória PENDENTE_RETESTE', () => {
      const valPendente = mockValidacao({ resultado: ResultadoValidacao.PENDENTE_RETESTE });
      const entregavel = mockEntregavel();

      const resultado = ValidationRulesEvaluator.avaliar([valPendente], [entregavel]);
      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega.some((b) => b.includes('PENDENTE DE RETESTE'))).toBe(true);
    });

    it('não deve bloquear pronto_para_entrega se uma validação não obrigatória for divergente, mas deve gerar ALERTA_CRITICO', () => {
      const valObrigatoria = mockValidacao({ obrigatoria: true, resultado: ResultadoValidacao.APROVADO });
      const valOpcionalDivergente = mockValidacao({
        obrigatoria: false,
        resultado: ResultadoValidacao.DIVERGENTE,
        titulo: 'Check secundário de arredondamento',
      });
      const entregavel = mockEntregavel();

      const resultado = ValidationRulesEvaluator.avaliar([valObrigatoria, valOpcionalDivergente], [entregavel]);
      expect(resultado.pronto_para_entrega).toBe(true);
      expect(resultado.alertas_criticos.length).toBeGreaterThan(0);
      expect(resultado.alertas_criticos[0]).toContain('Check secundário de arredondamento');
    });
  });

  describe('REGRA V-03: Prontidão dos Entregáveis para PRONTA_PARA_ENTREGA', () => {
    it('deve bloquear se não houver nenhum entregável cadastrado', () => {
      const validacao = mockValidacao();
      const resultado = ValidationRulesEvaluator.avaliar([validacao], []);

      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega).toContain(
        'A demanda não possui nenhum entregável profissional cadastrado no pacote de entrega.'
      );
    });

    it('deve bloquear se nenhum entregável estiver DISPONÍVEL ou HOMOLOGADO', () => {
      const validacao = mockValidacao();
      const entregavel = mockEntregavel({ status: StatusEntregavel.RASCUNHO });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entregavel]);
      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega.some((b) => b.includes('DISPONÍVEL ou HOMOLOGADO'))).toBe(true);
    });

    it('deve bloquear se entregável obrigatório estiver como RASCUNHO', () => {
      const validacao = mockValidacao();
      const entregavel1 = mockEntregavel({ status: StatusEntregavel.DISPONIVEL });
      const entregavel2 = mockEntregavel({
        titulo: 'Relatório Executivo',
        obrigatorio: true,
        status: StatusEntregavel.RASCUNHO,
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entregavel1, entregavel2]);
      expect(resultado.pronto_para_entrega).toBe(false);
      expect(resultado.bloqueios_entrega.some((b) => b.includes('RASCUNHO'))).toBe(true);
    });
  });

  describe('REGRA V-04: Aceite Formal e Conclusão (Ajuste Vinculante: múltiplos entregáveis)', () => {
    it('deve liberar conclusão com 1 entregável obrigatório aceito formalmente', () => {
      const validacao = mockValidacao();
      const entregavel = mockEntregavel({
        obrigatorio: true,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Gestor de BI',
        aceite_em: '2026-09-29T10:00:00Z',
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entregavel]);
      expect(resultado.pronto_para_conclusao).toBe(true);
      expect(resultado.bloqueios_conclusao.length).toBe(0);
    });

    it('AJUSTE VINCULANTE: 3 obrigatórios com 2 aceitos e 1 pendente DEVE BLOQUEAR a conclusão', () => {
      const validacao = mockValidacao();
      const ent1 = mockEntregavel({ titulo: 'Dashboard Power BI', obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent2 = mockEntregavel({ titulo: 'Dicionário de Dados', obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent3 = mockEntregavel({ titulo: 'Script SQL Validado', obrigatorio: true, aceite_status: StatusAceiteEntrega.PENDENTE });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [ent1, ent2, ent3]);
      expect(resultado.pronto_para_conclusao).toBe(false);
      expect(resultado.bloqueios_conclusao.some((b) => b.includes('Script SQL Validado') && b.includes('PENDENTE'))).toBe(true);
    });

    it('AJUSTE VINCULANTE: 3 obrigatórios com 2 aceitos e 1 rejeitado DEVE BLOQUEAR a conclusão', () => {
      const validacao = mockValidacao();
      const ent1 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent2 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent3 = mockEntregavel({
        titulo: 'Relatório Executivo',
        obrigatorio: true,
        aceite_status: StatusAceiteEntrega.REJEITADO,
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [ent1, ent2, ent3]);
      expect(resultado.pronto_para_conclusao).toBe(false);
      expect(resultado.bloqueios_conclusao.some((b) => b.includes('Relatório Executivo') && b.includes('REJEITADO'))).toBe(true);
    });

    it('AJUSTE VINCULANTE: 3 obrigatórios com 2 aceitos e 1 com ajustes solicitados DEVE BLOQUEAR a conclusão', () => {
      const validacao = mockValidacao();
      const ent1 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent2 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent3 = mockEntregavel({
        titulo: 'Apresentação PPT',
        obrigatorio: true,
        aceite_status: StatusAceiteEntrega.AJUSTES_SOLICITADOS,
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [ent1, ent2, ent3]);
      expect(resultado.pronto_para_conclusao).toBe(false);
      expect(resultado.bloqueios_conclusao.some((b) => b.includes('AJUSTES SOLICITADOS'))).toBe(true);
    });

    it('AJUSTE VINCULANTE: 3 obrigatórios todos aceitos com autoria e timestamp DEVE LIBERAR a conclusão', () => {
      const validacao = mockValidacao();
      const ent1 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent2 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const ent3 = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [ent1, ent2, ent3]);
      expect(resultado.pronto_para_conclusao).toBe(true);
      expect(resultado.bloqueios_conclusao.length).toBe(0);
    });

    it('deve bloquear se entregável obrigatório ACEITO não possuir identificação de autoria humana', () => {
      const validacao = mockValidacao();
      const entSemAutor = mockEntregavel({
        obrigatorio: true,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: '',
        aceite_em: new Date().toISOString(),
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entSemAutor]);
      expect(resultado.pronto_para_conclusao).toBe(false);
      expect(resultado.bloqueios_conclusao.some((b) => b.includes('autoria humana'))).toBe(true);
    });

    it('deve bloquear se entregável obrigatório ACEITO não possuir timestamp formal UTC', () => {
      const validacao = mockValidacao();
      const entSemData = mockEntregavel({
        obrigatorio: true,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Stakeholder',
        aceite_em: null,
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entSemData]);
      expect(resultado.pronto_para_conclusao).toBe(false);
      expect(resultado.bloqueios_conclusao.some((b) => b.includes('timestamp formal'))).toBe(true);
    });

    it('entregável não obrigatório rejeitado deve gerar ALERTA_CRITICO sem bloquear conclusão indevidamente', () => {
      const validacao = mockValidacao();
      const entObrigatorio = mockEntregavel({ obrigatorio: true, aceite_status: StatusAceiteEntrega.ACEITO });
      const entOpcional = mockEntregavel({
        obrigatorio: false,
        titulo: 'Gravação da Demo',
        aceite_status: StatusAceiteEntrega.REJEITADO,
      });

      const resultado = ValidationRulesEvaluator.avaliar([validacao], [entObrigatorio, entOpcional]);
      expect(resultado.pronto_para_conclusao).toBe(true);
      expect(resultado.alertas_criticos.some((a) => a.includes('Gravação da Demo'))).toBe(true);
    });
  });
});
