import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrarProblemaManualUseCase } from '@/core/use-cases/quality/registrar-problema-manual.use-case';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IProblemasQualidadeRepository } from '@/core/domain/repositories/problemas-qualidade-repository.interface';
import { ProblemaQualidade } from '@/core/domain/entities/problema-qualidade';
import { CategoriaProblemaQualidade } from '@/core/domain/enums/categoria-problema-qualidade';
import { SeveridadeProblema } from '@/core/domain/enums/severidade-problema';
import { StatusProblemaQualidade } from '@/core/domain/enums/status-problema-qualidade';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { FormatoArquivo } from '@/core/domain/enums/formato-arquivo';
import { StatusAtivoDados } from '@/core/domain/enums/status-ativo-dados';

class InMemoryAtivoDadosRepo implements Partial<IAtivoDadosRepository> {
  private ativos = new Map<string, AtivoDados>();

  async findById(id: string): Promise<AtivoDados | null> {
    return this.ativos.get(id) ?? null;
  }

  set(ativo: AtivoDados) {
    this.ativos.set(ativo.id, ativo);
  }
}

class InMemoryProblemasRepo implements Partial<IProblemasQualidadeRepository> {
  public problemas: ProblemaQualidade[] = [];

  async create(problema: ProblemaQualidade): Promise<ProblemaQualidade> {
    this.problemas.push({ ...problema });
    return problema;
  }

  async createMany(problemas: ProblemaQualidade[]): Promise<ProblemaQualidade[]> {
    this.problemas.push(...problemas);
    return problemas;
  }
}

describe('RegistrarProblemaManualUseCase (Subunidade 3.4B)', () => {
  let ativoRepo: InMemoryAtivoDadosRepo;
  let problemasRepo: InMemoryProblemasRepo;
  let useCase: RegistrarProblemaManualUseCase;

  const ativoId = 'ativo-manual-1';
  const demandaId = 'demanda-manual-1';

  beforeEach(() => {
    ativoRepo = new InMemoryAtivoDadosRepo();
    problemasRepo = new InMemoryProblemasRepo();

    ativoRepo.set({
      id: ativoId,
      demanda_id: demandaId,
      nome_arquivo: 'clientes.csv',
      caminho_local: '/data/clientes.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      substitui_ativo_id: null,
      tamanho_bytes: 2048,
      total_linhas: 100,
      total_colunas: 6,
      hash_sha256: 'hash-xyz',
      schema_inferido: null,
      status: StatusAtivoDados.ATIVO,
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    useCase = new RegistrarProblemaManualUseCase(ativoRepo as any, problemasRepo as any);
  });

  it('deve registrar um problema manual avulso sem diagnóstico vinculado, com severidade invariavelmente PENDENTE', async () => {
    const problema = await useCase.execute({
      ativoDadosId: ativoId,
      demandaId: demandaId,
      titulo: 'Coluna de observação com caracteres corrompidos',
      descricao: 'Foi identificada codificação CP1252 salva indevidamente como UTF-8',
      tabelaAfetada: 'clientes.csv',
      colunaAfetada: 'observacoes',
      totalLinhasAfetadas: 12,
    });

    expect(problema.id).toBeDefined();
    expect(problema.diagnostico_id).toBeNull(); // Sem diagnóstico vinculado
    expect(problema.origem_deteccao).toBe('MANUAL');
    expect(problema.categoria).toBe(CategoriaProblemaQualidade.ANOMALIA_MANUAL_DECLARADA);
    expect(problema.severidade).toBe(SeveridadeProblema.PENDENTE); // Severidade mandatória PENDENTE
    expect(problema.status).toBe(StatusProblemaQualidade.ABERTO);
    expect(problema.total_linhas_afetadas).toBe(12);
    expect(problema.percentual_linhas_afetadas).toBe(12); // 12 / 100 * 100 = 12%
  });

  it('deve registrar um problema manual vinculado a um diagnóstico existente', async () => {
    const diagId = 'diag-execucao-42';

    const problema = await useCase.execute({
      ativoDadosId: ativoId,
      demandaId: demandaId,
      diagnosticoId: diagId,
      categoria: CategoriaProblemaQualidade.NUMEROS_INVALIDOS,
      titulo: 'Inconsistência identificada pelo analista no saldo',
      descricao: 'Saldo negativo em contas do tipo investimento que não permitem cheque especial',
      tabelaAfetada: 'clientes.csv',
      colunaAfetada: 'saldo_investimento',
      totalLinhasAfetadas: 3,
    });

    expect(problema.diagnostico_id).toBe(diagId);
    expect(problema.origem_deteccao).toBe('MANUAL');
    expect(problema.severidade).toBe(SeveridadeProblema.PENDENTE);
    expect(problema.categoria).toBe(CategoriaProblemaQualidade.NUMEROS_INVALIDOS);
  });

  it('deve falhar se o ativo de dados não for encontrado', async () => {
    await expect(
      useCase.execute({
        ativoDadosId: 'ativo-inexistente',
        demandaId: demandaId,
        titulo: 'Erro',
        descricao: 'Desc',
        tabelaAfetada: 'tabela.csv',
      })
    ).rejects.toThrow(/não encontrado/);
  });
});
