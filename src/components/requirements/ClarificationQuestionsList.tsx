'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Plus,
  Send,
  MessageSquareCheck,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
  Ban,
  X,
  Loader2,
  FileQuestion,
  UserCheck,
} from 'lucide-react';
import { PerguntaClarificacao } from '@/core/domain/entities/pergunta-clarificacao';
import {
  StatusPerguntaClarificacao,
  ROTULOS_STATUS_PERGUNTA,
} from '@/core/domain/enums/status-pergunta-clarificacao';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  criarPerguntaClarificacaoAction,
  atualizarPerguntaClarificacaoAction,
  despacharPerguntaClarificacaoAction,
  registrarRespostaContratanteAction,
  removerPerguntaClarificacaoAction,
} from '@/app/actions/requirements-actions';

interface ClarificationQuestionsListProps {
  demandaId: string;
  demandaTitulo: string;
  perguntas: PerguntaClarificacao[];
  isReadOnly: boolean;
  onRefresh: () => void;
}

export function ClarificationQuestionsList({
  demandaId,
  demandaTitulo,
  perguntas,
  isReadOnly,
  onRefresh,
}: ClarificationQuestionsListProps) {
  // Modal Adicionar/Editar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPergunta, setEditingPergunta] = useState<PerguntaClarificacao | null>(null);
  const [perguntaTexto, setPerguntaTexto] = useState('');
  const [motivacao, setMotivacao] = useState('');
  const [bloqueante, setBloqueante] = useState(false);

  // Modal Registrar Resposta
  const [isAnswerModalOpen, setIsAnswerModalOpen] = useState(false);
  const [selectedForAnswer, setSelectedForAnswer] = useState<PerguntaClarificacao | null>(null);
  const [respostaTexto, setRespostaTexto] = useState('');
  const [respondidoPor, setRespondidoPor] = useState('');
  const [impactoDecisao, setImpactoDecisao] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleOpenAdd = () => {
    setEditingPergunta(null);
    setPerguntaTexto('');
    setMotivacao('');
    setBloqueante(false);
    setError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perguntaTexto.trim() || perguntaTexto.trim().length < 5) {
      setError('A pergunta deve conter ao menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingPergunta) {
        const res = await atualizarPerguntaClarificacaoAction({
          id: editingPergunta.id,
          demandaId,
          pergunta: perguntaTexto,
          motivacao,
          bloqueante,
        });
        if (!res.success) throw new Error(res.error);
      } else {
        const res = await criarPerguntaClarificacaoAction({
          demandaId,
          pergunta: perguntaTexto,
          motivacao,
          bloqueante,
        });
        if (!res.success) throw new Error(res.error);
      }

      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar pergunta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      const res = await despacharPerguntaClarificacaoAction(id, demandaId);
      if (!res.success) alert(res.error);
      else onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Erro ao despachar pergunta.');
    }
  };

  const handleOpenAnswer = (p: PerguntaClarificacao) => {
    setSelectedForAnswer(p);
    setRespostaTexto(p.resposta || '');
    setRespondidoPor(p.respondido_por || '');
    setImpactoDecisao(p.impacto_decisao || '');
    setError(null);
    setIsAnswerModalOpen(true);
  };

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForAnswer) return;
    if (!respostaTexto.trim() || respostaTexto.trim().length < 3) {
      setError('A resposta deve conter ao menos 3 caracteres.');
      return;
    }
    if (!respondidoPor.trim()) {
      setError('Informe quem forneceu a resposta (stakeholder/solicitante).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await registrarRespostaContratanteAction({
        perguntaId: selectedForAnswer.id,
        demandaId,
        resposta: respostaTexto,
        respondidoPor,
        impactoDecisao,
      });

      if (!res.success) throw new Error(res.error);

      setIsAnswerModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar resposta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta pergunta?')) return;
    try {
      const res = await removerPerguntaClarificacaoAction(id, demandaId);
      if (!res.success) alert(res.error);
      else onRefresh();
    } catch (err: any) {
      alert(err?.message || 'Erro ao remover pergunta.');
    }
  };

  /**
   * Gera roteiro profissional de alinhamento com o contratante.
   * REGRA VINCULANTE: Não menciona "Analyst Personal Workspace" em nenhuma hipótese.
   */
  const handleCopyScript = () => {
    const pendentes = perguntas.filter(
      (p) =>
        p.status === StatusPerguntaClarificacao.RASCUNHO ||
        p.status === StatusPerguntaClarificacao.ENVIADA
    );

    if (pendentes.length === 0) {
      alert('Não há perguntas pendentes de clarificação para compor o roteiro.');
      return;
    }

    const lines: string[] = [
      `Prezados,`,
      ``,
      `Para darmos seguimento com precisão ao desenvolvimento da demanda "${demandaTitulo}", identificamos alguns pontos de alinhamento técnico e de negócio:`,
      ``,
    ];

    pendentes.forEach((p, idx) => {
      const tagBloq = p.bloqueante ? ' [CRÍTICO / BLOQUEANTE]' : '';
      lines.push(`${idx + 1}. ${p.pergunta}${tagBloq}`);
      if (p.motivacao) {
        lines.push(`   Motivo do alinhamento: ${p.motivacao}`);
      }
      lines.push(``);
    });

    lines.push(`Agradecemos pelo retorno para que possamos assegurar a conformidade dos dados e entregáveis.`);
    lines.push(``);
    lines.push(`Atenciosamente,`);
    lines.push(`Equipe de Analytics`);

    const fullScript = lines.join('\n');
    navigator.clipboard.writeText(fullScript);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  const getStatusBadge = (st: StatusPerguntaClarificacao) => {
    switch (st) {
      case StatusPerguntaClarificacao.RASCUNHO:
        return (
          <Badge variant="neutral" className="text-[10px]">
            <Clock className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_PERGUNTA[st]}
          </Badge>
        );
      case StatusPerguntaClarificacao.ENVIADA:
        return (
          <Badge variant="warning" className="text-[10px]">
            <Send className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_PERGUNTA[st]}
          </Badge>
        );
      case StatusPerguntaClarificacao.RESPONDIDA:
        return (
          <Badge variant="success" className="text-[10px]">
            <MessageSquareCheck className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_PERGUNTA[st]}
          </Badge>
        );
      case StatusPerguntaClarificacao.DESCARTADA:
        return (
          <Badge variant="disabled" className="text-[10px]">
            <Ban className="h-3 w-3 mr-1 inline" />
            {ROTULOS_STATUS_PERGUNTA[st]}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4" data-testid="clarification-questions-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-cyan-400" />
            <span>Perguntas de Clarificação ao Contratante</span>
            <span className="text-xs font-normal text-slate-400">
              ({perguntas.length})
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Dúvidas de negócio, ambiguidade de termos e definição de regras com o solicitante.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Copiar Roteiro Externo */}
          <button
            type="button"
            onClick={handleCopyScript}
            data-testid="btn-copy-script"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Copiar roteiro estruturado para envio por e-mail ou mensagem ao solicitante"
          >
            {copiedSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-cyan-400" />
                <span>Copiar Roteiro</span>
              </>
            )}
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={handleOpenAdd}
              data-testid="btn-add-question"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Pergunta</span>
            </button>
          )}
        </div>
      </div>

      {/* Lista de Perguntas */}
      {perguntas.length === 0 ? (
        <Card className="p-8 text-center bg-slate-900/40 border-dashed border-slate-800">
          <FileQuestion className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-400">
            Nenhuma pergunta de clarificação formulada.
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Se houver termos ambíguos ou fontes indefinidas na solicitação bruta, registre perguntas para formalizar o alinhamento.
          </p>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="questions-list">
          {perguntas.map((p) => (
            <Card
              key={p.id}
              className="p-4 bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all"
              data-testid={`question-card-${p.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(p.status)}
                    {p.bloqueante && (
                      <Badge variant="warning" className="text-[10px] bg-rose-950/60 text-rose-300 border-rose-800">
                        <AlertTriangle className="h-3 w-3 mr-1 inline" />
                        Bloqueante para Dados
                      </Badge>
                    )}
                    {p.enviada_em && (
                      <span className="text-[11px] text-slate-500">
                        Enviada em: {new Date(p.enviada_em).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-200 leading-snug">
                    {p.pergunta}
                  </p>

                  {p.motivacao && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 font-medium">Motivação analítica:</strong> {p.motivacao}
                    </p>
                  )}

                  {/* Resposta Registrada */}
                  {p.status === StatusPerguntaClarificacao.RESPONDIDA && (
                    <div className="mt-2.5 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                      <div className="flex items-center gap-1.5 font-medium text-emerald-400 mb-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Resposta de {p.respondido_por || 'Contratante'} ({p.respondida_em ? new Date(p.respondida_em).toLocaleDateString('pt-BR') : ''}):</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {p.resposta}
                      </p>
                      {p.impacto_decisao && (
                        <p className="mt-1.5 text-[11px] text-emerald-400/90 border-t border-emerald-900/40 pt-1">
                          <strong>Impacto no escopo:</strong> {p.impacto_decisao}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                {!isReadOnly && (
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                    {p.status === StatusPerguntaClarificacao.RASCUNHO && (
                      <button
                        type="button"
                        onClick={() => handleDispatch(p.id)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-slate-700 border border-slate-700"
                        title="Marcar como enviada ao contratante"
                      >
                        <Send className="h-3 w-3" />
                        <span>Enviar</span>
                      </button>
                    )}

                    {(p.status === StatusPerguntaClarificacao.RASCUNHO ||
                      p.status === StatusPerguntaClarificacao.ENVIADA) && (
                      <button
                        type="button"
                        onClick={() => handleOpenAnswer(p)}
                        className="inline-flex items-center gap-1 rounded bg-emerald-900/50 px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-800/60 border border-emerald-800"
                        title="Registrar resposta recebida do contratante"
                      >
                        <MessageSquareCheck className="h-3 w-3" />
                        <span>Registrar Resposta</span>
                      </button>
                    )}

                    {p.status === StatusPerguntaClarificacao.RASCUNHO && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Remover pergunta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Nova / Editar Pergunta */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-cyan-400" />
                <span>Nova Pergunta de Clarificação</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pergunta ao Contratante *
                </label>
                <textarea
                  required
                  value={perguntaTexto}
                  onChange={(e) => setPerguntaTexto(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="Ex.: O indicador de faturamento considera pedidos faturados ou cancelamentos posteriores?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Motivação / Contexto Analítico
                </label>
                <input
                  type="text"
                  value={motivacao}
                  onChange={(e) => setMotivacao(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="Ex.: Necessário para definir a regra de filtro no pipeline de preparação."
                />
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bloqueante}
                    onChange={(e) => setBloqueante(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold block">Pergunta Bloqueante para Dados</span>
                    <span className="text-[11px] text-slate-400">
                      Se marcada, impede o avanço para a etapa de Dados até que uma resposta seja formalmente registrada.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Salvar Pergunta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Resposta do Contratante */}
      {isAnswerModalOpen && selectedForAnswer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <MessageSquareCheck className="h-4 w-4 text-emerald-400" />
                <span>Registrar Resposta do Contratante</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAnswerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Pergunta:
              </span>
              <p>{selectedForAnswer.pergunta}</p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveAnswer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Resposta do Contratante *
                </label>
                <textarea
                  required
                  value={respostaTexto}
                  onChange={(e) => setRespostaTexto(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Registre a resposta exata fornecida pelo solicitante..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Respondido Por (Nome / Cargo do Stakeholder) *
                </label>
                <input
                  type="text"
                  required
                  value={respondidoPor}
                  onChange={(e) => setRespondidoPor(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex.: Mariana Silva (Gerente Comercial)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Impacto no Escopo / Decisão Técnica
                </label>
                <input
                  type="text"
                  value={impactoDecisao}
                  onChange={(e) => setImpactoDecisao(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                  placeholder="Ex.: Criada regra no pipeline para filtrar status 'CANCELADO'."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAnswerModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Registrar Resposta e Emitir Evidência</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
