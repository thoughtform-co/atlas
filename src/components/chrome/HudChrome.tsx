import Link from 'next/link';

/**
 * Global HUD chrome frame (server component) — the v7 brand cockpit ported
 * from thoughtform.co: TL + BR corner brackets, left/right measurement
 * rails with the Brand Codex 13-tick ladder, and the bottom-left wordmark
 * lockup. Purely static markup — no hooks, no client boundary. The
 * interactive nav lives in the sibling <HudNav> overlay; the constellation's
 * filter panels + readouts live in <NavigationHUD>.
 *
 * Tick ladder + widths mirror 01_thoughtform/lib/v7-parse/hudTicks.ts:
 * 13 equal-spaced detents (0–100%), majors at 33.33% / 66.67%. The left
 * rail labels its majors "2" and "5"; the right rail leaves them bare.
 * Ticks are positioned by their top edge at yPct (matching upstream);
 * labels are centred on the detent with translateY(-50%).
 */

interface TickMark {
  yPct: number;
  major?: boolean;
  label?: string;
}

const LEFT_TICKS: readonly TickMark[] = [
  { yPct: 0 },
  { yPct: 8.33 },
  { yPct: 16.67 },
  { yPct: 25 },
  { yPct: 33.33, major: true, label: '2' },
  { yPct: 41.67 },
  { yPct: 50 },
  { yPct: 58.33 },
  { yPct: 66.67, major: true, label: '5' },
  { yPct: 75 },
  { yPct: 83.33 },
  { yPct: 91.67 },
  { yPct: 100 },
];

const RIGHT_TICKS: readonly TickMark[] = [
  { yPct: 0 },
  { yPct: 8.33 },
  { yPct: 16.67 },
  { yPct: 25 },
  { yPct: 33.33, major: true },
  { yPct: 41.67 },
  { yPct: 50 },
  { yPct: 58.33 },
  { yPct: 66.67, major: true },
  { yPct: 75 },
  { yPct: 83.33 },
  { yPct: 91.67 },
  { yPct: 100 },
];

function RailTicks({ ticks }: { ticks: readonly TickMark[] }) {
  return (
    <>
      {ticks.map((tick) => {
        const top = `${tick.yPct.toFixed(4)}%`;
        return (
          <span key={tick.yPct}>
            <span
              className={`hud__rail__tick${tick.major ? ' hud__rail__tick--major' : ''}`}
              style={{ top }}
            />
            {tick.label !== undefined && (
              <span
                className="hud__rail__label"
                style={{ top, transform: 'translateY(-50%)' }}
              >
                {tick.label}
              </span>
            )}
          </span>
        );
      })}
    </>
  );
}

export function HudChrome() {
  return (
    <div className="hud">
      {/* Corner brackets — TL + BR (BL owned by wordmark, TR by nav).
          Decorative measurement chrome — hidden from assistive tech. */}
      <div className="hud__corner hud__corner--tl" aria-hidden="true" />
      <div className="hud__corner hud__corner--br" aria-hidden="true" />

      {/* Left rail */}
      <aside className="hud__rail hud__rail--l" aria-hidden="true">
        <div className="hud__rail__track" />
        <RailTicks ticks={LEFT_TICKS} />
      </aside>

      {/* Right rail */}
      <aside className="hud__rail hud__rail--r" aria-hidden="true">
        <div className="hud__rail__track" />
        <RailTicks ticks={RIGHT_TICKS} />
      </aside>

      {/* Bottom-left wordmark lockup — an accessible home link */}
      <Link href="/" className="hud__brand" aria-label="Atlas — home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/thoughtform-wordmark-vertical-dual.svg" alt="Thoughtform" />
      </Link>
    </div>
  );
}
