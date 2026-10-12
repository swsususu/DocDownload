import type * as mdast from 'mdast'
import {
  defaultHandlers,
  type Handle,
  type Info,
  type State,
} from 'mdast-util-to-markdown'

const hasParentheses = (url: string) => /[()]/.test(url)

/**
 * @description Writes `<url>` + optional title + `)`, i.e. the part of a link
 * or image that follows `](`. Parentheses inside a `<...>` destination do not
 * need to be escaped, which keeps file names such as `a(1).png` intact.
 */
const writeLiteralDestination = (
  node: mdast.Image | mdast.Link,
  state: State,
  tracker: ReturnType<State['createTracker']>,
  value: string,
): string => {
  const subexit = state.enter('destinationLiteral')
  value += tracker.move('<')
  value += tracker.move(
    state.safe(node.url, { before: value, after: '>', ...tracker.current() }),
  )
  value += tracker.move('>')
  subexit()

  if (node.title) {
    const titleExit = state.enter('titleQuote')
    value += tracker.move(' "')
    value += tracker.move(
      state.safe(node.title, {
        before: value,
        after: '"',
        ...tracker.current(),
      }),
    )
    value += tracker.move('"')
    titleExit()
  }

  return value + tracker.move(')')
}

const image: Handle = (node: mdast.Image, parent, state, info: Info) => {
  if (!hasParentheses(node.url)) {
    return defaultHandlers.image(node, parent, state, info)
  }

  const exit = state.enter('image')
  const labelExit = state.enter('label')
  const tracker = state.createTracker(info)
  let value = tracker.move('![')
  value += tracker.move(
    state.safe(node.alt, { before: value, after: ']', ...tracker.current() }),
  )
  value += tracker.move('](')
  labelExit()

  value = writeLiteralDestination(node, state, tracker, value)
  exit()

  return value
}
image.peek = () => '!'

const link: Handle = (node: mdast.Link, parent, state, info: Info) => {
  if (!hasParentheses(node.url)) {
    return defaultHandlers.link(node, parent, state, info)
  }

  const exit = state.enter('link')
  const labelExit = state.enter('label')
  const tracker = state.createTracker(info)
  let value = tracker.move('[')
  value += tracker.move(
    state.containerPhrasing(node, {
      before: value,
      after: '](',
      ...tracker.current(),
    }),
  )
  value += tracker.move('](')
  labelExit()

  value = writeLiteralDestination(node, state, tracker, value)
  exit()

  return value
}
link.peek = () => '['

export const handlers = { image, link }

const isEmphasisLike = (
  node: mdast.PhrasingContent,
): node is mdast.Emphasis | mdast.Strong | mdast.Delete =>
  node.type === 'emphasis' || node.type === 'strong' || node.type === 'delete'

const LEADING_WHITESPACE = /^\s+/
const TRAILING_WHITESPACE = /\s+$/

/**
 * @description Markdown emphasis delimiters cannot be flanked by whitespace
 * inside the emphasized text (`**foo **bar` is not bold). Lark allows such
 * runs, and `mdast-util-to-markdown` then hex-encodes neighbouring characters
 * (`&#x20;`, `&#x7B49;`) to keep the output valid. Move the edge whitespace out
 * of `emphasis`/`strong`/`delete` nodes instead.
 */
export const hoistEdgeWhitespace = (
  nodes: mdast.PhrasingContent[],
): mdast.PhrasingContent[] => {
  const result: mdast.PhrasingContent[] = []

  const pushText = (value: string) => {
    if (!value) return

    const last = result.at(-1)
    if (last?.type === 'text') {
      last.value += value
    } else {
      result.push({ type: 'text', value })
    }
  }

  for (const node of nodes) {
    if (!isEmphasisLike(node)) {
      if (node.type === 'text') {
        pushText(node.value)
      } else {
        result.push(node)
      }
      continue
    }

    let children = hoistEdgeWhitespace(node.children)

    let leading = ''
    let trailing = ''

    const first = children.at(0)
    if (first?.type === 'text') {
      leading = LEADING_WHITESPACE.exec(first.value)?.[0] ?? ''
      first.value = first.value.slice(leading.length)
    }

    const last = children.at(-1)
    if (last?.type === 'text') {
      trailing = TRAILING_WHITESPACE.exec(last.value)?.[0] ?? ''
      last.value = last.value.slice(0, last.value.length - trailing.length)
    }

    children = children.filter(
      child => child.type !== 'text' || child.value.length > 0,
    )

    pushText(leading)
    if (children.length > 0) {
      result.push({ ...node, children } as mdast.PhrasingContent)
    }
    pushText(trailing)
  }

  return result
}

/**
 * @description Whitespace at the very start/end of a paragraph carries no
 * meaning in Markdown, but `mdast-util-to-markdown` would encode it as
 * `&#x20;`. Drop it.
 */
export const trimEdgeWhitespace = (
  nodes: mdast.PhrasingContent[],
): mdast.PhrasingContent[] => {
  const result = nodes.filter(node => node.type !== 'text' || node.value !== '')

  const first = result.at(0)
  if (first?.type === 'text') {
    result[0] = { ...first, value: first.value.replace(LEADING_WHITESPACE, '') }
  }

  const lastIndex = result.length - 1
  const last = result.at(lastIndex)
  if (last?.type === 'text') {
    result[lastIndex] = {
      ...last,
      value: last.value.replace(TRAILING_WHITESPACE, ''),
    }
  }

  return result.filter(node => node.type !== 'text' || node.value.length > 0)
}
