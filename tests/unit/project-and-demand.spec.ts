import { describe, it, expect, beforeEach } from 'vitest';
import { CreateProjectUseCase } from '@/core/use-cases/projects/create-project';
import { UpdateProjectUseCase } from '@/core/use-cases/projects/update-project';
import { CreateDemandUseCase } from '@/core/use-cases/demands/create-demand';
import { UpdateDemandUseCase } from '@/core/use-cases/demands/update-demand';
import { EstadoDemanda } from '@/core/domain/enums/estado-demanda';
import { Projeto, ProjetoComContadores } from '@/core/domain/entities/projeto';
import { Demanda, DemandaComProjeto } from '@/core/domain/entities/demanda';
import { IProjectRepository } from '@/core/domain/repositories/project-repository.interface';
import { IDemandRepository } from '@/core/domain/repositories/demand-repository.interface';

// In-Memory Mock Repositories para testes unitários puros sem I/O
class MockProjectRepository implements IProjectRepository {
  public projects: Map<string, Projeto> = new Map();

  async create(project: Projeto): Promise<Projeto> {
    this.projects.set(project.id, { ...project });
    return project;
  }

  async findById(id: string): Promise<Projeto | null> {
    const p = this.projects.get(id);
    return p ? { ...p } : null;
  }

  async findAll(): Promise<ProjetoComContadores[]> {
    return Array.from(this.projects.values()).map((p) => ({
      ...p,
      totalDemandas: 0,
      demandasAtivas: 0,
    }));
  }

  async update(id: string, data: Partial<Projeto>): Promise<Projeto | null> {
    const existing = this.projects.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, atualizado_em: new Date().toISOString() };
    this.projects.set(id, updated);
    return updated;
  }

  async countActive(): Promise<number> {
    return Array.from(this.projects.values()).filter((p) => p.status === 'ATIVO').length;
  }

  async countTotal(): Promise<number> {
    return this.projects.size;
  }

  async countDemands(_projectId: string): Promise<number> {
    return 0;
  }

  async delete(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }
}

class MockDemandRepository implements IDemandRepository {
  public demands: Map<string, Demanda> = new Map();

  async create(demand: Demanda): Promise<Demanda> {
    this.demands.set(demand.id, { ...demand });
    return demand;
  }

  async findById(id: string): Promise<DemandaComProjeto | null> {
    const d = this.demands.get(id);
    if (!d) return null;
    return { ...d, projetoNome: 'Projeto Mock' };
  }

  async findByProjectId(projectId: string): Promise<Demanda[]> {
    return Array.from(this.demands.values()).filter((d) => d.projeto_id === projectId);
  }

  async findAll(): Promise<DemandaComProjeto[]> {
    return Array.from(this.demands.values()).map((d) => ({
      ...d,
      projetoNome: 'Projeto Mock',
    }));
  }

  async findRecent(_limit: number): Promise<DemandaComProjeto[]> {
    return this.findAll();
  }

  async update(id: string, data: Partial<Demanda>): Promise<Demanda | null> {
    const existing = this.demands.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, atualizado_em: new Date().toISOString() };
    this.demands.set(id, updated);
    return updated;
  }

  async countActive(): Promise<number> {
    return Array.from(this.demands.values()).filter(
      (d) => d.estado !== EstadoDemanda.CONCLUIDA && d.estado !== EstadoDemanda.CANCELADA
    ).length;
  }

  async countTotal(): Promise<number> {
    return this.demands.size;
  }
}

