import { describe, it, expect } from 'vitest';
import {
  TipoEvidenciaAnalitica,
  ROTULOS_TIPO_EVIDENCIA,
} from '@/core/domain/enums/tipo-evidencia-analitica';
import {
  EtapaOrigemEvidencia,
  ROTULOS_ETAPA_ORIGEM_EVIDENCIA,
} from '@/core/domain/enums/etapa-origem-evidencia';
import {
  MetodoCapturaEvidencia,
  ROTULOS_METODO_CAPTURA,
} from '@/core/domain/enums/metodo-captura-evidencia';
import {
  StatusValidacaoEvidencia,
  ROTULOS_STATUS_VALIDACAO_EVIDENCIA,
} from '@/core/domain/enums/status-validacao-evidencia';
import {
  ClassificacaoExposicaoEvidencia,
  ROTULOS_CLASSIFICACAO_EXPOSICAO,
} from '@/core/domain/enums/classificacao-exposicao-evidencia';

describe('Evidence Core: Contratos e Enums de Domínio (Subgate 3.5A)', () => {
  it('deve conter todos os tipos canônicos de evidência analítica e seus rótulos', () => {
    expect(TipoEvidenciaAnalitica.DADOS).toBe('DADOS');
    expect(TipoEvidenciaAnalitica.QUALIDADE).toBe('QUALIDADE');
    expect(TipoEvidenciaAnalitica.PREPARACAO).toBe('PREPARACAO');
    expect(TipoEvidenciaAnalitica.MODELAGEM).toBe('MODELAGEM');
    expect(TipoEvidenciaAnalitica.DAX).toBe('DAX');
    expect(TipoEvidenciaAnalitica.DASHBOARD).toBe('DASHBOARD');
    expect(TipoEvidenciaAnalitica.VALIDACAO).toBe('VALIDACAO');
    expect(TipoEvidenciaAnalitica.ENTREGA).toBe('ENTREGA');
    expect(TipoEvidenciaAnalitica.REVISAO).toBe('REVISAO');

    for (const key of Object.values(TipoEvidenciaAnalitica)) {
      expect(ROTULOS_TIPO_EVIDENCIA[key]).toBeDefined();
      expect(ROTULOS_TIPO_EVIDENCIA[key].length).toBeGreaterThan(0);
    }
  });

  it('deve conter as etapas de origem analítica mapeadas para o workflow', () => {
    expect(EtapaOrigemEvidencia.DADOS).toBe('DADOS');
    expect(EtapaOrigemEvidencia.POWERBI_DASHBOARD).toBe('POWERBI_DASHBOARD');
    expect(EtapaOrigemEvidencia.GERAL).toBe('GERAL');

    for (const key of Object.values(EtapaOrigemEvidencia)) {
      expect(ROTULOS_ETAPA_ORIGEM_EVIDENCIA[key]).toBeDefined();
    }
  });

  it('deve definir métodos de captura com distinção rigorosa de proveniência', () => {
    expect(MetodoCapturaEvidencia.AUTOMATICA).toBe('AUTOMATICA');
    expect(MetodoCapturaEvidencia.ASSISTIDA).toBe('ASSISTIDA');
    expect(MetodoCapturaEvidencia.MANUAL).toBe('MANUAL');

    expect(ROTULOS_METODO_CAPTURA[MetodoCapturaEvidencia.AUTOMATICA]).toContain('Automática');
    expect(ROTULOS_METODO_CAPTURA[MetodoCapturaEvidencia.ASSISTIDA]).toContain('Assistida');
    expect(ROTULOS_METODO_CAPTURA[MetodoCapturaEvidencia.MANUAL]).toContain('Manual');
  });

  it('deve contemplar o ciclo de vida completo de validação da evidência', () => {
    expect(StatusValidacaoEvidencia.CAPTURADA).toBe('CAPTURADA');
    expect(StatusValidacaoEvidencia.AGUARDANDO_REVISAO).toBe('AGUARDANDO_REVISAO');
    expect(StatusValidacaoEvidencia.CONFIRMADA).toBe('CONFIRMADA');
    expect(StatusValidacaoEvidencia.REJEITADA).toBe('REJEITADA');

    expect(ROTULOS_STATUS_VALIDACAO_EVIDENCIA.CONFIRMADA).toContain('Confirmada');
    expect(ROTULOS_STATUS_VALIDACAO_EVIDENCIA.REJEITADA).toContain('Rejeitada');
  });

  it('deve definir classificações de exposição para governança de segredos e portfólio', () => {
    expect(ClassificacaoExposicaoEvidencia.INTERNA).toBe('INTERNA');
    expect(ClassificacaoExposicaoEvidencia.CONFIDENCIAL).toBe('CONFIDENCIAL');
    expect(ClassificacaoExposicaoEvidencia.SANITIZAVEL).toBe('SANITIZAVEL');
    expect(ClassificacaoExposicaoEvidencia.PUBLICA).toBe('PUBLICA');

    expect(ROTULOS_CLASSIFICACAO_EXPOSICAO.CONFIDENCIAL).toContain('Confidencial');
    expect(ROTULOS_CLASSIFICACAO_EXPOSICAO.PUBLICA).toContain('Pública');
  });
});
