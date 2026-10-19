import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import {
  Docx,
  docx,
  type TableWithParent,
  type mdast,
  type hast,
  BlockType,
} from '@dolphin/lark'
import { v4 as uuidv4 } from 'uuid'
import { Second, waitFor, waitForFunction } from '@dolphin/common'
import {
  SettingKey,
  Table as TableSetting,
  Grid as GridSetting,
  type Settings,
} from './settings'

interface Ref<T> {
  current: T
}

interface WithSignalOptions {
  signal?: AbortSignal
  onAbort?: () => void
}

export const withSignal = async <T>(
  inner: (isAborted: () => boolean) => Promise<T>,
  options: WithSignalOptions = {},
): Promise<T | null> => {
  const { signal, onAbort } = options

  let ref: Ref<boolean> = { current: false }
  const handler = () => {
    ref.current = true

    signal?.removeEventListener('abort', handler)

    onAbort?.()
  }

  signal?.addEventListener('abort', handler)

  let result = null

  try {
    result = await inner(() => ref.current)
  } catch (error) {
    console.error(error)
  }

  signal?.removeEventListener('abort', handler)

  // @ts-expect-error remove reference
  ref = null

  return result
}

export class UniqueFileName {
  private usedNames = new Set<string>()
  private fileNameToPreId = new Map<string, number>()

  generate(originFileName: string): string {
    let newFileName = originFileName

    while (this.usedNames.has(newFileName)) {
      const startDotIndex = originFileName.lastIndexOf('.')

      const preId = this.fileNameToPreId.get(originFileName) ?? 0
      const id = preId + 1
      this.fileNameToPreId.set(originFileName, id)

      newFileName =
        startDotIndex === -1
          ? originFileName.concat(`-${id.toFixed()}`)
          : originFileName
              .slice(0, startDotIndex)
              .concat(`-${id.toFixed()}`)
              .concat(originFileName.slice(startDotIndex))
    }

    this.usedNames.add(newFileName)

    return newFileName
  }

  generateWithUUID(originFileName: string): string {
    const startDotIndex = originFileName.lastIndexOf('.')
    const extension =
      startDotIndex === -1 ? '' : originFileName.slice(startDotIndex)
    const uuid = uuidv4()
    const newFileName = `${uuid}${extension}`

    // Ensure UUID-based names are also unique
    let finalFileName = newFileName
    let counter = 1
    while (this.usedNames.has(finalFileName)) {
      finalFileName = `${uuid}-${counter.toFixed()}${extension}`
      counter++
    }

    this.usedNames.add(finalFileName)

    return finalFileName
  }
}

export const mapTableBySettings = (
  tables: TableWithParent[],
  settings: Pick<Settings, SettingKey.Table>,
): TableWithParent[] => {
  if (settings[SettingKey.Table] === TableSetting.Filtered) {
    return []
  }

  return tables
    .map(table => {
      if (!table.inner.data?.invalid) return table

      const tableIndex = table.parent?.children.findIndex(
        child => child === table.inner,
      )

      if (tableIndex !== undefined && tableIndex !== -1) {
        const inner = {
          ...table.inner,
          children: table.inner.children.map(row => ({
            ...row,
            children: row.children.map(cell => ({
              ...cell,
              children: cell.data?.invalidChildren ?? cell.children,
            })),
          })),
        } as mdast.Table

        table.parent?.children.splice(tableIndex, 1, inner)

        return {
          ...table,
          inner,
        }
      }

      return table
    })
    .filter(table =>
      settings[SettingKey.Table] === TableSetting.NonPhrasingContentToHTML
        ? table.inner.data?.invalid
        : true,
    )
}

/**
 * Filters out redundant cells that are covered by rowSpan/colSpan
 * and adds appropriate HTML properties to the spanning cells.
 *
 * @param table The Markdown AST table to process
 */
const processTableSpans = (table: mdast.Table): void => {
  const occupied: boolean[][] = []

  for (let rowIndex = 0; rowIndex < table.children.length; rowIndex++) {
    const row = table.children[rowIndex]
    const newCells: mdast.TableCell[] = []

    for (
      let columnIndex = 0;
      columnIndex < row.children.length;
      columnIndex++
    ) {
      // If this position is covered by a previous spanning cell, skip it
      if (occupied[rowIndex]?.[columnIndex]) continue

      const cell = row.children[columnIndex]
      newCells.push(cell)

      const rowSpan = cell.data?.rowSpan ?? 1
      const colSpan = cell.data?.colSpan ?? 1

      if (rowSpan > 1 || colSpan > 1) {
        // Ensure data and hProperties objects exist
        cell.data ??= {}
        cell.data.hProperties ??= {}

        // Add HTML span properties for correct rendering
        if (rowSpan > 1) cell.data.hProperties['rowSpan'] = rowSpan
        if (colSpan > 1) cell.data.hProperties['colSpan'] = colSpan

        // Mark the area covered by this spanning cell as occupied
        for (let i = 0; i < rowSpan; i++) {
          for (let j = 0; j < colSpan; j++) {
            // Skip the current cell itself
            if (i === 0 && j === 0) continue
            const targetRow = rowIndex + i
            const targetCol = columnIndex + j
            occupied[targetRow] ??= []
            occupied[targetRow][targetCol] = true
          }
        }
      }
    }

    // Update row children with only the non-redundant cells
    row.children = newCells
  }
}

