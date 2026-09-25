import { describe, it, expect } from 'vitest';
import { EstadoDemanda, isTransicaoPermitida } from '@/core/domain/enums/estado-demanda';

describe('Core Domain: Workflow Engine', () => {
  it('deve permitir transição válida de BACKLOG para ENTENDIMENTO', () => {
    const permitida = isTransicaoPermitida(EstadoDemanda.BACKLOG, EstadoDemanda.ENTENDIMENTO);
    expect(permitida).toBe(true);
  });

  it('não deve permitir transição de um estado para si mesmo', () => {
    const permitida = isTransicaoPermitida(EstadoDemanda.BACKLOG, EstadoDemanda.BACKLOG);
    expect(permitida).toBe(false);
  });

  it('não deve permitir transição a partir do estado CANCELADA', () => {
    const permitida = isTransicaoPermitida(EstadoDemanda.CANCELADA, EstadoDemanda.ENTENDIMENTO);
    expect(permitida).toBe(false);
  });

  it('não deve permitir transição a partir do estado CONCLUIDA', () => {
    const permitida = isTransicaoPermitida(EstadoDemanda.CONCLUIDA, EstadoDemanda.BACKLOG);
    expect(permitida).toBe(false);
  });
});
