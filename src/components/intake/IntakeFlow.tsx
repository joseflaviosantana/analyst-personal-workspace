'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Projeto } from '@/core/domain/entities/projeto';
import { ResultadoAnaliseIntake } from '@/core/domain/intake/intake-types';
import { analyzeIntakeAction, confirmIntakeAction } from '@/app/actions/intake-actions';
import { IntakeInputSection } from './IntakeInputSection';
import { IntakeVerbatimCard } from './IntakeVerbatimCard';
import { IntakeFactsSection } from './IntakeFactsSection';
import { IntakeInferencesSection } from './IntakeInferencesSection';
import { IntakeRequirementsClassificationSection } from './IntakeRequirementsClassificationSection';
import { IntakeGapsQuestionsSection, PerguntaDeliberacao } from './IntakeGapsQuestionsSection';
import { IntakeNextActionSection } from './IntakeNextActionSection';
import { IntakeProposalForm } from './IntakeProposalForm';

import { IntakeDataDiscoverySection } from './IntakeDataDiscoverySection';
import { ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface IntakeFlowProps {
  existingProjects: Array<Pick<Projeto, 'id' | 'nome'>>;
  initialText?: string;
}

export function IntakeFlow({ existingProjects, initialText = '' }: IntakeFlowProps) {
  const router = useRouter();

  const [step, setStep] = useState<'INPUT' | 'REVIEW'>('INPUT');
  const [solicitacaoOriginal, setSolicitacaoOriginal] = useState(initialText);
  const [analise, setAnalise] = useState<ResultadoAnaliseIntake | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAuditoriaEpistemica, setShowAuditoriaEpistemica] = useState(false);

  // Estados dos campos de deliberação humana pós-análise
  const [projetoDecisao, setProjetoDecisao] = useState<'NOVO' | 'EXISTENTE'>('NOVO');
  const [novoProjetoNome, setNovoProjetoNome] = useState('');
  const [novoProjetoDescricao, setNovoProjetoDescricao] = useState('');
  const [projetoIdExistente, setProjetoIdExistente] = useState(
    existingProjects.length > 0 ? existingProjects[0].id : ''
  );

  const [demandaTitulo, setDemandaTitulo] = useState('');
  const [demandaObjetivo, setDemandaObjetivo] = useState('');
  const [demandaContexto, setDemandaContexto] = useState('');
  const [demandaPrazo, setDemandaPrazo] = useState('');
  const [demandaRestricoes, setDemandaRestricoes] = useState('');

  const [perguntas, setPerguntas] = useState<PerguntaDeliberacao[]>([]);

  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Ação 1: Analisar Solicitação (Sem persistência)
  const handleAnalisar = async () => {
    if (!solicitacaoOriginal || solicitacaoOriginal.length < 5) {
      setAnalysisError('A solicitação original deve conter no mínimo 5 caracteres.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await analyzeIntakeAction(solicitacaoOriginal);

      if (!res.success || !res.data) {
        setAnalysisError(res.error || 'Erro ao processar análise do texto.');
        return;
      }

      const data = res.data;
      setAnalise(data);

      // Preenchimento dos campos propostos para edição humana (usa objetivo natural se disponível)
      setNovoProjetoNome(data.proposta.projetoSugerido.nome);
      setNovoProjetoDescricao(data.proposta.projetoSugerido.descricao);
      setDemandaTitulo(data.proposta.demandaSugerida.titulo);
      setDemandaObjetivo(data.proposta.demandaSugerida.objetivoNatural || data.proposta.demandaSugerida.objetivoInicial);
      setDemandaContexto(data.proposta.demandaSugerida.contexto);
      setDemandaPrazo(data.proposta.demandaSugerida.prazoEsperado || '');
      setDemandaRestricoes(data.proposta.demandaSugerida.restricoesDeclaradas || '');

      // Inicializa todas as perguntas sugeridas como aceitas por padrão
      setPerguntas(
        data.proposta.perguntasPreliminaresSugeridas.map((p) => ({
          ...p,
          aceita: true,
        }))
      );

      // Avança para a etapa de revisão assistida
      setStep('REVIEW');
    } catch (err: any) {
      setAnalysisError(err?.message || 'Falha inesperada ao analisar solicitação.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Alterna aceitação de pergunta preliminar
  const handleTogglePergunta = (index: number) => {
    setPerguntas((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, aceita: !item.aceita } : item))
    );
  };

  // Permite voltar para o campo bruto preservando o texto digitado
  const handleEditarOriginal = () => {
    setStep('INPUT');
    setConfirmError(null);
  };

  // Ação 2: Confirmação e Materialização Atômica
  const handleConfirmar = async () => {
    if (!demandaTitulo.trim()) {
      setConfirmError('O título da demanda é obrigatório.');
      return;
    }

    if (projetoDecisao === 'NOVO' && (!novoProjetoNome.trim() || novoProjetoNome.trim().length < 3)) {
      setConfirmError('Para criar um novo projeto, informe um nome com no mínimo 3 caracteres.');
      return;
    }

    if (projetoDecisao === 'EXISTENTE' && !projetoIdExistente) {
      setConfirmError('Selecione um projeto existente válido.');
      return;
    }

    setIsConfirming(true);
    setConfirmError(null);

    try {
      // Mapeamento de requisitos propostos pelo Intake (preservando status IDENTIFICADO para revisão humana)
      const requisitosPropostos = (analise?.requisitosClassificados || []).map((r) => {
        let categoria = 'METRICA_KPI';
        const txt = `${r.titulo} ${r.descricao}`.toLowerCase();
        if (txt.includes('produto') || txt.includes('região') || txt.includes('segmento') || txt.includes('dimensão')) {
          categoria = 'DIMENSAO_FILTRO';
        } else if (txt.includes('dashboard') || txt.includes('relatório') || txt.includes('apresentação') || txt.includes('formato')) {
          categoria = 'FORMATO_ENTREGA';
        } else if (txt.includes('regra') || txt.includes('atualização') || txt.includes('período')) {
          categoria = 'REGRA_NEGOCIO';
        }

        return {
          id: r.id,
          titulo: r.titulo,
          descricao: r.descricao || r.justificativaClassificacao || null,
          categoria,
          prioridade: (r.classificacao === 'REQUISITO_ESSENCIAL' ? 'OBRIGATORIO' : 'DESEJAVEL') as 'OBRIGATORIO' | 'DESEJAVEL',
        };
      });

      const intakeSnapshot = analise
        ? JSON.stringify({
            fatos: {
              ativosDados: analise.fatos.ativosDadosMencionados.map((a) => a.termoVerbatim),
              prazo: analise.fatos.prazoMencionado,
              periodo: analise.fatos.periodoJanelaTemporalMencionada?.termoVerbatim || null,
              entregaveis: analise.fatos.entregaveisExplicitamenteSolicitados.map((e) => e.nome),
              indicadores: analise.fatos.indicadoresExplicitamenteMencionados.map((i) => i.nome),
            },
            descobertasDados: {
              dimensoes: analise.inferencias.dimensoesAnaliticasIdentificadas || [],
              itensFaltantesDados: analise.lacunas.itensFaltantes,
            },
            inferenciasCopiloto: {
              dominioNegocio: analise.inferencias.dominioNegocio,
              problemaAparente: analise.inferencias.problemaAparente,
              objetivoProvavel: analise.inferencias.objetivoProvavel,
              indicadoresSugeridos: analise.inferencias.indicadoresSugeridos.map((i) => ({
                nome: i.nome,
                descricao: i.descricao,
              })),
            },
            sinteseProximaAcao: analise.sinteseProximaAcao || null,
            geradoEm: new Date().toISOString(),
          })
        : null;

      const res = await confirmIntakeAction({
        solicitacaoOriginal, // Verbatim preservado byte-a-byte!
        projetoDecisao,
        novoProjeto:
          projetoDecisao === 'NOVO'
            ? {
                nome: novoProjetoNome.trim(),
                descricao: novoProjetoDescricao.trim() || null,
              }
            : null,
        projetoIdExistente: projetoDecisao === 'EXISTENTE' ? projetoIdExistente : null,
        demanda: {
          titulo: demandaTitulo.trim(),
          contexto: demandaContexto.trim() || null,
          objetivo_inicial: demandaObjetivo.trim() || null,
          prazo_esperado: demandaPrazo.trim() || null,
          restricoes_declaradas: demandaRestricoes.trim() || null,
        },
        perguntasPreliminares: perguntas.map((p) => ({
          id: p.id,
          pergunta: p.pergunta,
          motivacao: p.motivacao,
          bloqueante: p.bloqueanteRecomendado,
          aceita: p.aceita,
        })),
        requisitosPropostos,
        intakeSnapshot,
      });

      if (!res.success || !res.data) {
        setConfirmError(res.error || 'Erro ao persistir estrutura de Intake.');
        setIsConfirming(false);
        return;
      }

      // Sucesso: Redireciona para a Aba 2 (Requisitos) da Demanda recém-criada com tag de origem
      const demandaId = res.data.demanda.id;
      router.push(`/demands/${demandaId}?tab=requirements&origem=intake`);
    } catch (err: any) {
      setConfirmError(err?.message || 'Falha ao confirmar submissão.');
      setIsConfirming(false);
    }
  };

  const perguntasAceitasCount = perguntas.filter((p) => p.aceita).length;

  return (
    <div className="space-y-8" data-testid="intake-flow-container">
      {step === 'INPUT' && (
        <IntakeInputSection
          solicitacao={solicitacaoOriginal}
          onChangeSolicitacao={setSolicitacaoOriginal}
          onAnalisar={handleAnalisar}
          isAnalyzing={isAnalyzing}
          error={analysisError}
        />
      )}

      {step === 'REVIEW' && analise && (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
          {/* 1. O cliente pediu */}
          <IntakeVerbatimCard
            solicitacaoOriginal={solicitacaoOriginal}
            onEditarOriginal={handleEditarOriginal}
          />

          {/* 2. Já sabemos */}
          <IntakeFactsSection fatos={analise.fatos} />

          {/* 3. Precisamos perguntar */}
          <IntakeGapsQuestionsSection
            lacunas={analise.lacunas.itensFaltantes}
            perguntas={perguntas}
            onTogglePergunta={handleTogglePergunta}
            demandaTitulo={demandaTitulo}
          />

          {/* 4. Vamos descobrir nos dados */}
          <IntakeDataDiscoverySection analise={analise} />

          {/* 5. Sugestões do Copiloto */}
          <IntakeInferencesSection inferencias={analise.inferencias} />

          {/* 6. Próximo passo */}
          {analise.sinteseProximaAcao && (
            <IntakeNextActionSection sintese={analise.sinteseProximaAcao} />
          )}

          {/* Divulgação Progressiva: Auditoria Epistemológica Completa (ADR-001/002) */}
          {analise.requisitosClassificados && analise.requisitosClassificados.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Auditoria Epistemológica Completa (ADR-001 / ADR-002)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuditoriaEpistemica(!showAuditoriaEpistemica)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-800/50 rounded-lg transition-colors"
                >
                  <span>{showAuditoriaEpistemica ? 'Ocultar detalhes' : 'Ver classificação detalhada'}</span>
                  {showAuditoriaEpistemica ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>

              {showAuditoriaEpistemica && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <IntakeRequirementsClassificationSection
                    requisitos={analise.requisitosClassificados}
                  />
                </div>
              )}
            </div>
          )}

          {/* 7. Criar Demanda e Projeto */}
          <IntakeProposalForm
            existingProjects={existingProjects}
            projetoDecisao={projetoDecisao}
            onChangeProjetoDecisao={setProjetoDecisao}
            novoProjetoNome={novoProjetoNome}
            onChangeNovoProjetoNome={setNovoProjetoNome}
            novoProjetoDescricao={novoProjetoDescricao}
            onChangeNovoProjetoDescricao={setNovoProjetoDescricao}
            projetoIdExistente={projetoIdExistente}
            onChangeProjetoIdExistente={setProjetoIdExistente}
            demandaTitulo={demandaTitulo}
            onChangeDemandaTitulo={setDemandaTitulo}
            demandaObjetivo={demandaObjetivo}
            onChangeDemandaObjetivo={setDemandaObjetivo}
            demandaContexto={demandaContexto}
            onChangeDemandaContexto={setDemandaContexto}
            demandaPrazo={demandaPrazo}
            onChangeDemandaPrazo={setDemandaPrazo}
            demandaRestricoes={demandaRestricoes}
            onChangeDemandaRestricoes={setDemandaRestricoes}
            perguntasAceitasCount={perguntasAceitasCount}
            onConfirmar={handleConfirmar}
            isConfirming={isConfirming}
            confirmError={confirmError}
          />
        </div>
      )}
    </div>
  );
}