export const transformTableToHtml = (
  tables: TableWithParent[],
  options: { allowDangerousHtml: boolean } = { allowDangerousHtml: false },
): void => {
  tables.forEach(table => {
    const tableIndex = table.parent?.children.findIndex(
      child => child === table.inner,
    )
    if (tableIndex !== undefined && tableIndex !== -1) {
      processTableSpans(table.inner)

      const hastTable = toHast(table.inner, {
        allowDangerousHtml: options.allowDangerousHtml,
      })

      if (hastTable.type === 'element') {
        const hastColGroup: hast.Element = {
          type: 'element',
          tagName: 'colgroup',
          properties: {},
          children:
            table.inner.data?.colWidths?.map(width => ({
              type: 'element',
              tagName: 'col',
              properties: {
                width:
                  table.inner.data?.type === BlockType.GRID
                    ? `${width.toFixed(2)}%`
                    : width,
              },
              children: [],
            })) ?? [],
        }

        hastTable.children = ([hastColGroup] as hast.ElementContent[]).concat(
          hastTable.children,
        )
      }

      table.parent?.children.splice(tableIndex, 1, {
        type: 'html',
        value: toHtml(hastTable, {
          allowDangerousHtml: options.allowDangerousHtml,
        }),
      })
    }
  })
}

export const transformGridToHtml = (
  grids: TableWithParent[],
  options: { allowDangerousHtml: boolean } = { allowDangerousHtml: false },
): void => {
  const normalizeWidthValue = (value: string): string => {
    if (value.includes('%') || /[a-z]/i.test(value)) return value
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return value
    return numeric <= 1 ? `${String(numeric * 100)}%` : `${String(numeric)}px`
  }

  const extractColumnWidths = (table: mdast.Table): string[] | null => {
    const colWidths = (table.data as { colWidths?: number[] } | undefined)
      ?.colWidths
    if (!colWidths || colWidths.length === 0) return null
    if (table.children.length === 0) return null
    const columnCount = table.children[0].children.length
    if (colWidths.length !== columnCount) return null
    return colWidths.map(value => normalizeWidthValue(String(value)))
  }

  for (const grid of grids) {
    const gridIndex = grid.parent?.children.findIndex(
      child => child === grid.inner,
    )
    if (gridIndex !== undefined && gridIndex !== -1) {
      const hast = toHast(
        grid.inner.data?.invalid
          ? ({
              ...grid.inner,
              children: grid.inner.children.map(row => ({
                ...row,
                children: row.children.map(cell => ({
                  ...cell,
                  children: cell.data?.invalidChildren ?? cell.children,
                })),
              })),
            } as mdast.Table)
          : grid.inner,
        {
          allowDangerousHtml: options.allowDangerousHtml,
        },
      )

      const colWidths = extractColumnWidths(grid.inner)
      if (colWidths) {
        const colgroup: hast.Element = {
          type: 'element',
          tagName: 'colgroup',
          properties: {},
          children: colWidths.map(width => ({
            type: 'element',
            tagName: 'col',
            properties: {
              style: `width: ${width}`,
            },
            children: [],
          })),
        }
        if (hast.type === 'element') {
          hast.children = ([colgroup] as hast.ElementContent[]).concat(
            hast.children,
          )
        }
      }

      grid.parent?.children.splice(gridIndex, 1, {
        type: 'html',
        value: toHtml(hast, {
          allowDangerousHtml: options.allowDangerousHtml,
        }),
      })
    }
  }
}

export const transformMentionUsers = async (
  mentionUsers: mdast.InlineCode[],
): Promise<void> => {
  for (const user of mentionUsers) {
    if (user.data?.parentBlockRecordId && user.data.mentionUserId) {
      await waitForFunction(
        () =>
          Docx.locateBlockWithRecordId(
            user.data?.parentBlockRecordId ?? '',
          ).then(
            isSuccess =>
              isSuccess &&
              document.querySelector(
                `a[data-token="${user.data?.mentionUserId ?? ''}"]`,
              ) !== null,
          ),
        {
          timeout: 3 * Second,
        },
      )

      const el: HTMLElement | null = document.querySelector(
        `a[data-token="${user.data.mentionUserId}"]`,
      )

      if (el?.innerText) {
        user.value = '@' + el.innerText
      }
    }
  }
}

