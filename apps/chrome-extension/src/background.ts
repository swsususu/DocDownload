import { type Message } from './common/message'

const sharedDocumentUrlPatterns: string[] = [
  'https://*.feishu.cn/*',
  'https://*.feishu.net/*',
  'https://*.larksuite.com/*',
  'https://*.feishu-pre.net/*',
  'https://*.larkoffice.com/*',
  'https://*.larkenterprise.com/*',
]

enum MenuItemId {
  DOWNLOAD_DOCX_AS_MARKDOWN = 'download_docx_as_markdown',
  COPY_DOCX_AS_MARKDOWN = 'copy_docx_as_markdown',
  VIEW_DOCX_AS_MARKDOWN = 'view_docx_as_markdown',
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN,
      title: chrome.i18n.getMessage('download_docx_as_markdown'),
      documentUrlPatterns: sharedDocumentUrlPatterns,
      contexts: ['page', 'editable'],
    })

    chrome.contextMenus.create({
      id: MenuItemId.COPY_DOCX_AS_MARKDOWN,
      title: chrome.i18n.getMessage('copy_docx_as_markdown'),
      documentUrlPatterns: sharedDocumentUrlPatterns,
      contexts: ['page', 'editable'],
    })

    chrome.contextMenus.create({
      id: MenuItemId.VIEW_DOCX_AS_MARKDOWN,
      title: chrome.i18n.getMessage('view_docx_as_markdown'),
      documentUrlPatterns: sharedDocumentUrlPatterns,
      contexts: ['page', 'editable'],
    })
  })
})

const executeScriptByFlag = async (flag: string | number, tabId: number) => {
  switch (flag) {
    case MenuItemId.DOWNLOAD_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/download-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    case MenuItemId.COPY_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/copy-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    case MenuItemId.VIEW_DOCX_AS_MARKDOWN:
      await chrome.scripting.executeScript({
        files: ['bundles/scripts/view-lark-docx-as-markdown.js'],
        target: { tabId },
        world: 'MAIN',
      })
      break
    default:
      break
  }
}

chrome.contextMenus.onClicked.addListener(({ menuItemId }, tab) => {
  if (tab?.id !== undefined) {
    executeScriptByFlag(menuItemId, tab.id).catch(console.error)
  }
})

interface ExecuteResult {
  ok: boolean
  error?: string
}

chrome.runtime.onMessage.addListener((_message, sender, sendResponse) => {
  const message = _message as Partial<Message> | null | undefined

  // Only handle script execution requests; other messages (e.g. batch download) are handled elsewhere
  if (typeof message?.flag !== 'string') {
    return false
  }
  const flag = message.flag

  const executeScript = async (): Promise<ExecuteResult> => {
    // Prefer the tab that sent the message (content script button), otherwise
    // fall back to the active tab of the last focused window (popup).
    let tabId = sender.tab?.id

    if (tabId === undefined) {
      const activeTabs = await chrome.tabs.query({
        lastFocusedWindow: true,
        active: true,
      })
      tabId = activeTabs.at(0)?.id
    }

    if (tabId === undefined) {
      return {
        ok: false,
        error: chrome.i18n.getMessage('script_inject_failed'),
      }
    }

    try {
      await executeScriptByFlag(flag, tabId)
      return { ok: true }
    } catch (error) {
      console.error(error)
      const detail = error instanceof Error ? error.message : String(error)
      return {
        ok: false,
        error: `${chrome.i18n.getMessage('script_inject_failed')} (${detail})`,
      }
    }
  }

  executeScript().then(sendResponse).catch(console.error)

  return true
})
