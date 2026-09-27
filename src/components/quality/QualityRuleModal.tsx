'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Sliders,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Key,
  Hash,
  ListFilter,
  CheckSquare,
  Calendar,
  Info
} from 'lucide-react';
import { AtivoDados } from '@/core/domain/entities/ativo-dados';
import { RegraQualidade, ParametrosRegraQualidade } from '@/core/domain/entities/regra-qualidade';
import { TipoRegraQualidade, ROTULOS_TIPO_REGRA_QUALIDADE } from '@/core/domain/enums/tipo-regra-qualidade';
import { createQualityRuleAction, updateQualityRuleAction } from '@/app/actions/quality-actions';

interface QualityRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AtivoDados | null;
  demandaId: string;
  ruleToEdit?: RegraQualidade | null;
  onSuccess: (rule: RegraQualidade) => void;
}

export function QualityRuleModal({
  isOpen,
  onClose,
  asset,
  demandaId,
  ruleToEdit,
  onSuccess,
}: QualityRuleModalProps) {
  const isEditing = !!ruleToEdit;

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<TipoRegraQualidade>(TipoRegraQualidade.CHAVE_UNICA);

  // Parâmetros R1: Chave Única
  const [r1Colunas, setR1Colunas] = useState<string[]>([]);
  const [r1IgnorarNulos, setR1IgnorarNulos] = useState(false);

  // Parâmetros R2: Mín/Máx
  const [r2Coluna, setR2Coluna] = useState('');
  const [r2Minimo, setR2Minimo] = useState<string>('');
  const [r2Maximo, setR2Maximo] = useState<string>('');
  const [r2PermitirIgualMin, setR2PermitirIgualMin] = useState(true);
  const [r2PermitirIgualMax, setR2PermitirIgualMax] = useState(true);

  // Parâmetros R3: Valores Permitidos
  const [r3Coluna, setR3Coluna] = useState('');
  const [r3ValoresTexto, setR3ValoresTexto] = useState('');
  const [r3CaseSensitive, setR3CaseSensitive] = useState(false);
  const [r3IgnorarEspacos, setR3IgnorarEspacos] = useState(true);

  // Parâmetros R4: Obrigatoriedade
  const [r4Coluna, setR4Coluna] = useState('');
  const [r4PermitirEspacos, setR4PermitirEspacos] = useState(false);

  // Parâmetros R5: Regra Temporal
  const [r5Coluna, setR5Coluna] = useState('');
  const [r5Modo, setR5Modo] = useState<'COMPARAR_COM_HOJE' | 'COMPARAR_COM_DATA_FIXA' | 'COMPARAR_COM_COLUNA'>('COMPARAR_COM_HOJE');
  const [r5Operador, setR5Operador] = useState<'MENOR' | 'MENOR_OU_IGUAL' | 'MAIOR' | 'MAIOR_OU_IGUAL' | 'IGUAL'>('MENOR_OU_IGUAL');
  const [r5DataFixa, setR5DataFixa] = useState('');
  const [r5ColunaComparada, setR5ColunaComparada] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extração das colunas inferidas
  let availableColumns: string[] = [];
  if (asset?.schema_inferido) {
    try {
      const parsed = JSON.parse(asset.schema_inferido);
      if (typeof parsed === 'object' && parsed !== null) {
        availableColumns = Object.keys(parsed);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (ruleToEdit) {
        setNome(ruleToEdit.nome);
        setDescricao(ruleToEdit.descricao || '');
        setTipo(ruleToEdit.tipo);

        // Preenche campos conforme o tipo
        if (ruleToEdit.tipo === TipoRegraQualidade.CHAVE_UNICA) {
          const p = ruleToEdit.parametros as any;
          setR1Colunas(p.colunas || ruleToEdit.colunas || []);
          setR1IgnorarNulos(!!p.ignorarNulos);
        } else if (ruleToEdit.tipo === TipoRegraQualidade.VALOR_MIN_MAX) {
          const p = ruleToEdit.parametros as any;
          setR2Coluna(ruleToEdit.coluna || '');
          setR2Minimo(p.minimo !== undefined && p.minimo !== null ? String(p.minimo) : '');
          setR2Maximo(p.maximo !== undefined && p.maximo !== null ? String(p.maximo) : '');
          setR2PermitirIgualMin(p.permitirIgualMinimo ?? true);
          setR2PermitirIgualMax(p.permitirIgualMaximo ?? true);
        } else if (ruleToEdit.tipo === TipoRegraQualidade.VALORES_PERMITIDOS) {
          const p = ruleToEdit.parametros as any;
          setR3Coluna(ruleToEdit.coluna || '');
          setR3ValoresTexto(Array.isArray(p.valoresPermitidos) ? p.valoresPermitidos.join(', ') : '');
          setR3CaseSensitive(!!p.caseSensitive);
          setR3IgnorarEspacos(p.ignorarEspacosBordas ?? true);
        } else if (ruleToEdit.tipo === TipoRegraQualidade.OBRIGATORIEDADE) {
          const p = ruleToEdit.parametros as any;
          setR4Coluna(ruleToEdit.coluna || '');
          setR4PermitirEspacos(!!p.permitirEspacosEmBranco);
        } else if (ruleToEdit.tipo === TipoRegraQualidade.REGRA_TEMPORAL) {
          const p = ruleToEdit.parametros as any;
          setR5Coluna(ruleToEdit.coluna || '');
          setR5Modo(p.modo || 'COMPARAR_COM_HOJE');
          setR5Operador(p.operador || 'MENOR_OU_IGUAL');
          setR5DataFixa(p.dataFixa || '');
          setR5ColunaComparada(p.colunaComparada || '');
        }
      } else {
        setNome('');
        setDescricao('');
        setTipo(TipoRegraQualidade.CHAVE_UNICA);
        setR1Colunas(availableColumns.length > 0 ? [availableColumns[0]] : []);
        setR1IgnorarNulos(false);
        setR2Coluna(availableColumns.length > 0 ? availableColumns[0] : '');
        setR2Minimo('');
        setR2Maximo('');
        setR2PermitirIgualMin(true);
        setR2PermitirIgualMax(true);
        setR3Coluna(availableColumns.length > 0 ? availableColumns[0] : '');
        setR3ValoresTexto('');
        setR3CaseSensitive(false);
        setR3IgnorarEspacos(true);
        setR4Coluna(availableColumns.length > 0 ? availableColumns[0] : '');
        setR4PermitirEspacos(false);
        setR5Coluna(availableColumns.length > 0 ? availableColumns[0] : '');
        setR5Modo('COMPARAR_COM_HOJE');
        setR5Operador('MENOR_OU_IGUAL');
        setR5DataFixa('');
        setR5ColunaComparada(availableColumns.length > 1 ? availableColumns[1] : '');
      }
      setErrorMessage(null);
    }
  }, [isOpen, ruleToEdit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 3) {
      setErrorMessage('O nome da regra deve conter no mínimo 3 caracteres.');
      return;
    }

    let payloadColuna: string | null = null;
    let payloadColunas: string[] = [];
    let payloadParametros: ParametrosRegraQualidade;

    if (tipo === TipoRegraQualidade.CHAVE_UNICA) {
      if (r1Colunas.length === 0) {
        setErrorMessage('Selecione ao menos uma coluna para a chave única.');
        return;
      }
      payloadColuna = r1Colunas.length === 1 ? r1Colunas[0] : null;
      payloadColunas = r1Colunas;
      payloadParametros = {
        tipo: TipoRegraQualidade.CHAVE_UNICA,
        colunas: r1Colunas,
        ignorarNulos: r1IgnorarNulos,
      };
    } else if (tipo === TipoRegraQualidade.VALOR_MIN_MAX) {
      if (!r2Coluna) {
        setErrorMessage('Selecione a coluna numérica para a regra de limites.');
        return;
      }
      const minNum = r2Minimo !== '' ? parseFloat(r2Minimo) : null;
      const maxNum = r2Maximo !== '' ? parseFloat(r2Maximo) : null;
      if (minNum === null && maxNum === null) {
        setErrorMessage('Informe ao menos um limite (mínimo ou máximo).');
        return;
      }
      if (minNum !== null && maxNum !== null && minNum > maxNum) {
        setErrorMessage('O valor mínimo não pode ser maior que o valor máximo.');
        return;
      }
      payloadColuna = r2Coluna;
      payloadColunas = [r2Coluna];
      payloadParametros = {
        tipo: TipoRegraQualidade.VALOR_MIN_MAX,
        minimo: minNum,
        maximo: maxNum,
        permitirIgualMinimo: r2PermitirIgualMin,
        permitirIgualMaximo: r2PermitirIgualMax,
      };
    } else if (tipo === TipoRegraQualidade.VALORES_PERMITIDOS) {
      if (!r3Coluna) {
        setErrorMessage('Selecione a coluna categórica.');
        return;
      }
      const valores = r3ValoresTexto
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      if (valores.length === 0) {
        setErrorMessage('Informe ao menos um valor permitido (separados por vírgula).');
        return;
      }
      payloadColuna = r3Coluna;
      payloadColunas = [r3Coluna];
      payloadParametros = {
        tipo: TipoRegraQualidade.VALORES_PERMITIDOS,
        valoresPermitidos: valores,
        caseSensitive: r3CaseSensitive,
        ignorarEspacosBordas: r3IgnorarEspacos,
      };
    } else if (tipo === TipoRegraQualidade.OBRIGATORIEDADE) {
      if (!r4Coluna) {
        setErrorMessage('Selecione a coluna obrigatória.');
        return;
      }
      payloadColuna = r4Coluna;
      payloadColunas = [r4Coluna];
      payloadParametros = {
        tipo: TipoRegraQualidade.OBRIGATORIEDADE,
        permitirEspacosEmBranco: r4PermitirEspacos,
      };
    } else {
      // REGRA_TEMPORAL
      if (!r5Coluna) {
        setErrorMessage('Selecione a coluna de data principal.');
        return;
      }
      if (r5Modo === 'COMPARAR_COM_DATA_FIXA' && !r5DataFixa) {
        setErrorMessage('Informe a data fixa para comparação.');
        return;
      }
      if (r5Modo === 'COMPARAR_COM_COLUNA' && !r5ColunaComparada) {
        setErrorMessage('Selecione a segunda coluna de data para comparação.');
        return;
      }
      payloadColuna = r5Coluna;
      payloadColunas = r5Modo === 'COMPARAR_COM_COLUNA' ? [r5Coluna, r5ColunaComparada] : [r5Coluna];
      payloadParametros = {
        tipo: TipoRegraQualidade.REGRA_TEMPORAL,
        modo: r5Modo,
        operador: r5Operador,
        dataFixa: r5Modo === 'COMPARAR_COM_DATA_FIXA' ? r5DataFixa : undefined,
        colunaComparada: r5Modo === 'COMPARAR_COM_COLUNA' ? r5ColunaComparada : undefined,
      };
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (isEditing && ruleToEdit) {
        const res = await updateQualityRuleAction({
          id: ruleToEdit.id,
          demandaId,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo,
          coluna: payloadColuna,
          colunas: payloadColunas,
          parametros: payloadParametros,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Falha ao atualizar regra.');
        } else {
          onSuccess(res.data);
          onClose();
        }
      } else {
        const res = await createQualityRuleAction({
          ativoDadosId: asset.id,
          demandaId,
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo,
          coluna: payloadColuna,
          colunas: payloadColunas,
          parametros: payloadParametros,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Falha ao criar regra.');
        } else {
          onSuccess(res.data);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado na gravação da regra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleR1Coluna = (col: string) => {
    if (r1Colunas.includes(col)) {
      setR1Colunas(r1Colunas.filter((c) => c !== col));
    } else {
      setR1Colunas([...r1Colunas, col]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      data-testid="quality-rule-modal"
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-blue-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? 'Editar Regra de Negócio' : 'Nova Regra de Negócio (R1–R5)'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuração visual declarativa sem JSON ou DSL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nome e Descrição da Regra */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Regra: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Chave Primária Vendas ou Limite Preço Unitário"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                data-testid="input-rule-name"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Descrição de Negócio (Opcional):
              </label>
              <input
                type="text"
                placeholder="Explique o contexto de negócio desta restrição..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                data-testid="input-rule-description"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tipo de Regra R1 a R5 */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo da Regra:
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoRegraQualidade)}
              disabled={isEditing}
              data-testid="select-rule-type"
              className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
            >
              <option value={TipoRegraQualidade.CHAVE_UNICA}>
                R1 — {ROTULOS_TIPO_REGRA_QUALIDADE[TipoRegraQualidade.CHAVE_UNICA]}
              </option>
              <option value={TipoRegraQualidade.VALOR_MIN_MAX}>
                R2 — {ROTULOS_TIPO_REGRA_QUALIDADE[TipoRegraQualidade.VALOR_MIN_MAX]}
              </option>
              <option value={TipoRegraQualidade.VALORES_PERMITIDOS}>
                R3 — {ROTULOS_TIPO_REGRA_QUALIDADE[TipoRegraQualidade.VALORES_PERMITIDOS]}
              </option>
              <option value={TipoRegraQualidade.OBRIGATORIEDADE}>
                R4 — {ROTULOS_TIPO_REGRA_QUALIDADE[TipoRegraQualidade.OBRIGATORIEDADE]}
              </option>
              <option value={TipoRegraQualidade.REGRA_TEMPORAL}>
                R5 — {ROTULOS_TIPO_REGRA_QUALIDADE[TipoRegraQualidade.REGRA_TEMPORAL]}
              </option>
            </select>
          </div>

          {/* Campos Específicos por Tipo */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 space-y-3">
            {/* R1: Chave Única */}
            {tipo === TipoRegraQualidade.CHAVE_UNICA && (
              <div className="space-y-3" data-testid="rule-fields-r1">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Key className="h-4 w-4" />
                  <span>Configuração de Chave Única (Simples ou Composta)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Selecione as colunas que compõem a chave única de identificação das linhas:
                </p>

                <div className="max-h-36 overflow-y-auto rounded border border-slate-800 p-2 space-y-1 bg-slate-950">
                  {availableColumns.length > 0 ? (
                    availableColumns.map((col) => (
                      <label key={col} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:bg-slate-900 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={r1Colunas.includes(col)}
                          onChange={() => handleToggleR1Coluna(col)}
                          className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                        />
                        <span className="font-mono">{col}</span>
                      </label>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">Nenhuma coluna inferida disponível</span>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={r1IgnorarNulos}
                    onChange={(e) => setR1IgnorarNulos(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Desconsiderar linhas onde qualquer coluna da chave for nula</span>
                </label>
              </div>
            )}

            {/* R2: Limites Mín/Máx */}
            {tipo === TipoRegraQualidade.VALOR_MIN_MAX && (
              <div className="space-y-3" data-testid="rule-fields-r2">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Hash className="h-4 w-4" />
                  <span>Configuração de Limites Numéricos</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Coluna Numérica:</label>
                  <select
                    value={r2Coluna}
                    onChange={(e) => setR2Coluna(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                  >
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Valor Mínimo:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Sem limite mínimo"
                      value={r2Minimo}
                      onChange={(e) => setR2Minimo(e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r2PermitirIgualMin}
                        onChange={(e) => setR2PermitirIgualMin(e.target.checked)}
                        className="rounded border-slate-700"
                      />
                      <span>Inclusivo (&gt;=)</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Valor Máximo:</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Sem limite máximo"
                      value={r2Maximo}
                      onChange={(e) => setR2Maximo(e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r2PermitirIgualMax}
                        onChange={(e) => setR2PermitirIgualMax(e.target.checked)}
                        className="rounded border-slate-700"
                      />
                      <span>Inclusivo (&lt;=)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* R3: Valores Permitidos */}
            {tipo === TipoRegraQualidade.VALORES_PERMITIDOS && (
              <div className="space-y-3" data-testid="rule-fields-r3">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <ListFilter className="h-4 w-4" />
                  <span>Configuração de Valores Permitidos (Domínio Fechado)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Coluna Categórica:</label>
                  <select
                    value={r3Coluna}
                    onChange={(e) => setR3Coluna(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                  >
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Valores Válidos (separados por vírgula):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ativo, Inativo, Cancelado, Pendente"
                    value={r3ValoresTexto}
                    onChange={(e) => setR3ValoresTexto(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                  />
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r3CaseSensitive}
                      onChange={(e) => setR3CaseSensitive(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <span>Diferenciar maiúsculas/minúsculas</span>
                  </label>

                  <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={r3IgnorarEspacos}
                      onChange={(e) => setR3IgnorarEspacos(e.target.checked)}
                      className="rounded border-slate-700"
                    />
                    <span>Ignorar espaços no início e fim (Trim)</span>
                  </label>
                </div>
              </div>
            )}

            {/* R4: Obrigatoriedade */}
            {tipo === TipoRegraQualidade.OBRIGATORIEDADE && (
              <div className="space-y-3" data-testid="rule-fields-r4">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <CheckSquare className="h-4 w-4" />
                  <span>Configuração de Obrigatoriedade (Não Nulo / Não Vazio)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Coluna de Preenchimento Obrigatório:</label>
                  <select
                    value={r4Coluna}
                    onChange={(e) => setR4Coluna(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                  >
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={r4PermitirEspacos}
                    onChange={(e) => setR4PermitirEspacos(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Considerar espaços puros em branco como preenchimento válido</span>
                </label>
              </div>
            )}

            {/* R5: Regra Temporal */}
            {tipo === TipoRegraQualidade.REGRA_TEMPORAL && (
              <div className="space-y-3" data-testid="rule-fields-r5">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                  <Calendar className="h-4 w-4" />
                  <span>Configuração de Regra Temporal</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Coluna de Data Principal:</label>
                  <select
                    value={r5Coluna}
                    onChange={(e) => setR5Coluna(e.target.value)}
                    className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                  >
                    {availableColumns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Operador:</label>
                    <select
                      value={r5Operador}
                      onChange={(e) => setR5Operador(e.target.value as any)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    >
                      <option value="MENOR_OU_IGUAL">Menor ou igual (&lt;=)</option>
                      <option value="MENOR">Menor que (&lt;)</option>
                      <option value="MAIOR_OU_IGUAL">Maior ou igual (&gt;=)</option>
                      <option value="MAIOR">Maior que (&gt;)</option>
                      <option value="IGUAL">Exatamente igual (=)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Comparar com:</label>
                    <select
                      value={r5Modo}
                      onChange={(e) => setR5Modo(e.target.value as any)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    >
                      <option value="COMPARAR_COM_HOJE">Data Atual (Hoje)</option>
                      <option value="COMPARAR_COM_DATA_FIXA">Data Fixa Específica</option>
                      <option value="COMPARAR_COM_COLUNA">Outra Coluna de Data</option>
                    </select>
                  </div>
                </div>

                {r5Modo === 'COMPARAR_COM_DATA_FIXA' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Data Fixa Limite:</label>
                    <input
                      type="date"
                      value={r5DataFixa}
                      onChange={(e) => setR5DataFixa(e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    />
                  </div>
                )}

                {r5Modo === 'COMPARAR_COM_COLUNA' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Segunda Coluna de Data:</label>
                    <select
                      value={r5ColunaComparada}
                      onChange={(e) => setR5ColunaComparada(e.target.value)}
                      className="w-full rounded bg-slate-950 border border-slate-800 p-2 text-xs text-slate-200"
                    >
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || nome.trim().length < 3}
              data-testid="btn-confirm-rule-save"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Gravando Regra...</span>
                </>
              ) : (
                <span>{isEditing ? 'Salvar Alterações' : 'Criar Regra de Negócio'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
