import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrarValidacaoConciliacaoUseCase } from '@/core/use-cases/validation/registrar-validacao-conciliacao.use-case';
import { AtualizarValidacaoConciliacaoUseCase } from '@/core/use-cases/validation/atualizar-validacao-conciliacao.use-case';
import { RetestarValidacaoConciliacaoUseCase } from '@/core/use-cases/validation/retestar-validacao-conciliacao.use-case';
import { RemoverValidacaoConciliacaoUseCase } from '@/core/use-cases/validation/remover-validacao-conciliacao.use-case';
import { ListarValidacoesDemandaUseCase } from '@/core/use-cases/validation/listar-validacoes-demanda.use-case';
import { RegistrarEntregavelDemandaUseCase } from '@/core/use-cases/validation/registrar-entregavel-demanda.use-case';
import { AtualizarEntregavelDemandaUseCase } from '@/core/use-cases/validation/atualizar-entregavel-demanda.use-case';
import { RegistrarAceiteEntregaUseCase } from '@/core/use-cases/validation/registrar-aceite-entrega.use-case';
import { RemoverEntregavelDemandaUseCase } from '@/core/use-cases/validation/remover-entregavel-demanda.use-case';
import { ListarEntregaveisDemandaUseCase } from '@/core/use-cases/validation/listar-entregaveis-demanda.use-case';
import { AvaliarProntidaoValidacaoUseCase } from '@/core/use-cases/validation/avaliar-prontidao-validacao.use-case';
import { IValidacaoConciliacaoRepository } from '@/core/domain/repositories/validacao-conciliacao-repository.interface';
import { IEntregavelDemandaRepository } from '@/core/domain/repositories/entregavel-demanda-repository.interface';
import { IAuditRepository } from '@/core/domain/repositories/audit-repository.interface';
import { CamadaValidacao } from '@/core/domain/enums/camada-validacao';
import { ResultadoValidacao } from '@/core/domain/enums/resultado-validacao';
import { TipoEntregavel } from '@/core/domain/enums/tipo-entregavel';
import { StatusEntregavel } from '@/core/domain/enums/status-entregavel';
import { StatusAceiteEntrega } from '@/core/domain/enums/status-aceite-entrega';
import { ValidacaoConciliacao } from '@/core/domain/entities/validacao-conciliacao';
import { EntregavelDemanda } from '@/core/domain/entities/entregavel-demanda';

