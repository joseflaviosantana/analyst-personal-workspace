import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  EstadoDemanda, 
  ROTULOS_ESTADO_DEMANDA, 
  ESTILOS_BADGE_ESTADO,
  normalizarEstadoDemanda 
} from '@/core/domain/enums/estado-demanda';

interface DemandStateBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  estado: EstadoDemanda | string;
  className?: string;
  testId?: string;
  showDot?: boolean;
}

export function DemandStateBadge({
  estado,
  className,
  testId,
  showDot = true,
  ...props
}: DemandStateBadgeProps) {
  const estadoNormalizado = normalizarEstadoDemanda(estado);
  const rotulo = ROTULOS_ESTADO_DEMANDA[estadoNormalizado] || estado;
  const estilo = ESTILOS_BADGE_ESTADO[estadoNormalizado] || ESTILOS_BADGE_ESTADO[EstadoDemanda.NOVA];

  return (
    <span
      data-testid={testId}
      {...props}
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
          estilo.bg,
          estilo.text,
          estilo.border,
          className
        )
      )}
    >
      {showDot && (
        <span className={clsx('h-1.5 w-1.5 rounded-full flex-shrink-0', estilo.dot)} aria-hidden="true" />
      )}
      <span>{rotulo}</span>
    </span>
  );
}