describe('Unit Tests: Regras de Domínio e Casos de Uso (Bloco 1)', () => {
  let projectRepo: MockProjectRepository;
  let demandRepo: MockDemandRepository;
  let createProject: CreateProjectUseCase;
  let updateProject: UpdateProjectUseCase;
  let createDemand: CreateDemandUseCase;
  let updateDemand: UpdateDemandUseCase;

  beforeEach(() => {
    projectRepo = new MockProjectRepository();
    demandRepo = new MockDemandRepository();
    createProject = new CreateProjectUseCase(projectRepo);
    updateProject = new UpdateProjectUseCase(projectRepo);
    createDemand = new CreateDemandUseCase(demandRepo, projectRepo);
    updateDemand = new UpdateDemandUseCase(demandRepo);
  });

  it('deve realizar a criação válida de Projeto com timestamps e ID', async () => {
    const proj = await createProject.execute({
      nome: 'BI Financeiro 2026',
      descricao: 'Estruturação do fluxo financeiro',
      status: 'ATIVO',
    });

    expect(proj.id).toBeDefined();
    expect(proj.id).toContain('proj_');
    expect(proj.nome).toBe('BI Financeiro 2026');
    expect(proj.status).toBe('ATIVO');
    expect(proj.criado_em).toBeDefined();
    expect(proj.atualizado_em).toBeDefined();
  });

  it('deve rejeitar Projeto com nome inválido (menos de 3 caracteres)', async () => {
    await expect(
      createProject.execute({
        nome: 'AB',
      })
    ).rejects.toThrow();
  });

  it('deve realizar a criação válida de Demanda vinculada a Projeto existente', async () => {
    const proj = await createProject.execute({
      nome: 'Projeto Logística',
    });

    const dem = await createDemand.execute({
      projeto_id: proj.id,
      titulo: 'Análise de Rotas de Entrega',
      solicitacao_bruta: 'Solicito relatório de divergências de prazos de entrega do Q2.',
    });

    expect(dem.id).toBeDefined();
    expect(dem.id).toContain('dem_');
    expect(dem.projeto_id).toBe(proj.id);
    expect(dem.titulo).toBe('Análise de Rotas de Entrega');
    expect(dem.estado).toBe(EstadoDemanda.NOVA);
  });

  it('deve garantir que o estado inicial de qualquer Demanda seja estritamente NOVA', async () => {
    const proj = await createProject.execute({ nome: 'Projeto Vendas' });
    const dem = await createDemand.execute({
      projeto_id: proj.id,
      titulo: 'Dashboard Executivo de Vendas',
      solicitacao_bruta: 'Necessitamos de visão consolidada mensal de vendas.',
    });

    expect(dem.estado).toBe(EstadoDemanda.NOVA);
  });

  it('deve rejeitar criação de Demanda sem Projeto válido existente', async () => {
    await expect(
      createDemand.execute({
        projeto_id: 'projeto_inexistente_123',
        titulo: 'Demanda Órfã Inválida',
        solicitacao_bruta: 'Texto bruto de teste.',
      })
    ).rejects.toThrow(/não existe/);
  });

  it('deve atualizar Projeto com sucesso', async () => {
    const proj = await createProject.execute({ nome: 'Projeto Original' });
    const updated = await updateProject.execute(proj.id, {
      nome: 'Projeto Nome Alterado',
      status: 'PAUSADO',
    });

    expect(updated.nome).toBe('Projeto Nome Alterado');
    expect(updated.status).toBe('PAUSADO');
  });

  it('deve atualizar Demanda com sucesso', async () => {
    const proj = await createProject.execute({ nome: 'Projeto Ativo' });
    const dem = await createDemand.execute({
      projeto_id: proj.id,
      titulo: 'Demanda Título Original',
      solicitacao_bruta: 'Solicitação original de teste.',
    });

    const updated = await updateDemand.execute(dem.id, {
      titulo: 'Demanda Título Atualizado',
      contexto: 'Contexto de negócio adicionado posteriormente',
    });

    expect(updated.titulo).toBe('Demanda Título Atualizado');
    expect(updated.contexto).toBe('Contexto de negócio adicionado posteriormente');
  });

  it('deve impedir atualização de Demanda no estado CANCELADA (congelamento de histórico)', async () => {
    const proj = await createProject.execute({ nome: 'Projeto Ativo' });
    const dem = await createDemand.execute({
      projeto_id: proj.id,
      titulo: 'Demanda Cancelada',
      solicitacao_bruta: 'Solicitação que será cancelada.',
    });

    // Simula estado cancelado na persistência
    await demandRepo.update(dem.id, {
      estado: EstadoDemanda.CANCELADA,
      data_conclusao: new Date().toISOString(),
    });

    await expect(
      updateDemand.execute(dem.id, {
        titulo: 'Tentativa Ilegal de Alteração',
      })
    ).rejects.toThrow(/Demandas canceladas possuem histórico congelado/);
  });

  it('deve impedir atualização de Demanda no estado CONCLUIDA (congelamento de histórico)', async () => {
    const proj = await createProject.execute({ nome: 'Projeto Ativo' });
    const dem = await createDemand.execute({
      projeto_id: proj.id,
      titulo: 'Demanda Concluída',
      solicitacao_bruta: 'Solicitação que será concluída.',
    });

    // Simula estado concluído na persistência
    await demandRepo.update(dem.id, {
      estado: EstadoDemanda.CONCLUIDA,
      data_conclusao: new Date().toISOString(),
    });

    await expect(
      updateDemand.execute(dem.id, {
        titulo: 'Tentativa Ilegal de Alteração em Demanda Concluída',
      })
    ).rejects.toThrow(/Demandas concluídas possuem histórico congelado/);
  });

  it('deve tratar e lançar erro ao tentar atualizar identificador inexistente', async () => {
    await expect(
      updateProject.execute('id_projeto_inexistente', { nome: 'Novo Nome' })
    ).rejects.toThrow(/não foi encontrado/);

    await expect(
      updateDemand.execute('id_demanda_inexistente', { titulo: 'Novo Título' })
    ).rejects.toThrow(/não foi encontrada/);
  });
});
