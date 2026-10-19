import { describe, expect, it } from 'vitest'
import { detectPageKind } from '../src/common/page-kind'

describe('detectPageKind', () => {
  it.each([
    ['https://my.feishu.cn/docx/abc', 'docx'],
    ['https://my.feishu.cn/wiki/abc?from=x', 'wiki'],
    ['https://my.feishu.cn/docs/abc', 'doc'],
    ['https://my.feishu.cn/sheets/abc', 'sheet'],
    ['https://my.feishu.cn/base/abc', 'bitable'],
    ['https://my.feishu.cn/mindnotes/abc', 'mindnote'],
    ['https://my.feishu.cn/slides/abc', 'slides'],
    ['https://my.feishu.cn/drive/home', 'unknown'],
    ['not a url', 'unknown'],
  ])('%s -> %s', (url, kind) => {
    expect(detectPageKind(url)).toBe(kind)
  })
})
