'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Projeto, StatusProjeto } from '@/core/domain/entities/projeto';
import { updateProjectAction } from '@/app/actions/project-actions';
import { Card } from '@/components/ui/Card';

interface EditProjectFormProps {
  project: Projeto;
}

export function EditProjectForm({ project }: EditProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: project.nome,
    descricao: project.descricao || '',
    status: project.status,
    data_inicio: project.data_inicio || '',
    data_conclusao_prevista: project.data_conclusao_prevista || '',
    data_conclusao_real: project.data_conclusao_real || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await updateProjectAction(project.id, {
        nome: formData.nome,
        descricao: formData.descricao || null,
        status: formData.status as StatusProjeto,
        data_inicio: formData.data_inicio || null,
        data_conclusao_prevista: formData.data_conclusao_prevista || null,
        data_conclusao_real: formData.data_conclusao_real || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao atualizar projeto.');
        setLoading(false);
        return;
      }

      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao salvar alterações.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          aria-label="Voltar para Detalhes do Projeto"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 data-testid="edit-project-title" className="text-xl font-bold tracking-tight text-white">
            Editar Projeto
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Atualize as informações e o status operacional da iniciativa
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-edit-project">
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

          <div>
            <label htmlFor="nome" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Nome do Projeto <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              required
              data-testid="input-edit-project-name"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="descricao" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Descrição e Contexto Estratégico
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              data-testid="input-edit-project-description"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="status" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Status
              </label>
              <select
                id="status"
                name="status"
                data-testid="select-edit-project-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="ATIVO">Ativo</option>
                <option value="PAUSADO">Pausado</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>

            <div>
              <label htmlFor="data_inicio" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                id="data_inicio"
                name="data_inicio"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="data_conclusao_prevista" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Previsão de Término
              </label>
              <input
                type="date"
                id="data_conclusao_prevista"
                name="data_conclusao_prevista"
                value={formData.data_conclusao_prevista}
                onChange={(e) => setFormData({ ...formData, data_conclusao_prevista: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="data_conclusao_real" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Data de Conclusão Real
              </label>
              <input
                type="date"
                id="data_conclusao_real"
                name="data_conclusao_real"
                value={formData.data_conclusao_real}
                onChange={(e) => setFormData({ ...formData, data_conclusao_real: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link
              href={`/projects/${project.id}`}
              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              data-testid="btn-submit-edit-project"
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
