export interface ClipboardContent {
  text: string
  html?: string
}

// clipboard methods may be intercepted and overridden by websites,
// so prefer the ones from the prototype
const getClipboardMethod = <K extends 'write' | 'writeText'>(
  clipboard: Clipboard,
  name: K,
): Clipboard[K] | undefined => {
  const fromProto = (Object.getPrototypeOf(clipboard) as Clipboard | null)?.[
    name
  ]
  const method =
    typeof fromProto === 'function' ? fromProto : (clipboard[name] as unknown)

  return typeof method === 'function'
    ? ((method as (...args: unknown[]) => unknown).bind(
        clipboard,
      ) as Clipboard[K])
    : undefined
}

const writeByExecCommand = ({ text }: ClipboardContent) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)

  try {
    textarea.focus()
    textarea.select()
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- last-resort fallback
    if (!document.execCommand('copy')) {
      throw new Error('document.execCommand("copy") returned false')
    }
  } finally {
    textarea.remove()
  }
}

/**
 * Write content to clipboard, trying in order:
 * clipboard.write(ClipboardItem) -> clipboard.writeText -> execCommand('copy').
 * Throws when all strategies fail.
 */
export const writeToClipboard = async (
  content: ClipboardContent,
): Promise<void> => {
  const errors: unknown[] = []
  const clipboard = (globalThis.navigator as Navigator | undefined)?.clipboard

  if (clipboard && typeof ClipboardItem !== 'undefined') {
    try {
      const write = getClipboardMethod(clipboard, 'write')
      if (!write) throw new Error('clipboard.write is not available')

      const items: Record<string, Blob> = {
        'text/plain': new Blob([content.text], { type: 'text/plain' }),
      }
      if (content.html !== undefined) {
        items['text/html'] = new Blob([content.html], { type: 'text/html' })
      }
      await write([new ClipboardItem(items)])

      return
    } catch (error) {
      errors.push(error)
    }
  }

  if (clipboard) {
    try {
      const writeText = getClipboardMethod(clipboard, 'writeText')
      if (!writeText) throw new Error('clipboard.writeText is not available')
      await writeText(content.text)

      return
    } catch (error) {
      errors.push(error)
    }
  }

  try {
    writeByExecCommand(content)

    return
  } catch (error) {
    errors.push(error)
  }

  throw new AggregateError(errors, 'Failed to write to clipboard')
}
