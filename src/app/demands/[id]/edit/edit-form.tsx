'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { DemandaComProjeto } from '@/core/domain/entities/demanda';
import { updateDemandAction } from '@/app/actions/demand-actions';
import { Card } from '@/components/ui/Card';

interface EditDemandFormProps {
  demand: DemandaComProjeto;
}

export function EditDemandForm({ demand }: EditDemandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: demand.titulo,
    solicitacao_bruta: demand.solicitacao_bruta,
    contexto: demand.contexto || '',
    objetivo_inicial: demand.objetivo_inicial || '',
    prazo_esperado: demand.prazo_esperado || '',
    restricoes_declaradas: demand.restricoes_declaradas || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await updateDemandAction(demand.id, {
        titulo: formData.titulo,
        solicitacao_bruta: formData.solicitacao_bruta,
        contexto: formData.contexto || null,
        objetivo_inicial: formData.objetivo_inicial || null,
        prazo_esperado: formData.prazo_esperado || null,
        restricoes_declaradas: formData.restricoes_declaradas || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao atualizar a demanda.');
        setLoading(false);
        return;
      }

      router.push(`/demands/${demand.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao salvar a demanda.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/demands/${demand.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          aria-label="Voltar para Workspace da Demanda"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 data-testid="edit-demand-title" className="text-xl font-bold tracking-tight text-white">
            Editar Informações da Demanda
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Projeto: {demand.projetoNome}
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-edit-demand">
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
              <label htmlFor="titulo" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Título da Demanda <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                required
                data-testid="input-edit-demand-title"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="prazo_esperado" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Prazo ou Expectativa Temporal
              </label>
              <input
                type="date"
                id="prazo_esperado"
                name="prazo_esperado"
                value={formData.prazo_esperado}
                onChange={(e) => setFormData({ ...formData, prazo_esperado: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
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
              data-testid="input-edit-demand-raw-request"
              value={formData.solicitacao_bruta}
              onChange={(e) => setFormData({ ...formData, solicitacao_bruta: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none font-mono text-xs"
            />
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
                data-testid="input-edit-demand-context"
                value={formData.contexto}
                onChange={(e) => setFormData({ ...formData, contexto: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
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
                data-testid="input-edit-demand-objective"
                value={formData.objetivo_inicial}
                onChange={(e) => setFormData({ ...formData, objetivo_inicial: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
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
              value={formData.restricoes_declaradas}
              onChange={(e) => setFormData({ ...formData, restricoes_declaradas: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href={`/demands/${demand.id}`}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-submit-edit-demand"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
