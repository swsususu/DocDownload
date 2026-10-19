export type PageKind =
  | 'docx'
  | 'wiki'
  | 'doc'
  | 'sheet'
  | 'bitable'
  | 'mindnote'
  | 'slides'
  | 'unknown'

const PREFIXES: [string, PageKind][] = [
  ['/docx/', 'docx'],
  ['/wiki/', 'wiki'],
  ['/docs/', 'doc'],
  ['/sheets/', 'sheet'],
  ['/base/', 'bitable'],
  ['/mindnotes/', 'mindnote'],
  ['/slides/', 'slides'],
]

export const detectPageKind = (url: string): PageKind => {
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch {
    return 'unknown'
  }

  // Locale prefix is not used by Lark doc urls, match by pathname prefix only
  return (
    PREFIXES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'unknown'
  )
}

export const isUnsupportedKind = (kind: PageKind): boolean =>
  kind === 'sheet' ||
  kind === 'bitable' ||
  kind === 'mindnote' ||
  kind === 'slides'
