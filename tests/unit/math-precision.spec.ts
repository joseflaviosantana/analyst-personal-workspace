import { describe, it, expect } from 'vitest';
import {
  calcularDivergenciaNumerica,
  roundToPrecision,
  isDentroDaTolerancia,
  PRECISAO_DECIMAIS_PADRAO,
  EPSILON_COMPARACAO,
} from '@/core/domain/rules/math-precision';

describe('Unit Tests: Precisão Numérica Determinística (Subunidade 3.7A)', () => {
  describe('roundToPrecision', () => {
    it('deve normalizar o problema clássico de ponto flutuante 0.1 + 0.2 === 0.3', () => {
      const somaBinaria = 0.1 + 0.2;
      expect(somaBinaria).not.toBe(0.3); // 0.30000000000000004
      const arredondado = roundToPrecision(somaBinaria, 4);
      expect(arredondado).toBe(0.3);
    });

    it('deve manter precisão de centavos em valores monetários grandes', () => {
      const valor = 1234567.8949;
      expect(roundToPrecision(valor, 2)).toBe(1234567.89);
      expect(roundToPrecision(valor, 4)).toBe(1234567.8949);
    });

    it('deve lidar com valores não-finitos retornando 0', () => {
      expect(roundToPrecision(NaN)).toBe(0);
      expect(roundToPrecision(Infinity)).toBe(0);
      expect(roundToPrecision(-Infinity)).toBe(0);
    });
  });

  describe('isDentroDaTolerancia', () => {
    it('deve retornar true quando a divergência for exatamente igual à tolerância', () => {
      expect(isDentroDaTolerancia(0.05, 0.05)).toBe(true);
      expect(isDentroDaTolerancia(0.0001, 0.0001)).toBe(true);
      expect(isDentroDaTolerancia(0, 0)).toBe(true);
    });

    it('deve retornar false quando a divergência exceder a tolerância além da margem epsilon', () => {
      expect(isDentroDaTolerancia(0.0501, 0.05)).toBe(false);
      expect(isDentroDaTolerancia(1.0, 0.5)).toBe(false);
    });

    it('deve mitigar falsos divergentes produzidos por resíduo de floating point', () => {
      // 0.3 - 0.2 = 0.09999999999999998
      const diff = 0.3 - 0.2;
      const tol = 0.1;
      expect(isDentroDaTolerancia(diff, tol)).toBe(true);
    });
  });

  describe('calcularDivergenciaNumerica — Casos de Borda e Regras de Negócio', () => {
    it('deve calcular divergência zero quando valores esperados e obtidos forem idênticos', () => {
      const res = calcularDivergenciaNumerica(1500.5, 1500.5, 0);
      expect(res.divergencia_absoluta).toBe(0);
      expect(res.divergencia_percentual).toBe(0);
      expect(res.dentro_da_tolerancia).toBe(true);
    });

    it('REGRA VINCULANTE: quando valor_esperado === 0 e valor_obtido === 0, divergência percentual deve ser 0%', () => {
      const res = calcularDivergenciaNumerica(0, 0, 0);
      expect(res.divergencia_absoluta).toBe(0);
      expect(res.divergencia_percentual).toBe(0);
      expect(res.dentro_da_tolerancia).toBe(true);
    });

    it('REGRA VINCULANTE: quando valor_esperado === 0 e valor_obtido !== 0, previne divisão por zero e define 100%', () => {
      const res = calcularDivergenciaNumerica(0, 45.2, 0);
      expect(res.divergencia_absoluta).toBe(45.2);
      expect(res.divergencia_percentual).toBe(100);
      expect(res.dentro_da_tolerancia).toBe(false);
    });

    it('REGRA VINCULANTE: quando valor_esperado === 0, valor_obtido !== 0 mas dentro da tolerância, retorna dentro_da_tolerancia = true', () => {
      const res = calcularDivergenciaNumerica(0, 0.005, 0.01);
      expect(res.divergencia_absoluta).toBe(0.005);
      expect(res.divergencia_percentual).toBe(100);
      expect(res.dentro_da_tolerancia).toBe(true);
    });

    it('deve calcular corretamente com percentuais muito pequenos', () => {
      // Esperado: 1.000.000, Obtido: 1.000.010 -> dif 10, perc 0.001%
      const res = calcularDivergenciaNumerica(1000000, 1000010, 5);
      expect(res.divergencia_absoluta).toBe(10);
      expect(res.divergencia_percentual).toBe(0.001);
      expect(res.dentro_da_tolerancia).toBe(false);
    });

    it('deve calcular corretamente com valores negativos quando semanticamente permitidos (ex: EBITDA ou saldo)', () => {
      // Esperado: -5000, Obtido: -5020 -> dif 20, perc (20 / 5000) * 100 = 0.4%
      const res = calcularDivergenciaNumerica(-5000, -5020, 25);
      expect(res.divergencia_absoluta).toBe(20);
      expect(res.divergencia_percentual).toBe(0.4);
      expect(res.dentro_da_tolerancia).toBe(true);
    });

    it('deve calcular corretamente transição positivo para negativo', () => {
      // Esperado: 100, Obtido: -50 -> dif 150, perc 150%
      const res = calcularDivergenciaNumerica(100, -50, 10);
      expect(res.divergencia_absoluta).toBe(150);
      expect(res.divergencia_percentual).toBe(150);
      expect(res.dentro_da_tolerancia).toBe(false);
    });

    it('deve respeitar estritamente o limiar da tolerância permitida', () => {
      // Exatamente na tolerância:
      const resExato = calcularDivergenciaNumerica(100, 102, 2.0);
      expect(resExato.divergencia_absoluta).toBe(2);
      expect(resExato.dentro_da_tolerancia).toBe(true);

      // Imediatamente acima da tolerância:
      const resAcima = calcularDivergenciaNumerica(100, 102.0002, 2.0);
      expect(resAcima.divergencia_absoluta).toBe(2.0002);
      expect(resAcima.dentro_da_tolerancia).toBe(false);
    });
  });
});
