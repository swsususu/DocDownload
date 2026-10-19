---
'@dolphin/lark': patch
'@dolphin/chrome-extension': patch
---

fix: resolve upstream issues

- lark: code blocks fall back to snapshot text/language (#101); keep children of leaf blocks (#75); emit placeholders for unsupported sheet/bitable/mindnote/chat card blocks (#129, #80)
- chrome-extension: images without a name are no longer dropped (#63); never show an empty error message (#92); failed file downloads become plain text and progress no longer shows Infinity% (#145, #143, #119, #84); scan long documents in segments and locate pending blocks (#141)
- chrome-extension: clipboard write fallbacks (#132); precise hint on sheet/bitable/mindnote/slides pages (#62, #42, #108); add activeTab and surface script injection errors in the popup (#56, #93)
- chore: finish renaming to DocDownload (localized extension name, Firefox add-on id, batch download page, content button attribute)
