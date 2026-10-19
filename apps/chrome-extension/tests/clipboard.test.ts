/* eslint-disable @typescript-eslint/no-deprecated */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { writeToClipboard } from '../src/common/clipboard'

const setClipboard = (clipboard: unknown) => {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  })
}

describe('writeToClipboard', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public items: Record<string, Blob>) {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses clipboard.write first', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn()
    setClipboard({ write, writeText })

    await writeToClipboard({ text: 'a', html: '<p>a</p>' })

    expect(write).toHaveBeenCalledTimes(1)
    expect(writeText).not.toHaveBeenCalled()
    const calls = write.mock.calls as [{ items: Record<string, Blob> }[]][]
    expect(Object.keys(calls[0][0][0].items)).toEqual([
      'text/plain',
      'text/html',
    ])
  })

  it('falls back to writeText when write rejects', async () => {
    const write = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setClipboard({ write, writeText })

    await writeToClipboard({ text: 'a' })

    expect(writeText).toHaveBeenCalledWith('a')
  })

  it('falls back to execCommand when clipboard api fails', async () => {
    setClipboard({
      write: vi.fn().mockRejectedValue(new Error('x')),
      writeText: vi.fn().mockRejectedValue(new Error('y')),
    })
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec

    await writeToClipboard({ text: 'a' })

    expect(exec).toHaveBeenCalledWith('copy')
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('falls back to execCommand when clipboard is unavailable', async () => {
    setClipboard(undefined)
    const exec = vi.fn().mockReturnValue(true)
    document.execCommand = exec

    await writeToClipboard({ text: 'a' })

    expect(exec).toHaveBeenCalledWith('copy')
  })

  it('throws when all strategies fail', async () => {
    setClipboard({
      write: vi.fn().mockRejectedValue(new Error('x')),
      writeText: vi.fn().mockRejectedValue(new Error('y')),
    })
    document.execCommand = vi.fn().mockReturnValue(false)

    await expect(writeToClipboard({ text: 'a' })).rejects.toThrow(
      'Failed to write to clipboard',
    )
  })
})
