import { describe, expect, it } from 'vitest'
import type { mdast } from '@dolphin/lark'
import {
  UniqueFileName,
  degradeFailedFileLinks,
  getErrorMessage,
  getProgressRatio,
  resolveImageName,
} from '../src/common/utils'

describe('UniqueFileName', () => {
  it('should generate unique filename', () => {
    const uniqueFilename = new UniqueFileName()
    const filename = uniqueFilename.generate('test.txt')
    expect(filename).toBe('test.txt')

    const filename2 = uniqueFilename.generate('test.txt')
    expect(filename2).toBe('test-1.txt')

    const filename3 = uniqueFilename.generate('test-1.txt')
    expect(filename3).toBe('test-1-1.txt')

    const filename4 = uniqueFilename.generate('test-2.txt')
    expect(filename4).toBe('test-2.txt')

    const filename5 = uniqueFilename.generate('test.txt')
    expect(filename5).toBe('test-3.txt')
  })
})

describe('resolveImageName', () => {
  it('keeps the original name', () => {
    expect(resolveImageName({ name: 'a.jpg', token: 't' })).toBe('a.jpg')
  })

  it('falls back to image-{token}.{ext} inferred from mimeType', () => {
    expect(
      resolveImageName({ name: '', token: 'abc', mimeType: 'image/jpeg' }),
    ).toBe('image-abc.jpg')
    expect(
      resolveImageName({
        name: undefined,
        token: 'abc',
        mimeType: 'image/webp',
      }),
    ).toBe('image-abc.webp')
    expect(
      resolveImageName({
        name: '  ',
        token: 'abc',
        mimeType: 'image/svg+xml; charset=utf-8',
      }),
    ).toBe('image-abc.svg')
  })

  it('defaults to png and handles missing token', () => {
    expect(resolveImageName({ token: 'abc' })).toBe('image-abc.png')
    expect(resolveImageName({ token: 'abc', mimeType: 'foo/bar' })).toBe(
      'image-abc.png',
    )
    expect(resolveImageName({})).toBe('image.png')
  })

  it('sanitizes unsafe characters in token', () => {
    expect(resolveImageName({ token: 'a/b\\c' })).toBe('image-a_b_c.png')
  })
})

describe('getErrorMessage', () => {
  it('uses fallback when the message is empty', () => {
    expect(getErrorMessage('', 'fallback')).toBe('fallback')
    expect(getErrorMessage({ toString: () => '' }, 'fallback')).toBe('fallback')
  })

  it('returns the stringified error otherwise', () => {
    expect(getErrorMessage(new Error('boom'), 'fallback')).toBe('Error: boom')
  })
})

describe('getProgressRatio', () => {
  it('returns null for unknown totals', () => {
    expect(getProgressRatio(10, 0)).toBeNull()
    expect(getProgressRatio(10, Number.NaN)).toBeNull()
    expect(getProgressRatio(10, -1)).toBeNull()
  })

  it('clamps to [0, 1]', () => {
    expect(getProgressRatio(5, 10)).toBe(0.5)
    expect(getProgressRatio(20, 10)).toBe(1)
  })
})

describe('degradeFailedFileLinks', () => {
  it('turns links without url into plain text', () => {
    const failed: mdast.Link = {
      type: 'link',
      url: '',
      children: [{ type: 'text', value: 'video.mp4' }],
      data: { name: 'video.mp4' },
    }
    const ok: mdast.Link = {
      type: 'link',
      url: 'files/a.txt',
      children: [{ type: 'text', value: 'a.txt' }],
      data: { name: 'a.txt' },
    }

    degradeFailedFileLinks([failed, ok])

    expect(failed).toEqual({ type: 'text', value: 'video.mp4' })
    expect(ok.type).toBe('link')
    expect(ok.url).toBe('files/a.txt')
  })
})
