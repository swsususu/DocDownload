# Notice / 声明

DocDownload is a derivative work of **Cloud Document Converter**.

DocDownload 是 **Cloud Document Converter** 的衍生作品（分支）。

## Original work / 原始项目

- Project / 项目: Cloud Document Converter
- Repository / 仓库: <https://github.com/whale4113/cloud-document-converter>
- Original author / 原作者: Junji Lu ([@whale4113](https://github.com/whale4113), formerly [@lujunji4113](https://github.com/lujunji4113))
- Copyright / 版权: Copyright (c) 2024 - present Junji Lu
- License / 许可证: MIT License

All code in this repository that originates from Cloud Document Converter remains the work of its original author and contributors, and is used under the MIT License. The original copyright and permission notice is preserved in [LICENSE](./LICENSE), as the license requires.

本仓库中源自 Cloud Document Converter 的代码，其著作权仍归原作者及贡献者所有，并按 MIT 许可证使用。依照许可证要求，原版权声明与许可声明保留在 [LICENSE](./LICENSE) 中。

The original Git history, including the commit authorship of all upstream contributors, is preserved in this repository.

上游全部贡献者的提交记录（含作者署名）已完整保留在本仓库的 Git 历史中。

## Not affiliated / 无隶属关系

DocDownload is an independent fork. It is **not** published, endorsed, or supported by the original author. The Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons listings of "Cloud Document Converter" belong to the original project and are not related to this repository. Please do not report problems of this fork to the original author.

DocDownload 是一个独立分支，**并非**原作者发布、认可或提供支持。Chrome 应用商店、Microsoft Edge 加载项、Firefox 附加组件中的 “Cloud Document Converter” 属于原项目，与本仓库无关。请勿就本分支的问题联系原作者。

## Modifications in DocDownload / 本分支的改动

Changes relative to Cloud Document Converter 1.11.0 (`@dolphin/lark` 2.6.6):

相对于 Cloud Document Converter 1.11.0（`@dolphin/lark` 2.6.6）的改动：

- Renamed the product to DocDownload and updated the user-facing links. / 产品更名为 DocDownload，并更新面向用户的链接。
- Security: iframe blocks only emit `http(s)` URLs and HTML-escape the `src`; highlight colors are validated before being written to `style` (upstream issue #144). / 安全：iframe 仅输出 http(s) 链接并转义 `src`；高亮颜色写入 `style` 前先校验（上游 issue #144）。
- Markdown output: no more `&#x20;` / `&#x7B49;` entities around bold, italic and strikethrough runs (upstream issue #94). / Markdown 输出：加粗、斜体、删除线两端不再出现 `&#x20;`、`&#x7B49;` 等实体（上游 issue #94）。
- Markdown output: image and link URLs containing parentheses are written as `<...>` destinations instead of `\(` `\)` (upstream issue #112). / Markdown 输出：含括号的图片、链接地址写成 `<...>`，不再出现 `\(` `\)`（上游 issue #112）。
- Downloading while a download is already running no longer opens a second save dialog (upstream issue #122). / 下载进行中再次触发不会再弹出第二个保存对话框（上游 issue #122）。

The `@dolphin/*` package names are kept from upstream. / 为减少改动，沿用上游的 `@dolphin/*` 包名。
