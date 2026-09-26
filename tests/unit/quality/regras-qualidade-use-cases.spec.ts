import { describe, it, expect, beforeEach } from 'vitest';
import { CriarRegraQualidadeUseCase } from '@/core/use-cases/quality/criar-regra-qualidade.use-case';
import { AtualizarRegraQualidadeUseCase } from '@/core/use-cases/quality/atualizar-regra-qualidade.use-case';
import { AlternarStatusRegraQualidadeUseCase } from '@/core/use-cases/quality/alternar-status-regra-qualidade.use-case';
import { ListarRegrasQualidadeUseCase } from '@/core/use-cases/quality/listar-regras-qualidade.use-case';
import { IAtivoDadosRepository } from '@/core/domain/repositories/ativo-dados-repository.interface';
import { IRegrasQualidadeRepository } from '@/core/domain/repositories/regras-qualidade-repository.interface';
import { RegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { StatusRegraQualidade } from '@/core/domain/enums/status-regra-qualidade';
import { TipoRegraQualidade } from '@/core/domain/enums/tipo-regra-qualidade';
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

class InMemoryRegrasQualidadeRepo implements IRegrasQualidadeRepository {
  private regras = new Map<string, RegraQualidade>();

  async create(regra: RegraQualidade): Promise<void> {
    this.regras.set(regra.id, { ...regra });
  }

  async findById(id: string): Promise<RegraQualidade | null> {
    const r = this.regras.get(id);
    return r ? { ...r } : null;
  }

  async findByAssetId(ativoDadosId: string, status?: StatusRegraQualidade): Promise<RegraQualidade[]> {
    return Array.from(this.regras.values())
      .filter((r) => r.ativo_dados_id === ativoDadosId && (!status || r.status === status));
  }

  async update(regra: RegraQualidade): Promise<void> {
    this.regras.set(regra.id, { ...regra });
  }
}

describe('Casos de Uso de Regras de Qualidade (Subunidade 3.4B)', () => {
  let ativoRepo: InMemoryAtivoDadosRepo;
  let regrasRepo: InMemoryRegrasQualidadeRepo;
  let criarUseCase: CriarRegraQualidadeUseCase;
  let atualizarUseCase: AtualizarRegraQualidadeUseCase;
  let alternarStatusUseCase: AlternarStatusRegraQualidadeUseCase;
  let listarUseCase: ListarRegrasQualidadeUseCase;

  const ativoId = 'ativo-100';

  beforeEach(() => {
    ativoRepo = new InMemoryAtivoDadosRepo();
    regrasRepo = new InMemoryRegrasQualidadeRepo();

    ativoRepo.set({
      id: ativoId,
      demanda_id: 'dem-100',
      nome_arquivo: 'base.csv',
      caminho_local: '/data/base.csv',
      formato: FormatoArquivo.CSV,
      origem: null,
      descricao_conteudo: null,
      granularidade: null,
      periodo_inicio: null,
      periodo_fim: null,
      versao: 'v1.0',
      substitui_ativo_id: null,
      tamanho_bytes: 1000,
      total_linhas: 50,
      total_colunas: 5,
      hash_sha256: 'hash-abc',
      schema_inferido: null,
      status: StatusAtivoDados.ATIVO,
      data_recebimento: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    });

    criarUseCase = new CriarRegraQualidadeUseCase(ativoRepo as any, regrasRepo);
    atualizarUseCase = new AtualizarRegraQualidadeUseCase(regrasRepo);
    alternarStatusUseCase = new AlternarStatusRegraQualidadeUseCase(regrasRepo);
    listarUseCase = new ListarRegrasQualidadeUseCase(regrasRepo);
  });

  // =========================================================================
  // CRIAÇÃO DE REGRA
  // =========================================================================
  it('toda regra criada nasce invariavelmente ATIVA e na versão 1', async () => {
    const regra = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.VALOR_MIN_MAX,
      coluna: 'idade',
      nome: 'Idade Válida',
      descricao: 'Idade entre 0 e 120 anos',
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 0,
        maximo: 120,
      },
    });

    expect(regra.id).toBeDefined();
    expect(regra.status).toBe(StatusRegraQualidade.ATIVA);
    expect(regra.versao).toBe(1);
    expect(regra.coluna).toBe('idade');
  });

  // =========================================================================
  // CICLO DE VIDA: ATIVA <-> INATIVA (SEM EXCLUSÃO FÍSICA)
  // =========================================================================
  it('deve alternar status no ciclo ATIVA --desativar--> INATIVA e INATIVA --reativar--> ATIVA preservando versão', async () => {
    const criada = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.OBRIGATORIEDADE,
      coluna: 'cpf',
      nome: 'CPF Obrigatório',
      parametros: {
        tipo: TipoRegraQualidade.OBRIGATORIEDADE,
      },
    });

    expect(criada.status).toBe(StatusRegraQualidade.ATIVA);
    expect(criada.versao).toBe(1);

    // 1. Desativar
    const inativada = await alternarStatusUseCase.execute({
      id: criada.id,
      novoStatus: StatusRegraQualidade.INATIVA,
    });
    expect(inativada.status).toBe(StatusRegraQualidade.INATIVA);
    expect(inativada.versao).toBe(1); // Versão preservada

    // 2. Reativar
    const reativada = await alternarStatusUseCase.execute({
      id: criada.id,
      novoStatus: StatusRegraQualidade.ATIVA,
    });
    expect(reativada.status).toBe(StatusRegraQualidade.ATIVA);
    expect(reativada.versao).toBe(1); // Versão preservada
  });

  // =========================================================================
  // VERSIONAMENTO SEMÂNTICO OBRIGATÓRIO VS EDIÇÃO DESCRITIVA
  // =========================================================================
  it('deve incrementar versão quando houver alteração semântica/comportamental nos parâmetros', async () => {
    const criada = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.VALOR_MIN_MAX,
      coluna: 'salario',
      nome: 'Salário Base',
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 1000,
        maximo: 20000,
      },
    });

    expect(criada.versao).toBe(1);

    // Altera o limite máximo de 20000 para 25000 (alteração semântica comportamental)
    const atualizada = await atualizarUseCase.execute({
      id: criada.id,
      parametros: {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: 1000,
        maximo: 25000,
      },
    });

    expect(atualizada.versao).toBe(2); // Versão incrementada!
  });

  it('NÃO deve incrementar versão quando a alteração for exclusivamente descritiva', async () => {
    const criada = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
      coluna: 'categoria',
      nome: 'Categorias de Produto',
      descricao: 'Descrição original',
      parametros: {
        tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
        valoresPermitidos: ['A', 'B', 'C'],
      },
    });

    expect(criada.versao).toBe(1);

    // Altera somente nome e descrição (sem tocar em parâmetros, coluna ou tipo)
    const atualizada = await atualizarUseCase.execute({
      id: criada.id,
      nome: 'Novo Nome Descritivo das Categorias',
      descricao: 'Descrição atualizada com maiores esclarecimentos',
    });

    expect(atualizada.versao).toBe(1); // Preservada versão 1!
    expect(atualizada.nome).toBe('Novo Nome Descritivo das Categorias');
  });

  // =========================================================================
  // LISTAGEM DE REGRAS
  // =========================================================================
  it('deve listar regras filtrando por status ATIVA e INATIVA', async () => {
    const r1 = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.OBRIGATORIEDADE,
      coluna: 'campo1',
      nome: 'Regra 1',
      parametros: { tipo: TipoRegraQualidade.OBRIGATORIEDADE },
    });

    const r2 = await criarUseCase.execute({
      ativoDadosId: ativoId,
      tipo: TipoRegraQualidade.OBRIGATORIEDADE,
      coluna: 'campo2',
      nome: 'Regra 2',
      parametros: { tipo: TipoRegraQualidade.OBRIGATORIEDADE },
    });

    // Inativa r2
    await alternarStatusUseCase.execute({ id: r2.id, novoStatus: StatusRegraQualidade.INATIVA });

    const todas = await listarUseCase.execute({ ativoDadosId: ativoId });
    expect(todas).toHaveLength(2);

    const ativas = await listarUseCase.execute({ ativoDadosId: ativoId, status: StatusRegraQualidade.ATIVA });
    expect(ativas).toHaveLength(1);
    expect(ativas[0].id).toBe(r1.id);

    const inativas = await listarUseCase.execute({ ativoDadosId: ativoId, status: StatusRegraQualidade.INATIVA });
    expect(inativas).toHaveLength(1);
    expect(inativas[0].id).toBe(r2.id);
  });
});
