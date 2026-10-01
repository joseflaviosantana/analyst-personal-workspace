import { describe, it, expect } from 'vitest';
import { EvidenceEventEngine } from '@/core/domain/evidence-events/evidence-event-engine';
import { EventoAnalitico } from '@/core/domain/evidence-events/event-types';
import { QualidadeRegraStrategy } from '@/core/domain/evidence-events/default-strategies/qualidade-regra-strategy';
import { DecisaoMetodologicaStrategy } from '@/core/domain/evidence-events/default-strategies/decisao-metodologica-strategy';
import { EventoTecnicoIgnoradoStrategy } from '@/core/domain/evidence-events/default-strategies/evento-tecnico-ignorado-strategy';
import { IEstrategiaProcessamentoEvento } from '@/core/domain/evidence-events/event-strategy.interface';
import { EtapaOrigemEvidencia } from '@/core/domain/enums/etapa-origem-evidencia';
import { ClassificacaoExposicaoEvidencia } from '@/core/domain/enums/classificacao-exposicao-evidencia';
import { TipoEvidenciaAnalitica } from '@/core/domain/enums/tipo-evidencia-analitica';

describe('Evidence Event Engine: Núcleo de Processamento & Políticas de Captura (Subgate 3.5B.1)', () => {
  const engine = new EvidenceEventEngine([
    new QualidadeRegraStrategy(),
    new DecisaoMetodologicaStrategy(),
    new EventoTecnicoIgnoradoStrategy(),
  ]);

  it('2. evento objetivo elegível gera candidato a evidência corretamente', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt-qualidade-10',
      demanda_id: 'dem-01',
      projeto_id: 'prj-01',
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_REGRA_EXECUTADA',
      ocorrido_em: '2026-09-30T10:00:00Z',
      executor: 'SISTEMA_DETERMINISTICO',
      artefato_origem_tipo: 'REGRA_QUALIDADE',
      artefato_origem_id: 'regra-cpf-valido',
      payload: {
        regraNome: 'Validação de CPF',
        ativoNome: 'Clientes_Raw',
        totalLinhasAvaliadas: 5000,
        totalNaoConformidades: 0,
        taxaConformidade: 100,
      },
      correlation_id: 'corr-xyz-123',
      causation_id: 'caus-abc-456',
      versao_contrato: '1.0',
    };

    const { candidato, decisao } = engine.gerarCandidatoEvidencia(evento);

    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(decisao.requer_intervencao_humana).toBe(false);

    expect(candidato).not.toBeNull();
    expect(candidato?.titulo).toContain('Validação de CPF');
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.QUALIDADE);
    expect(candidato?.etapa_origem).toBe(EtapaOrigemEvidencia.QUALIDADE);
    expect(candidato?.resultado_mensuravel).toContain('Taxa = 100%');
    expect(candidato?.elegibilidade_portfolio).toBe(true);

    // 6, 7, 8. Proveniência e IDs de correlação/causação preservados
    expect(candidato?.metadados_adicionais?.evento_origem_id).toBe('evt-qualidade-10');
    expect(candidato?.metadados_adicionais?.correlation_id).toBe('corr-xyz-123');
    expect(candidato?.metadados_adicionais?.causation_id).toBe('caus-abc-456');
    expect(candidato?.metadados_adicionais?.politica_captura_aplicada).toBe('REGISTRAR_AUTOMATICAMENTE');
  });

  it('3. evento interpretativo exige revisão humana', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt-metodologia-20',
      demanda_id: 'dem-01',
      etapa_origem: EtapaOrigemEvidencia.MODELAGEM,
      categoria: 'MODELAGEM',
      tipo_evento: 'DECISAO_METODOLOGICA_REGISTRADA',
      ocorrido_em: '2026-09-30T10:15:00Z',
      executor: 'ANALISTA',
      payload: {
        tituloDecisao: 'Adoção de Chave Substituta para Dimensão Cliente',
        contextoProblema: 'Clientes mudam de filial e alteram chave de negócio natural',
        escolhaAdotada: 'Criação de surrogate key inteira sequencial (sk_cliente)',
        justificativaMetodologica: 'Isolar fato de mutações operacionais de cadastro',
      },
      versao_contrato: '1.0',
    };

    const { candidato, decisao } = engine.gerarCandidatoEvidencia(evento);

    expect(decisao.politica).toBe('SOLICITAR_REVISAO_HUMANA');
    expect(decisao.requer_intervencao_humana).toBe(true);
    expect(candidato).not.toBeNull();
    expect(candidato?.titulo).toContain('Adoção de Chave Substituta');
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.REVISAO);
    expect(candidato?.elegibilidade_portfolio).toBe(false); // Inicia falso até deliberação
  });

  it('4. evento irrelevante é ignorado deterministicamente', () => {
    const evento: EventoAnalitico = {
      id_evento: 'evt-telemetria-30',
      demanda_id: 'dem-01',
      etapa_origem: EtapaOrigemEvidencia.GERAL,
      categoria: 'SISTEMA',
      tipo_evento: 'SISTEMA_LOG_TELEMETRIA',
      ocorrido_em: '2026-09-30T10:20:00Z',
      executor: 'SISTEMA_LOCAL',
      payload: { ping: 'pong', ms: 12 },
      versao_contrato: '1.0',
    };

    const { candidato, decisao } = engine.gerarCandidatoEvidencia(evento);

    expect(decisao.politica).toBe('IGNORAR');
    expect(decisao.motivo).toContain('sem valor factual para auditoria');
    expect(candidato).toBeNull();
  });

  it('5. evento incompleto não produz fato inventado (Rigor Epistêmico)', () => {
    const eventoIncompleto: EventoAnalitico = {
      id_evento: 'evt-qualidade-incompleto',
      demanda_id: 'dem-01',
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_REGRA_EXECUTADA',
      ocorrido_em: '2026-09-30T10:25:00Z',
      executor: 'SISTEMA',
      payload: {
        // Faltam regraNome, totalLinhasAvaliadas, taxaConformidade
        descricaoIncompleta: 'Evento corrompido sem métricas numéricas',
      },
      versao_contrato: '1.0',
    };

    const { candidato, decisao } = engine.gerarCandidatoEvidencia(eventoIncompleto);

    expect(candidato).toBeNull();
    expect(decisao.politica).toBe('IGNORAR');
  });

  it('9. classificação confidencial não vira portfólio (Salvaguarda de Segredos)', () => {
    const eventoConfidencial: EventoAnalitico = {
      id_evento: 'evt-confidencial-40',
      demanda_id: 'dem-01',
      etapa_origem: EtapaOrigemEvidencia.QUALIDADE,
      categoria: 'QUALIDADE',
      tipo_evento: 'QUALIDADE_REGRA_EXECUTADA',
      ocorrido_em: '2026-09-30T10:30:00Z',
      executor: 'SISTEMA',
      payload: {
        regraNome: 'Auditoria de Remuneração Executiva',
        ativoNome: 'Folha_Salarial_Confidencial',
        totalLinhasAvaliadas: 50,
        totalNaoConformidades: 0,
        taxaConformidade: 100, // 100% de conformidade, porém CONFIDENCIAL!
        classificacaoExposicao: ClassificacaoExposicaoEvidencia.CONFIDENCIAL,
      },
      versao_contrato: '1.0',
    };

    const { candidato } = engine.gerarCandidatoEvidencia(eventoConfidencial);

    expect(candidato).not.toBeNull();
    expect(candidato?.classificacao_exposicao).toBe(ClassificacaoExposicaoEvidencia.CONFIDENCIAL);
    expect(candidato?.elegibilidade_portfolio).toBe(false); // Rigorosamente bloqueado de portfólio!
  });

  it('11. estratégia plugável funciona dinamicamente sem alterar o núcleo da engine', () => {
    const engineCustom = new EvidenceEventEngine();

    // Estratégia customizada plugável (simulando extensão futura para DAX / Bloco 3.5B.4)
    const estrategiaCustomDAX: IEstrategiaProcessamentoEvento = {
      codigo: 'ESTRATEGIA_DAX_KPI_HOMOLOGADO',
      tiposSuportados: ['DAX_KPI_HOMOLOGADO'],
      avaliar: () => ({
        politica: 'REGISTRAR_AUTOMATICAMENTE',
        motivo: 'Medida KPI consolidada com fórmula certificada.',
        requer_intervencao_humana: false,
      }),
      transformar: (evt) => ({
        tipo: TipoEvidenciaAnalitica.DAX,
        etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
        titulo: `Medida Certificada: ${(evt.payload as any).nomeMedida}`,
        descricao: 'Fórmula DAX de alta relevância para a tomada de decisão.',
        fato_observado: `Expressão DAX: ${(evt.payload as any).expressao}`,
        acao_registrada: 'Validação sintática e de contexto de filtro.',
        classificacao_exposicao: ClassificacaoExposicaoEvidencia.INTERNA,
        elegibilidade_portfolio: false,
      }),
    };

    engineCustom.registrarEstrategia(estrategiaCustomDAX);

    const eventoDax: EventoAnalitico = {
      id_evento: 'evt-custom-dax-1',
      demanda_id: 'dem-01',
      etapa_origem: EtapaOrigemEvidencia.POWERBI_DASHBOARD,
      categoria: 'DAX',
      tipo_evento: 'DAX_KPI_HOMOLOGADO',
      ocorrido_em: '2026-09-30T10:45:00Z',
      executor: 'ANALISTA',
      payload: {
        nomeMedida: 'Margem EBITDA %',
        expressao: 'DIVIDE([EBITDA], [Receita Bruta])',
      },
      versao_contrato: '1.0',
    };

    const { candidato, decisao } = engineCustom.gerarCandidatoEvidencia(eventoDax);

    expect(decisao.politica).toBe('REGISTRAR_AUTOMATICAMENTE');
    expect(candidato?.titulo).toBe('Medida Certificada: Margem EBITDA %');
    expect(candidato?.tipo).toBe(TipoEvidenciaAnalitica.DAX);
  });

  it('12. contexto e evento com campos obrigatórios ausentes falha de forma segura', () => {
    expect(() => {
      engine.gerarCandidatoEvidencia({} as any);
    }).toThrow('Evento analítico inválido: "id_evento" é obrigatório.');

    expect(() => {
      engine.gerarCandidatoEvidencia({ id_evento: '123' } as any);
    }).toThrow('Evento analítico inválido: "demanda_id" é obrigatório.');
  });
});
