/**
 * Шаблоны оформления.
 *
 * Каждый шаблон — набор CSS-переменных. Приложение ставит их в `:root`,
 * поэтому смена темы не требует перезагрузки окна.
 * Пользователь может переопределить фон, панели, кнопки и текст в настройках —
 * тогда вместо цвета темы используется выбранный цвет.
 */

import type { ThemeId } from './types'

export interface ThemeVars {
  bg: string
  /** Тот же фон, но обязательно `#rrggbb` — для поля выбора цвета. */
  bgHex: string
  panel: string
  panel2: string
  border: string
  text: string
  muted: string
  accent: string
  /** Текст на кнопке с акцентным фоном. */
  onAccent: string
  input: string
  shadow: string
  /** Ширина рамки и скругление; neumorphism и clay полагаются на это. */
  borderWidth: string
  radius: string
  /** Дополнительный размывающий слой для стекла. */
  blur: string
  /** Шрифт по умолчанию для темы (пусто — системный). */
  font: string
  /** Высота строки; терминал и неон делают текст плотнее. */
  lineHeight: string
  /** Дополнительные стили, вставляются как есть. */
  extraCss: string
}

const base: ThemeVars = {
  bg: '#0f1218',
  bgHex: '#0f1218',
  panel: '#161b24',
  panel2: '#1c2230',
  border: '#29313f',
  text: '#e7ebf3',
  muted: '#8792a6',
  accent: '#35f0a0',
  onAccent: '#06231a',
  input: '#11151d',
  shadow: '0 16px 44px rgba(0, 0, 0, 0.4)',
  borderWidth: '1px',
  radius: '10px',
  blur: '0',
  font: '',
  lineHeight: '1.45',
  extraCss: ''
}

function theme(vars: Partial<ThemeVars>): ThemeVars {
  return { ...base, ...vars }
}