describe('Unit Tests: Use Cases de Validação e Entregáveis (Subunidade 3.7A)', () => {
  let mockValidacoes: ValidacaoConciliacao[];
  let mockEntregaveis: EntregavelDemanda[];
  let validacaoRepo: IValidacaoConciliacaoRepository;
  let entregavelRepo: IEntregavelDemandaRepository;
  let auditRepo: IAuditRepository;

  beforeEach(() => {
    mockValidacoes = [];
    mockEntregaveis = [];

    validacaoRepo = {
      create: vi.fn(async (v) => {
        mockValidacoes.push(v);
        return v;
      }),
      findById: vi.fn(async (id) => mockValidacoes.find((v) => v.id === id) || null),
      findByDemandId: vi.fn(async (demandaId) => mockValidacoes.filter((v) => v.demanda_id === demandaId)),
      update: vi.fn(async (id, partial) => {
        const idx = mockValidacoes.findIndex((v) => v.id === id);
        if (idx === -1) return null;
        mockValidacoes[idx] = { ...mockValidacoes[idx], ...partial };
        return mockValidacoes[idx];
      }),
      delete: vi.fn(async (id) => {
        const initial = mockValidacoes.length;
        mockValidacoes = mockValidacoes.filter((v) => v.id !== id);
        return mockValidacoes.length < initial;
      }),
      countByDemandId: vi.fn(async (demandaId) => mockValidacoes.filter((v) => v.demanda_id === demandaId).length),
    };

    entregavelRepo = {
      create: vi.fn(async (e) => {
        mockEntregaveis.push(e);
        return e;
      }),
      findById: vi.fn(async (id) => mockEntregaveis.find((e) => e.id === id) || null),
      findByDemandId: vi.fn(async (demandaId) => mockEntregaveis.filter((e) => e.demanda_id === demandaId)),
      update: vi.fn(async (id, partial) => {
        const idx = mockEntregaveis.findIndex((e) => e.id === id);
        if (idx === -1) return null;
        mockEntregaveis[idx] = { ...mockEntregaveis[idx], ...partial };
        return mockEntregaveis[idx];
      }),
      delete: vi.fn(async (id) => {
        const initial = mockEntregaveis.length;
        mockEntregaveis = mockEntregaveis.filter((e) => e.id !== id);
        return mockEntregaveis.length < initial;
      }),
      countByDemandId: vi.fn(async (demandaId) => mockEntregaveis.filter((e) => e.demanda_id === demandaId).length),
    };

    auditRepo = {
      record: vi.fn(async (ev) => ({
        id: 'audit_test_1',
        demanda_id: ev.demanda_id,
        entidade: ev.entidade,
        entidade_id: ev.entidade_id,
        tipo_evento: ev.tipo_evento,
        autor_tipo: ev.autor_tipo,
        dados_anteriores: ev.dados_anteriores ?? null,
        dados_novos: ev.dados_novos ?? null,
        justificativa: ev.justificativa ?? null,
        timestamp: ev.timestamp || new Date().toISOString(),
      })),
      findByDemandaId: vi.fn(async () => []),
    };
  });

  describe('RegistrarValidacaoConciliacaoUseCase', () => {
    it('deve registrar validação calculando divergência numérica e emitir auditoria', async () => {
      const useCase = new RegistrarValidacaoConciliacaoUseCase(validacaoRepo, auditRepo);

      const res = await useCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Validação Faturamento 2026',
        camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
        metodo_verificacao: 'Conferência contra ERP SAP',
        valor_esperado: 50000,
        valor_obtido: 50000,
        tolerancia_permitida: 0,
      });

      expect(res.id).toMatch(/^val_/);
      expect(res.divergencia_absoluta).toBe(0);
      expect(res.divergencia_percentual).toBe(0);
      expect(res.resultado).toBe(ResultadoValidacao.APROVADO);
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'VALIDACAO_REGISTRADA',
          entidade: 'validacoes_conciliacao',
        })
      );
    });

    it('deve marcar DIVERGENTE quando divergência exceder tolerância', async () => {
      const useCase = new RegistrarValidacaoConciliacaoUseCase(validacaoRepo, auditRepo);

      const res = await useCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Validação Margem Bruta',
        camada: CamadaValidacao.CALCULOS_E_DAX,
        metodo_verificacao: 'Cálculo de margem vs planilha financeira',
        valor_esperado: 100,
        valor_obtido: 105,
        tolerancia_permitida: 2,
      });

      expect(res.divergencia_absoluta).toBe(5);
      expect(res.divergencia_percentual).toBe(5);
      expect(res.resultado).toBe(ResultadoValidacao.DIVERGENTE);
    });
  });

  describe('RetestarValidacaoConciliacaoUseCase', () => {
    it('deve retestar validação com novo valor obtido e atualizar resultado para APROVADO', async () => {
      const regUseCase = new RegistrarValidacaoConciliacaoUseCase(validacaoRepo, auditRepo);
      const inicial = await regUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Reconciliação Estoque',
        camada: CamadaValidacao.TRANSFORMACOES_POWER_QUERY,
        metodo_verificacao: 'SUM(qtd) vs WMS',
        valor_esperado: 1000,
        valor_obtido: 950,
        tolerancia_permitida: 10,
      });
      expect(inicial.resultado).toBe(ResultadoValidacao.DIVERGENTE);

      const retestUseCase = new RetestarValidacaoConciliacaoUseCase(validacaoRepo, auditRepo);
      const retestado = await retestUseCase.execute({
        id: inicial.id,
        valor_obtido: 1005,
        executado_por: 'Analista QA',
        notas_evidencia: 'Reteste após correção na query de agregação',
      });

      expect(retestado.resultado).toBe(ResultadoValidacao.APROVADO);
      expect(retestado.divergencia_absoluta).toBe(5);
      expect(retestado.executado_por).toBe('Analista QA');
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'VALIDACAO_RETESTADA',
        })
      );
    });
  });

  describe('RegistrarEntregavelDemandaUseCase e Aceite Formal', () => {
    it('deve registrar entregável com status de aceite inicial PENDENTE', async () => {
      const useCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);

      const ent = await useCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Dashboard de Vendas',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        versao: '1.0',
        caminho_arquivo_ou_link: 'https://bi.empresa.com/relatorio',
        obrigatorio: true,
      });

      expect(ent.id).toMatch(/^ent_/);
      expect(ent.aceite_status).toBe(StatusAceiteEntrega.PENDENTE);
      expect(ent.aceite_por).toBeNull();
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'ENTREGAVEL_REGISTRADO',
        })
      );
    });

    it('deve registrar ACEITO com autoria humana e alterar status do entregável para HOMOLOGADO', async () => {
      const regUseCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
      const ent = await regUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Relatório Executivo',
        tipo: TipoEntregavel.RELATORIO_PDF,
        versao: '1.0',
        caminho_arquivo_ou_link: '/docs/relatorio.pdf',
        obrigatorio: true,
      });

      const aceiteUseCase = new RegistrarAceiteEntregaUseCase(entregavelRepo, auditRepo);
      const aceito = await aceiteUseCase.execute({
        id: ent.id,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Gerente Solicitante',
        aceite_justificativa: 'Aprovado formalmente sem ressalvas',
      });

      expect(aceito.aceite_status).toBe(StatusAceiteEntrega.ACEITO);
      expect(aceito.status).toBe(StatusEntregavel.HOMOLOGADO);
      expect(aceito.aceite_por).toBe('Gerente Solicitante');
      expect(aceito.aceite_em).toBeDefined();
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'ENTREGA_ACEITA',
        })
      );
    });

    it('deve exigir justificativa >= 10 caracteres ao rejeitar aceite de entregável', async () => {
      const regUseCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
      const ent = await regUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Dataset CSV Final',
        tipo: TipoEntregavel.DATASET_TRATADO,
        versao: '1.0',
        caminho_arquivo_ou_link: '/data/final.csv',
      });

      const aceiteUseCase = new RegistrarAceiteEntregaUseCase(entregavelRepo, auditRepo);

      await expect(
        aceiteUseCase.execute({
          id: ent.id,
          aceite_status: StatusAceiteEntrega.REJEITADO,
          aceite_por: 'Gerente Solicitante',
          aceite_justificativa: 'Ruim', // menos de 10 caracteres
        })
      ).rejects.toThrow();

      const rejeitado = await aceiteUseCase.execute({
        id: ent.id,
        aceite_status: StatusAceiteEntrega.REJEITADO,
        aceite_por: 'Gerente Solicitante',
        aceite_justificativa: 'Faltam colunas de segmentação regional solicitadas na demanda',
      });

      expect(rejeitado.aceite_status).toBe(StatusAceiteEntrega.REJEITADO);
      expect(auditRepo.record).toHaveBeenCalledWith(
        expect.objectContaining({
          tipo_evento: 'ENTREGA_REJEITADA',
        })
      );
    });

    it('não deve permitir exclusão direta de entregável com aceite formal ACEITO', async () => {
      const regUseCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
      const ent = await regUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Documento de Homologação',
        tipo: TipoEntregavel.DOCUMENTO_TECNICO,
        caminho_arquivo_ou_link: '/docs/homolog.pdf',
      });

      const aceiteUseCase = new RegistrarAceiteEntregaUseCase(entregavelRepo, auditRepo);
      await aceiteUseCase.execute({
        id: ent.id,
        aceite_status: StatusAceiteEntrega.ACEITO,
        aceite_por: 'Diretoria',
      });

      const removerUseCase = new RemoverEntregavelDemandaUseCase(entregavelRepo, auditRepo);
      await expect(removerUseCase.execute(ent.id)).rejects.toThrow(
        /já possui aceite formal ACEITO/
      );
    });
  });

  describe('AvaliarProntidaoValidacaoUseCase', () => {
    it('deve avaliar prontidão consultando repositórios factuais', async () => {
      const regValUseCase = new RegistrarValidacaoConciliacaoUseCase(validacaoRepo, auditRepo);
      await regValUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Validação 1',
        camada: CamadaValidacao.CONCILIACAO_CRUZADA_KPI,
        metodo_verificacao: 'Check de integridade',
        valor_esperado: 100,
        valor_obtido: 100,
      });

      const regEntUseCase = new RegistrarEntregavelDemandaUseCase(entregavelRepo, auditRepo);
      const ent = await regEntUseCase.execute({
        demanda_id: 'dem_1',
        titulo: 'Entregável 1',
        tipo: TipoEntregavel.DASHBOARD_POWERBI,
        caminho_arquivo_ou_link: '/link',
        status: StatusEntregavel.DISPONIVEL,
      });

      const avaliarUseCase = new AvaliarProntidaoValidacaoUseCase(validacaoRepo, entregavelRepo);
      const res = await avaliarUseCase.execute('dem_1');

      expect(res.total_validacoes).toBe(1);
      expect(res.total_entregaveis).toBe(1);
      expect(res.pronto_para_entrega).toBe(true);
      expect(res.pronto_para_conclusao).toBe(false); // falta aceite
    });
  });
});
