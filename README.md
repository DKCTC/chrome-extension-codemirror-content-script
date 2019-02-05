# chrome-extension-codemirror-content-script
Load the Codemirror libraries and create Codemirror elements in Chrome extension content scripts, including inside of iframes

Requires CodeMirror
https://codemirror.net/

Requires chrome-extension-port-communications
https://github.com/dkline03/chrome-extension-port-communications

Tested on CodeMirror version 5.33.0. CodeMirror supports loaders such as requireJS, but that does not work inside of content scripts that run in a sandbox.
This script uses the Chrome extension API to simulate what requireJS would do to load the files, and make them available to the content script. This includes content scripts run inside of iframes.

Full documentation coming soon! For now, there are js files with some samples in them. There are also notes in the code itself.