export const THEMES: Record<ThemeId, ThemeVars> = {
  modern: theme({}),

  glass: theme({
    bg: 'linear-gradient(135deg, #1b2a4a 0%, #3b1f52 55%, #0f2b3d 100%)',
    bgHex: '#1b2a4a',
    panel: 'rgba(255, 255, 255, 0.12)',
    panel2: 'rgba(255, 255, 255, 0.07)',
    border: 'rgba(255, 255, 255, 0.28)',
    text: '#f4f7ff',
    muted: '#c3cde6',
    accent: '#7ce7ff',
    onAccent: '#06202b',
    input: 'rgba(255, 255, 255, 0.1)',
    blur: '18px',
    radius: '16px',
    shadow: '0 18px 50px rgba(8, 12, 30, 0.45)'
  }),

  neumorphism: theme({
    bg: '#e3e8f0',
    panel: '#e3e8f0',
    panel2: '#e9eef5',
    border: '#cdd5e1',
    text: '#2b3442',
    muted: '#6b7686',
    accent: '#4a7fd4',
    onAccent: '#ffffff',
    input: '#e9eef5',
    shadow: '9px 9px 18px #c2cad6, -9px -9px 18px #ffffff',
    borderWidth: '0px',
    radius: '18px',
    extraCss: `
      .btn { box-shadow: 5px 5px 10px #c2cad6, -5px -5px 10px #ffffff; }
      .btn:hover { box-shadow: 6px 6px 12px #c2cad6, -6px -6px 12px #ffffff; }
      .input { box-shadow: inset 3px 3px 6px #cdd5e1, inset -3px -3px 6px #ffffff; border: none; }
      .row, .btn { border: none; }
      .row--head { box-shadow: none; }
    `
  }),

  retro: theme({
    bg: '#0a0f0a',
    panel: '#0f160f',
    panel2: '#131d13',
    border: '#2b4429',
    text: '#57ff7f',
    muted: '#3f8f52',
    accent: '#9dff4f',
    onAccent: '#05140a',
    input: '#081008',
    radius: '2px',
    font: "'Cascadia Mono', Consolas, monospace",
    lineHeight: '1.35',
    extraCss: `
      .logo, .modal__title { text-transform: uppercase; letter-spacing: 0.08em; }
      .btn, .input, .row { box-shadow: none; }
      .row__act:hover { background: #17301a; }
    `
  }),

  material: theme({
    bg: '#f6f7fb',
    panel: '#ffffff',
    panel2: '#f0f3f9',
    border: '#dde3ee',
    text: '#1a1c22',
    muted: '#5f6779',
    accent: '#3f51b5',
    onAccent: '#ffffff',
    input: '#ffffff',
    radius: '14px',
    shadow: '0 6px 20px rgba(30, 40, 80, 0.12)',
    extraCss: `
      .btn { text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
      .btn--primary { box-shadow: 0 3px 10px rgba(63, 81, 181, 0.35); }
      .row, .input { border-radius: 12px; }
    `
  }),

  synthwave: theme({
    bg: 'linear-gradient(180deg, #1a0b2e 0%, #2d1b4e 55%, #0d0a1a 100%)',
    bgHex: '#1a0b2e',
    panel: '#241040',
    panel2: '#2f1854',
    border: '#6b2fa0',
    text: '#ffbdf3',
    muted: '#b98ad6',
    accent: '#ff2e88',
    onAccent: '#1a0b2e',
    input: '#1c0c33',
    shadow: '0 14px 44px rgba(10, 4, 24, 0.6)',
    font: "'Cascadia Mono', Consolas, monospace",
    extraCss: `
      .topbar { border-bottom: 2px solid var(--accent); box-shadow: 0 6px 26px rgba(255, 46, 136, 0.28); }
      .row__name { text-shadow: 0 0 8px rgba(255, 46, 136, 0.75); }
      .logo { color: #7cf9ff; text-shadow: 0 0 12px rgba(124, 249, 255, 0.8); }
      .btn--primary { box-shadow: 0 0 16px rgba(255, 46, 136, 0.55); }
    `
  }),

  clay: theme({
    bg: '#efe7de',
    bgHex: '#efe7de',
    panel: '#efe7de',
    panel2: '#f5efe8',
    border: '#dccfbf',
    text: '#3b3129',
    muted: '#7b6d5f',
    accent: '#e07a5f',
    onAccent: '#ffffff',
    input: '#f5efe8',
    shadow: '10px 10px 22px #d3c8ba, -8px -8px 20px #fffaf4',
    borderWidth: '0px',
    radius: '22px',
    extraCss: `
      .btn { box-shadow: 5px 5px 11px #d3c8ba, -5px -5px 11px #fffaf4; border: none; }
      .input { border: none; box-shadow: inset 3px 3px 7px #d3c8ba, inset -3px -3px 7px #fffaf4; }
      .row, .row--head { border: none; }
      .row:not(.row--head):hover { background: #f7f1ea; }
    `
  }),

  minimal: theme({
    bg: '#ffffff',
    panel: '#ffffff',
    panel2: '#fafafa',
    border: '#ededed',
    text: '#111111',
    muted: '#8a8a8a',
    accent: '#111111',
    onAccent: '#ffffff',
    input: '#ffffff',
    shadow: 'none',
    borderWidth: '1px',
    radius: '4px',
    blur: '0',
    extraCss: `
      .topbar, .sidebar { border-color: #ededed; }
      .btn { background: #fafafa; }
      .btn--primary { background: #111111; color: #ffffff; }
      .logo { font-weight: 600; }
      .row__grip { display: none; }
    `
  }),

  neon: theme({
    bg: '#05070d',
    panel: '#0a0e18',
    panel2: '#0e1422',
    border: '#1de9ff',
    text: '#eafcff',
    muted: '#5ec8d8',
    accent: '#ff2bd6',
    onAccent: '#ffffff',
    input: '#080c14',
    shadow: '0 0 24px rgba(29, 233, 255, 0.25)',
    extraCss: `
      .btn, .input, .row, .modal { border-color: var(--accent); }
      .row__name, .logo { color: #7df9ff; text-shadow: 0 0 10px rgba(29, 233, 255, 0.9); }
      .btn--primary { box-shadow: 0 0 18px rgba(255, 43, 214, 0.6); }
      .stats__row strong, .row__place { text-shadow: 0 0 10px rgba(255, 43, 214, 0.7); }
    `
  }),

  flat: theme({
    bg: '#eceff4',
    panel: '#ffffff',
    panel2: '#f6f8fb',
    border: '#dfe3ea',
    text: '#2c3444',
    muted: '#7b8494',
    accent: '#2f6fed',
    onAccent: '#ffffff',
    input: '#ffffff',
    shadow: 'none',
    radius: '6px',
    extraCss: `
      .btn { border: none; background: #2f6fed; color: #ffffff; }
      .btn:hover { background: #2559c9; }
      .btn--primary { background: #1e56d6; }
      .row__act { border-radius: 4px; }
      .modal { border-radius: 8px; }
    `
  })
}

export function themeVars(id: ThemeId): ThemeVars {
  return THEMES[id] ?? THEMES.modern
}

/** Цвет, который показывает поле настройки, когда пользователь ничего не выбрал. */
export function themeFallback(id: ThemeId): {
  background: string
  object: string
  panel: string
  button: string
  text: string
} {
  const vars = themeVars(id)
  return {
    background: vars.bgHex,
    object: vars.panel,
    panel: vars.panel,
    button: vars.panel2,
    text: vars.text
  }
}