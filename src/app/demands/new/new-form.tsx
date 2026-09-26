'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, PlusCircle } from 'lucide-react';
import { ProjetoComContadores } from '@/core/domain/entities/projeto';
import { createDemandAction } from '@/app/actions/demand-actions';
import { Card } from '@/components/ui/Card';

interface NewDemandFormProps {
  projects: ProjetoComContadores[];
  initialProjectId?: string;
}

export function NewDemandForm({ projects, initialProjectId }: NewDemandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projeto_id: initialProjectId || (projects[0]?.id ?? ''),
    titulo: '',
    solicitacao_bruta: '',
    contexto: '',
    objetivo_inicial: '',
    prazo_esperado: '',
    restricoes_declaradas: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await createDemandAction({
        projeto_id: formData.projeto_id,
        titulo: formData.titulo,
        solicitacao_bruta: formData.solicitacao_bruta,
        contexto: formData.contexto || null,
        objetivo_inicial: formData.objetivo_inicial || null,
        prazo_esperado: formData.prazo_esperado || null,
        restricoes_declaradas: formData.restricoes_declaradas || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao criar demanda.');
        setLoading(false);
        return;
      }

      router.push(`/demands/${result.data?.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao registrar a demanda.');
      setLoading(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/demands"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-xl font-bold text-white">Criar Nova Demanda</h1>
        </div>

        <Card className="p-8 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto" />
          <h2 className="text-base font-semibold text-white">Nenhum projeto encontrado</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Toda demanda profissional no Analyst Personal Workspace pertence obrigatoriamente a um Projeto de origem. Crie um projeto antes de registrar a demanda.
          </p>
          <div className="pt-2">
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Criar Primeiro Projeto</span>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/demands"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          aria-label="Voltar para Demandas"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 data-testid="new-demand-title" className="text-xl font-bold tracking-tight text-white">
            Registrar Nova Demanda
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Captura estruturada da solicitação analítica profissional
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-new-demand">
          {errorMessage && (
            <div 
              data-testid="form-error"
              className="flex items-center gap-2.5 rounded-lg border border-red-800/80 bg-red-950/40 p-3.5 text-xs text-red-300"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="projeto_id" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Projeto Vinculado <span className="text-red-400">*</span>
              </label>
              <select
                id="projeto_id"
                name="projeto_id"
                required
                data-testid="select-demand-project"
                value={formData.projeto_id}
                onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.nome} ({proj.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prazo_esperado" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Prazo ou Expectativa Temporal
              </label>
              <input
                type="date"
                id="prazo_esperado"
                name="prazo_esperado"
                data-testid="input-demand-due-date"
                value={formData.prazo_esperado}
                onChange={(e) => setFormData({ ...formData, prazo_esperado: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="titulo" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Título da Demanda <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              required
              data-testid="input-demand-title"
              placeholder="Ex.: Relatório de Divergência de Faturamento Q3"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="solicitacao_bruta" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Solicitação Bruta Original <span className="text-red-400">*</span>
            </label>
            <textarea
              id="solicitacao_bruta"
              name="solicitacao_bruta"
              required
              rows={4}
              data-testid="input-demand-raw-request"
              placeholder="Cole aqui a mensagem original, e-mail do cliente ou anotações da reunião..."
              value={formData.solicitacao_bruta}
              onChange={(e) => setFormData({ ...formData, solicitacao_bruta: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              O texto bruto preserva a fidelidade da entrada do cliente para rastreabilidade auditável.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contexto" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contexto Específico de Negócio
              </label>
              <textarea
                id="contexto"
                name="contexto"
                rows={3}
                data-testid="input-demand-context"
                placeholder="Ex.: Auditoria trimestral de fechamento contábil..."
                value={formData.contexto}
                onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label htmlFor="objetivo_inicial" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Objetivo Inicial Declarado
              </label>
              <textarea
                id="objetivo_inicial"
                name="objetivo_inicial"
                rows={3}
                data-testid="input-demand-objective"
                placeholder="Ex.: Identificar causas raízes de divergências superiores a 1%..."
                value={formData.objetivo_inicial}
                onChange={(e) => setFormData({ ...formData, objetivo_inicial: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="restricoes_declaradas" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Restrições Declaradas
            </label>
            <input
              type="text"
              id="restricoes_declaradas"
              name="restricoes_declaradas"
              data-testid="input-demand-restrictions"
              placeholder="Ex.: Não alterar lançamentos anteriores a 2025; utilizar dados de extrato consolidado."
              value={formData.restricoes_declaradas}
              onChange={(e) => setFormData({ ...formData, restricoes_declaradas: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href="/demands"
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-submit-demand"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Criando Demanda...' : 'Criar Demanda'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
