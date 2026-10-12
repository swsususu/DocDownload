<p align="center">
  <p align="center">
   <img width="150" height="150" src="apps/chrome-extension/design/logo.svg" alt="Logo">
  </p>
	<h1 align="center"><b>DocDownload</b></h1>
</p>

DocDownload 是一个浏览器扩展， 支持下载、复制飞书云文档为 Markdown。它是 [whale4113/cloud-document-converter](https://github.com/whale4113/cloud-document-converter)（MIT）的分支。

[English](./README.md) · **简体中文**

# 安装

DocDownload 没有上架任何浏览器扩展商店，请从源码构建后以“加载已解压的扩展程序”方式安装：

```shell
pnpm install
pnpm run build
```

然后打开 `chrome://extensions`（或 `edge://extensions`），开启**开发者模式**，点击**加载已解压的扩展程序**，选择 `apps/chrome-extension/dist` 目录。

> Chrome 应用商店、Microsoft Edge 加载项、Firefox 附加组件中的 “Cloud Document Converter” 属于原项目，与本分支无关。

# 功能

- 下载飞书云文档为 Markdown

- 复制飞书云文档为 Markdown

  > ❗注意: 通过这种方式生成的图像 URL 只有两个小时的访问时间。这意味着两小时后，将无法再访问图像资源。

# 兼容性

## 块级元素

| **飞书云文档**        | **支持情况** | **Markdown**                      |
| --------------------- | ------------ | --------------------------------- |
| 分割线                | ✅            | Thematic Break                    |
| 标题 (一级至六级)     | ✅            | ATX Headings (Level 1 to level 6) |
| 标题 (七级至九级)     | ✅            | Paragraph                         |
| 代码块                | ✅            | Code Block                        |
| 引用                  | ✅            | Blockquote                        |
| 无序列表              | ✅            | Bullet list                       |
| 有序列表              | ✅            | Ordered list                      |
| 任务列表              | ✅            | Task list                         |
| 表格                  | ✅            | Table                             |
| 图片                  | ✅            | Image                             |
| 公示                  | ✅            | Math Block                        |
| 高亮块                | ❌            | Blockquote                        |
| 引用块                | ✅            |                                   |
| 图表 (流程图、UML 图) | ❌            | Image（仅下载支持）               |
| 分栏                  | ✅            | Flatten/Table/HTML               |
| 多维表格              | 待定         |                                   |
| 群名片                | 待定         |                                   |
| 文件                  | ❌            | Link（仅下载支持）                |
| 内嵌网页              | ✅            | HTML                              |
| 小组件                | 待定         | 文本绘图 -> Code Block ✅          |
| 思维笔记              | 待定         |                                   |
| 电子表格              | 待定         |                                   |

## 行内元素

| **飞书云文档** | **支持情况** | **Markdown** |
| -------------- | ------------ | ------------ |
| 加粗           | ✅            | Bold         |
| 删除线         | ✅            | Delete       |
| 倾斜           | ✅            | Italic       |
| 行内代码       | ✅            | Inline Code  |
| 链接           | ✅            | Link         |
| 字体颜色       | ✅            | HTML         |
| 字体背景色     | ✅            | HTML         |
| 下划线        | ✅            | HTML (`<u>`) |

## 其它

- 缩进和对齐：待定

# 贡献

如果你有兴趣修复问题并直接为代码库做出贡献，请参阅文档 [如何贡献](./contributing.md)。

# 致谢与许可

DocDownload 是 **Junji Lu**（[@whale4113](https://github.com/whale4113)）及其贡献者的 [Cloud Document Converter](https://github.com/whale4113/cloud-document-converter) 的分支。包括飞书文档块到 Markdown 的转换、扩展框架、批量下载工作台在内的大部分代码由原作者及贡献者编写。如果这个项目对你有用，也请考虑支持[原项目](https://github.com/whale4113/cloud-document-converter)。

本项目以 [MIT 许可证](./LICENSE) 发布，并保留原版权声明。关于署名及本分支的改动清单，详见 [NOTICE.md](./NOTICE.md)。

DocDownload 是独立分支，与原作者无隶属关系，也未获其背书。

# 免责声明

本项目（以下简称“项目”）仅供参考和学习使用。作者尽力确保项目的准确性和可靠性，但不提供任何明示或暗示的保证，包括但不限于对项目的适销性、特定用途的适用性或无侵权的保证。

作者不对因使用本项目而产生的任何直接、间接、偶然、特殊、惩罚性或结果性损害承担任何责任，包括但不限于因使用、误用、或依赖项目中的信息而导致的利润损失、业务中断或数据丢失。

本项目中的所有内容均基于作者的个人见解和经验，不代表任何组织或公司的观点。

使用者应自行承担使用本项目所产生的一切风险。在任何情况下，作者均不对使用本项目而导致的任何损失或损害承担责任。
