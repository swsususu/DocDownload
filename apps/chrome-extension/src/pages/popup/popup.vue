<script setup lang="ts">
import {
  Eye,
  Copy,
  Download,
  Info,
  Settings,
  FolderDown,
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ref } from 'vue'
import { Flag } from '@/common/message'
import { useInitLocale } from '../shared/i18n'
import { useInitTheme } from '../shared/theme'

const { t } = useInitLocale()
useInitTheme()

const errorMessage = ref('')

const handleMessage = async (flag: Flag) => {
  if (import.meta.env.DEV) {
    console.log(`chrome.runtime.sendMessage({ flag: '${flag}'})`)
  } else {
    const result = (await chrome.runtime.sendMessage({ flag })) as
      | { ok: boolean; error?: string }
      | undefined

    if (result && !result.ok) {
      errorMessage.value = result.error ?? 'Failed to run on this page.'
      return
    }
  }

  window.close()
}

const handleOpenOptionsPage = () => {
  if (import.meta.env.DEV) {
    window.open('/pages/options', '_blank')
  } else {
    chrome.runtime.openOptionsPage()
  }
}

const handleOpenBatchDownloadPage = () => {
  if (import.meta.env.DEV) {
    window.open('/pages/batch-download.html', '_blank')
  } else {
    chrome.tabs.create({
      url: chrome.runtime.getURL('pages/batch-download.html'),
    })
  }
  window.close()
}
</script>

<template>
  <DropdownMenu :open="true">
    <DropdownMenuContent class="border-0 rounded-none">
      <p
        v-if="errorMessage"
        role="alert"
        class="max-w-64 px-2 py-1.5 text-sm text-destructive"
      >
        {{ errorMessage }}
      </p>
      <DropdownMenuItem @select="() => handleMessage(Flag.ExecuteViewScript)">
        <Eye />
        {{ t('lark.docx.view') }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="() => handleMessage(Flag.ExecuteCopyScript)">
        <Copy />
        {{ t('lark.docx.copy') }}
      </DropdownMenuItem>
      <DropdownMenuItem
        @select="() => handleMessage(Flag.ExecuteDownloadScript)"
      >
        <Download />
        {{ t('lark.docx.download') }}
      </DropdownMenuItem>
      <DropdownMenuItem @select="handleOpenBatchDownloadPage">
        <FolderDown />
        {{ t('lark.docx.batch_download') }}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        :as-child="true"
        class="underline-offset-4 hover:underline"
        href="https://github.com/swsususu/DocDownload"
        target="_blank"
      >
        <a>
          <Info />
          {{ t('help.and.feedback') }}
        </a>
      </DropdownMenuItem>
      <DropdownMenuItem
        class="underline-offset-4 hover:underline"
        @select="handleOpenOptionsPage"
      >
        <Settings />
        {{ t('settings') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
