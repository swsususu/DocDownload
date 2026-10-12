import { describe, expect, test } from 'vitest'
import type * as mdast from 'mdast'
import {
  BlockType,
  Docx,
  Transformer,
  isSafeHttpUrl,
  toSafeCssColor,
  transformOperationsToPhrasingContents,
} from '../src/docx'
import { hoistEdgeWhitespace, trimEdgeWhitespace } from '../src/utils/markdown'

const text = (value: string): mdast.Text => ({ type: 'text', value })

const stringifyParagraph = (children: mdast.PhrasingContent[]) =>
  Docx.stringify({
    type: 'root',
    children: [{ type: 'paragraph', children }],
  })

describe('iframe injection (#144)', () => {
  const transformIframe = (url: string) => {
    const transformer = new Transformer()

    return transformer.transform({
      id: 1,
      type: BlockType.PAGE,
      snapshot: { type: BlockType.PAGE },
      children: [
        {
          id: 2,
          type: BlockType.IFRAME,
          snapshot: {
            type: BlockType.IFRAME,
            iframe: { height: 300, component: { url } },
          },
          children: [],
        },
      ],
    })
  }

  test('drops non-http(s) urls', () => {
    for (const url of [
      'javascript:alert(document.domain)',
      'data:text/html,<script>alert(1)</script>',
      'not a url',
    ]) {
      const { root } = transformIframe(url)

      expect(Docx.stringify(root)).toBe('')
    }
  })

  test('escapes quote break-out in urls', () => {
    const { root } = transformIframe(
      'https://example.com/"></iframe><script>alert(1)</script><iframe src="x',
    )
    const markdown = Docx.stringify(root)

    expect(markdown).not.toContain('<script>')
    expect(markdown.match(/<iframe/g)).toHaveLength(1)
    expect(markdown.match(/<\/iframe>/g)).toHaveLength(1)
    expect(markdown).toContain('&quot;')
  })

  test('isSafeHttpUrl', () => {
    expect(isSafeHttpUrl('https://a.b/c?d=1')).toBe(true)
    expect(isSafeHttpUrl('http://a.b')).toBe(true)
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isSafeHttpUrl('//a.b')).toBe(false)
  })
})

describe('highlight color injection', () => {
  test('toSafeCssColor', () => {
    expect(toSafeCssColor('#ff0000')).toBe('#ff0000')
    expect(toSafeCssColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)')
    expect(toSafeCssColor('rgba(255,0,0,0.5)')).toBe('rgba(255,0,0,0.5)')
    expect(toSafeCssColor('red')).toBe('red')
    expect(toSafeCssColor(undefined)).toBe('inherit')
    expect(toSafeCssColor('red"><script>alert(1)</script>')).toBe('inherit')
    expect(toSafeCssColor('red; background: url(x)')).toBe('inherit')
  })

  test('malicious color does not reach the output', () => {
    const { contents } = transformOperationsToPhrasingContents(
      [
        {
          insert: 'hi',
          attributes: { textHighlight: '"><script>alert(1)</script>' },
        },
      ],
      { highlight: true },
    )

    expect(stringifyParagraph(contents)).toBe(
      '<span style="color: inherit; background-color: inherit">hi</span>\n',
    )
  })
})

describe('entity encoding of whitespace around emphasis (#94)', () => {
  test('leading and trailing whitespace is moved out of strong', () => {
    const nodes = hoistEdgeWhitespace([
      { type: 'strong', children: [text('Plain ')] },
      text('Text'),
    ])

    expect(stringifyParagraph(nodes)).toBe('**Plain** Text\n')
  })

  test('CJK neighbours are not hex-encoded', () => {
    const nodes = hoistEdgeWhitespace([
      text('等'),
      { type: 'emphasis', children: [text(' x')] },
    ])

    expect(stringifyParagraph(nodes)).toBe('等 *x*\n')
  })

  test('nested emphasis and whitespace-only emphasis', () => {
    const nodes = hoistEdgeWhitespace([
      text('a'),
      {
        type: 'strong',
        children: [{ type: 'emphasis', children: [text(' b ')] }],
      },
      { type: 'delete', children: [text('  ')] },
      text('c'),
    ])

    expect(stringifyParagraph(nodes)).toBe('a ***b***   c\n')
  })

  test('keeps non-text children', () => {
    const nodes = trimEdgeWhitespace(
      hoistEdgeWhitespace([
        {
          type: 'strong',
          children: [text('x '), { type: 'inlineCode', value: 'y' }, text(' ')],
        },
      ]),
    )

    expect(stringifyParagraph(nodes)).toBe('**x `y`**\n')
  })

  test('trimEdgeWhitespace drops paragraph edge whitespace', () => {
    const nodes = trimEdgeWhitespace([text(' plain text '), text('')])

    expect(stringifyParagraph(nodes)).toBe('plain text\n')
  })
})

describe('parentheses in image and link urls (#112)', () => {
  test('image url with parentheses is not backslash escaped', () => {
    expect(
      stringifyParagraph([
        { type: 'image', url: 'images/a(1).png', alt: '', title: null },
      ]),
    ).toBe('![](<images/a(1).png>)\n')
  })

  test('link url with parentheses is not backslash escaped', () => {
    expect(
      stringifyParagraph([
        { type: 'link', url: 'files/a(1).pdf', children: [text('doc')] },
      ]),
    ).toBe('[doc](<files/a(1).pdf>)\n')
  })

  test('urls without parentheses are unchanged', () => {
    expect(
      stringifyParagraph([
        { type: 'image', url: 'images/a.png', alt: 'x', title: null },
        { type: 'link', url: 'https://a.b/c', children: [text('l')] },
      ]),
    ).toBe('![x](images/a.png)[l](https://a.b/c)\n')
  })
})
