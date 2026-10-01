'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { AtivoAprendizado } from '@/core/domain/entities/ativo-aprendizado';
import {
  CategoriaAtivoAprendizado,
  ROTULOS_CATEGORIA_ATIVO_APRENDIZADO,
} from '@/core/domain/enums/categoria-ativo-aprendizado';
import {
  BookOpen,
  Plus,
  Code2,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Filter,
  X,
} from 'lucide-react';

interface LearnedAssetsSectionProps {
  ativos: AtivoAprendizado[];
  disabled?: boolean;
  onCurarAtivo: (input: {
    titulo: string;
    categoria: CategoriaAtivoAprendizado;
    descricao?: string;
    procedimento_padrao: string;
    contexto_aplicacao?: string;
    tags?: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export function LearnedAssetsSection({
  ativos,
  disabled = false,
  onCurarAtivo,
  isLoading = false,
}: LearnedAssetsSectionProps) {
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaAtivoAprendizado>(CategoriaAtivoAprendizado.DAX);
  const [descricao, setDescricao] = useState('');
  const [procedimentoPadrao, setProcedimentoPadrao] = useState('');
  const [contextoAplicacao, setContextoAplicacao] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAtivos =
    selectedCategoria === 'TODAS'
      ? ativos
      : ativos.filter((a) => a.categoria === selectedCategoria);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('O título do ativo é obrigatório.');
      return;
    }
    if (!procedimentoPadrao.trim()) {
      setFormError('O código / fórmula / procedimento padrão é obrigatório.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      setIsSubmitting(true);
      setFormError(null);
      await onCurarAtivo({
        titulo: titulo.trim(),
        categoria,
        descricao: descricao.trim() || undefined,
        procedimento_padrao: procedimentoPadrao.trim(),
        contexto_aplicacao: contextoAplicacao.trim() || undefined,
        tags,
      });

      // Limpar formulário
      setTitulo('');
      setDescricao('');
      setProcedimentoPadrao('');
      setContextoAplicacao('');
      setTagsInput('');
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Falha ao curar ativo de aprendizado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="learned-assets-section">
      {/* Top Banner de Aprendizados e Memória Operacional */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 text-indigo-200">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              Memória Operacional & Curadoria de Ativos Reutilizáveis
            </h3>
            <p className="text-xs text-indigo-300/80 mt-1 max-w-2xl leading-relaxed">
              Fórmulas DAX testadas, scripts Power Query M e regras de validação refinadas nesta
              demanda são catalogadas aqui para enriquecimento do repositório profissional do analista.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors self-start sm:self-center shrink-0 disabled:opacity-50"
          data-testid="btn-open-curar-ativo"
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{isFormOpen ? 'Fechar Formulário' : 'Curar Novo Ativo'}</span>
        </button>
      </div>

      {/* Formulário de Curadoria Expansível */}
      {isFormOpen && (
        <Card className="p-5 bg-slate-900 border-indigo-800/80 shadow-xl" data-testid="form-curar-ativo">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Formulário de Curadoria Técnica para Memória Operacional
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Título do Ativo <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Tabela Calendário Inteligente com Feriados M"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  data-testid="input-ativo-titulo"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Categoria Técnica <span className="text-rose-400">*</span>
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaAtivoAprendizado)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  data-testid="select-ativo-categoria"
                >
                  {Object.values(CategoriaAtivoAprendizado).map((cat) => (
                    <option key={cat} value={cat}>
                      {ROTULOS_CATEGORIA_ATIVO_APRENDIZADO[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Procedimento Padrão / Código / Fórmula DAX ou M <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={5}
                required
                value={procedimentoPadrao}
                onChange={(e) => setProcedimentoPadrao(e.target.value)}
                placeholder="Insira a expressão DAX, fórmula Power Query M ou padrão analítico consolidado..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-indigo-200 focus:border-indigo-500 focus:outline-none"
                data-testid="textarea-ativo-codigo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contexto de Aplicação & Boas Práticas (Opcional)
                </label>
                <input
                  type="text"
                  value={contextoAplicacao}
                  onChange={(e) => setContextoAplicacao(e.target.value)}
                  placeholder="Ex: Utilizar em modelos de assinatura SaaS com cálculo de churn"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  data-testid="input-ativo-contexto"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tags (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Ex: DAX, Churn, Time Intelligence, SaaS"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  data-testid="input-ativo-tags"
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-lg border border-rose-800 bg-rose-950/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors disabled:opacity-50"
                data-testid="btn-submit-curar-ativo"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Salvando...' : 'Salvar na Memória Operacional'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Filtros por Categoria */}
      <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
          <Filter className="h-3.5 w-3.5" />
          <span>Filtrar:</span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedCategoria('TODAS')}
          className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
            selectedCategoria === 'TODAS'
              ? 'bg-slate-700 border-slate-600 text-white font-medium'
              : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          data-testid="filter-cat-todas"
        >
          Todas ({ativos.length})
        </button>
        {Object.values(CategoriaAtivoAprendizado).map((cat) => {
          const count = ativos.filter((a) => a.categoria === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoria(cat)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                selectedCategoria === cat
                  ? 'bg-indigo-950/80 border-indigo-700 text-indigo-200 font-medium'
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              data-testid={`filter-cat-${cat}`}
            >
              {ROTULOS_CATEGORIA_ATIVO_APRENDIZADO[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de Ativos Curados */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Carregando ativos de aprendizado...
          </div>
        ) : filteredAtivos.length === 0 ? (
          <Card className="p-8 text-center bg-slate-950/50 border-slate-800">
            <BookOpen className="h-7 w-7 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">Nenhum ativo curado nesta categoria</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Utilize o botão acima para promover fórmulas DAX, scripts M ou regras desta demanda para a memória do workspace.
            </p>
          </Card>
        ) : (
          filteredAtivos.map((ativo) => (
            <Card
              key={ativo.id}
              className="p-5 bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors"
              data-testid={`card-ativo-${ativo.id}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300">
                    {ROTULOS_CATEGORIA_ATIVO_APRENDIZADO[ativo.categoria]}
                  </span>
                  <h4 className="text-sm font-bold text-white">{ativo.titulo}</h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Curado em: {new Date(ativo.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {ativo.descricao && (
                <p className="text-xs text-slate-300 mb-3 leading-relaxed">{ativo.descricao}</p>
              )}

              {/* Bloco de Código Padrão */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {ativo.procedimento_padrao}
              </div>

              {/* Contexto e Tags */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-2 text-[11px] text-slate-400">
                {ativo.contexto_aplicacao ? (
                  <span>
                    <strong>Aplicação:</strong> {ativo.contexto_aplicacao}
                  </span>
                ) : (
                  <span />
                )}

                {ativo.tags && ativo.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3 w-3 text-slate-500" />
                    {ativo.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
