# chrome-extension-codemirror-content-script
Load the Codemirror libraries and create Codemirror elements in Chrome extension content scripts, including inside of iframes

Tested through **Chrome 72**

Requires **[CodeMirror](https://codemirror.net/)** - tested with version 5.33.0, will probably not work for versions older than 5

Requires **chrome-extension-port-communications** [GitHub](https://github.com/dkline03/chrome-extension-port-communications)

CodeMirror supports loaders such as requireJS, but that does not work inside of content scripts that run in a sandbox.

This script uses the Chrome extension API to simulate what requireJS would do to load the files, and make them available to the content script. This includes content scripts run inside of iframes.

## Usage

See the examples in **contentscript-codemirror-sample.js**, **contentscript-iframe-codemirror-sample.js**, and **background-sample-codemirror.js**

**ext-codemirror.js** contains some sample functions and overlays. These can be modified or removed. See the notes in the file for details

## Note

**The CodeMirror plugin directory structure needs to be preserved, including addon, lib, mode, etc. Otherwise, this will not work!**

**You will also need to update the paths in the sample code in _contentscript-codemirror-sample.js_ and _contentscript-iframe-codemirror-sample.js_ to match your script paths!**

**The code in _background-sample-codemirror.js_ is required to be in the background script in order to load the scripts! _chrome-extension-port-communications_ [GitHub](https://github.com/dkline03/chrome-extension-port-communications) is also required to be loaded in the background!**

## Support

Please submit an issue.


## License

Copyright (c) 2019 dkline03

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
