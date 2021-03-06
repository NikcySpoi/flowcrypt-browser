# FlowCrypt: Encrypt Gmail with PGP


## Users

Get [FlowCrypt](https://flowcrypt.com/) browser extension at: https://flowcrypt.com/download



## Developers

[![Build Status](https://semaphoreci.com/api/v1/flowcrypt/flowcrypt-browser/branches/master/badge.svg)](https://semaphoreci.com/flowcrypt/flowcrypt-browser)

This project is written in TypeScript. Browsers only understand JavaScript, so the project needs to be transpiled. You need to build the project the first time you download it, and build it after each change you make to see the result in the browser. First, install tooling:

```bash
$ cd some/folder/flowcrypt-browser
$ npm install
```

To build the project:
```
$ npm run-script build

> flowcrypt-browser@5.9.7 build /home/luke/git/flowcrypt-browser
> gulp

[02:42:04] Using gulpfile ~/git/flowcrypt-browser/gulpfile.js
[02:42:04] Starting 'default'...
[02:42:04] Starting 'flush'...
[02:42:04] Finished 'flush' after 62 ms
[02:42:04] Starting 'transpileProjectTs'...
[02:42:04] Starting 'copySourceFiles'...
[02:42:04] Starting 'copyVersionedManifest'...
[02:42:05] Finished 'copyVersionedManifest' after 199 ms
[02:42:05] Finished 'copySourceFiles' after 557 ms
[02:42:12] Finished 'transpileProjectTs' after 7.57 s
[02:42:12] Starting 'chromeBuildSpacesToTabs'...
[02:42:12] Finished 'chromeBuildSpacesToTabs' after 4.55 ms
[02:42:12] Starting 'copyChromeToFirefox'...
[02:42:12] Finished 'copyChromeToFirefox' after 323 ms
[02:42:12] Starting 'copyChromeToFirefoxEditedManifest'...
[02:42:12] Finished 'copyChromeToFirefoxEditedManifest' after 10 ms
[02:42:12] Finished 'default' after 7.97 s
```

Now you can find your built project in `build/chrome` and `build/firefox`