export const transformTableBySettings = (
  tables: TableWithParent[],
  settings: Pick<Settings, SettingKey.Table | SettingKey.Grid>,
): void => {
  if (settings[SettingKey.Grid] === GridSetting.ToHTML) {
    transformGridToHtml(
      tables.filter(item => item.inner.data?.type === BlockType.GRID),
      {
        allowDangerousHtml: true,
      },
    )
  }

  transformTableToHtml(
    mapTableBySettings(
      settings[SettingKey.Grid] === GridSetting.ToHTML
        ? tables.filter(item => item.inner.data?.type !== BlockType.GRID)
        : tables,
      settings,
    ),
    {
      allowDangerousHtml: true,
    },
  )
}

const IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
}

/**
 * Resolves a file name for an image. Some images have no `name` in their
 * block snapshot (#63); fall back to `image-{token}.{ext}` so they are not
 * dropped. `ext` is inferred from `mimeType` and defaults to `png`.
 */
export const resolveImageName = (options: {
  name?: string | null
  token?: string | null
  mimeType?: string | null
}): string => {
  const name = options.name?.trim()
  if (name) return name

  const mime = (options.mimeType ?? '').split(';')[0].trim().toLowerCase()
  const ext = IMAGE_MIME_TO_EXT[mime] ?? 'png'
  const token = (options.token ?? '').replace(/[^\w-]/g, '_')

  return token ? `image-${token}.${ext}` : `image.${ext}`
}

/**
 * `String(error)` can be empty (e.g. `new Error('')` stringifies to `Error`,
 * but `''`, `{ toString: () => '' }` and the like do not); use a fallback then.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  let message = ''
  try {
    message = String(error).trim()
  } catch {
    // ignore
  }

  return message || fallback
}

/**
 * Downloading a file may fail (e.g. 403). Such links have an empty url and
 * would be stringified as `[name]()`; degrade them to plain text instead.
 */
export const degradeFailedFileLinks = (files: mdast.Link[]): void => {
  for (const file of files) {
    if (file.url) continue

    const text = file.data?.name ?? ''
    const node = file as unknown as Record<string, unknown>

    for (const key of Object.keys(node)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete node[key]
    }
    node['type'] = 'text'
    node['value'] = text
  }
}

/**
 * Progress ratio in [0, 1], or `null` when the total size is unknown.
 */
export const getProgressRatio = (
  received: number,
  total: number,
): number | null => {
  if (!Number.isFinite(total) || total <= 0) return null

  return Math.min(Math.max(received / total, 0), 1)
}

const LOCATE_BLOCK_TIMEOUT = 3 * Second
const SCROLL_STEP_INTERVAL = 0.3 * Second

/**
 * Extra passes to load content of long documents when scrolling to the bottom
 * was not enough (#141): scroll from top to bottom by viewport-sized steps,
 * then locate each pending / fallback-whiteboard top-level block.
 * Stops as soon as `isReady()` is true, `isCancelled()` is true or `deadline`
 * (epoch ms) is reached.
 */
export const loadPendingContent = async (options: {
  isReady: () => boolean
  isCancelled: () => boolean
  deadline: number
}): Promise<void> => {
  const { isReady, isCancelled, deadline } = options

  const shouldStop = () => isReady() || isCancelled() || Date.now() >= deadline

  if (shouldStop()) return

  const container = docx.container
  if (container) {
    const step = Math.max(container.clientHeight, 300)

    for (let top = 0; top < container.scrollHeight; top += step) {
      if (shouldStop()) return

      docx.scrollTo({ top, behavior: 'instant' })

      await waitFor(SCROLL_STEP_INTERVAL)
    }
  }

  const children = docx.rootBlock?.children ?? []
  for (const block of children) {
    if (shouldStop()) return

    const isPending = block.snapshot.type === 'pending'
    const isFallbackWhiteboard =
      block.type === BlockType.FALLBACK &&
      block.snapshot.type === BlockType.WHITEBOARD

    const recordId = block.record?.id
    if (!recordId || !(isPending || isFallbackWhiteboard)) continue

    await Promise.race([
      Docx.locateBlockWithRecordId(recordId),
      waitFor(LOCATE_BLOCK_TIMEOUT),
    ])

    await waitFor(SCROLL_STEP_INTERVAL)
  }
}
