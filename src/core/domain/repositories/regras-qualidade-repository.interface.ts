import { RegraQualidade } from '../entities/regra-qualidade';
import { StatusRegraQualidade } from '../enums/status-regra-qualidade';

/**
 * IRegrasQualidadeRepository (V1 — Subunidade 3.4B)
 * Contrato de persistência para Regras de Qualidade de Dados.
 *
 * REGRA NORMATIVA INEGOCIÁVEL DA V1:
 * Não existe exclusão física de regras de qualidade.
 * O ciclo de vida é estritamente controlado por status:
 * ATIVA --desativar--> INATIVA
 * INATIVA --reativar--> ATIVA
 * Por isso, este contrato NÃO CONTÉM método de deleção/remoção física.
 */
export interface IRegrasQualidadeRepository {
  /**
   * Persiste uma nova regra de qualidade (inicialmente ATIVA, versão 1).
   */
  create(regra: RegraQualidade): Promise<void>;

  /**
   * Localiza uma regra pelo seu ID único.
   */
  findById(id: string): Promise<RegraQualidade | null>;

  /**
   * Lista todas as regras associadas a um ativo de dados específico,
   * permitindo filtrar opcionalmente por status (ex: listar apenas regras ATIVAS para o avaliador).
   */
  findByAssetId(ativoDadosId: string, status?: StatusRegraQualidade): Promise<RegraQualidade[]>;

  /**
   * Atualiza os dados de uma regra existente (mudanças descritivas ou incrementos de versão semântica).
   */
  update(regra: RegraQualidade): Promise<void>;
}
