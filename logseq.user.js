// ==UserScript==
// @name        New script - logseq.com
// @namespace   Violentmonkey Scripts
// @match       https://logseq.com/*
// @grant       GM_xmlhttpRequest
// @version     1.0
// @inject-into page
// @description 4/28/2021, 1:24:23 PM
// ==/UserScript==

unsafeWindow.fetchNoCors = (url) => new Promise((resolve, reject) => GM_xmlhttpRequest({
  url,
  method: 'GET',

  onabort: () => reject(),
  onerror: () => reject(),

  onloadend: (res) => resolve({ async text() { return res.responseText; } }),
}));

// pages to markdown
var scr = unsafeWindow.document.createElement('script');
scr.src = "https://unpkg.com/turndown/dist/turndown.js";
unsafeWindow.document.head.appendChild(scr);

scr = unsafeWindow.document.createElement('script');
scr.src = "https://cdn.jsdelivr.net/npm/@mozilla/readability@0.4.1/Readability.js";
unsafeWindow.document.head.appendChild(scr);



unsafeWindow.pageToMarkdown = async function(pageUrl) {
  function createDoc(htmlStr) {
    var doc = document.implementation.createHTMLDocument('');
    doc.open();
    doc.write(htmlStr);
    doc.close();
    return doc;
  }
  
  try {
    let {text} = await this.fetchNoCors(pageUrl);
    let result = await text();
    let ret = {
      title: '',
      md: '',
      excerpt: ''
    }
    var turndownService = new TurndownService();
    turndownService.remove('script');
    turndownService.remove('footer');
    turndownService.remove('style');

    turndownService.addRule('a', {
      filter: ['a'],
      replacement: function (content, node, options) {
        if (!node.href) {
          return `[${content}]`;
        }
        let href = node.getAttribute('href');
        let url = new URL(href, pageUrl);
        
        return `[${content}](${url.toString()})`;
      }
    });
    
    turndownService.addRule('iframe', {
      filter: ['iframe'],
      replacement: function (content, node, options) {
        if (!node.src) {
          return '';
        }
        let src = node.getAttribute('src');
        let url = new URL(src, pageUrl);
        return `_iframe to_: [${url.toString()}](${url.toString()})`;
      }
    });
    let doc = createDoc(result);
    var article = new Readability(doc).parse();
    var {
      title,
      content,
      textContent,
      length,
      excerpt,
      byline,
      dir,
    } = article;
    
    var markdown = turndownService.turndown(content);
    ret.title = title;
    ret.md = markdown;
    return ret;
  } catch(err) {
    console.error('Error fetching page', err);
    alert('error importing page');
  }
}
