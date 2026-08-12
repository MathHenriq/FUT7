import type { ReactNode } from 'react';

/** Which ground a screen sits on.
 *
 *  `escuro` is the operating plane — session, video, live tagging. Work happens
 *  pitchside or in front of a running recording, where a light ground glares and
 *  the eye is on the image, not the page.
 *
 *  `claro` is the reading plane — dashboard, player profile, squad, backlog,
 *  reports. Work happens seated, comparing numbers, and a light ground carries
 *  dense tables better than a dark one.
 *
 *  It is not a theme toggle: the task picks the plane, so the same screen always
 *  looks the same to whoever opens it. */
export type TipoPlano = 'escuro' | 'claro';

interface Props {
  tipo: TipoPlano;
  children: ReactNode;
}

/** Publishes the plane onto the DOM. Every token in colors.ts resolves against
 *  the nearest ancestor carrying `data-plano`, so nothing below needs to know
 *  which plane it landed in. */
export default function Plano({ tipo, children }: Props) {
  return (
    <div data-plano={tipo} style={{ minHeight: '100%', flex: 1 }}>
      {children}
    </div>
  );
}
