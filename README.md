# logseq-utils
My utilities for logseq

# Reddit importer

This interactive template imports stuff from reddit and because both Logseq and reddit use markdown, it gets embedded it as nested blocks!!!  

<img width="1110" alt="image" src="https://user-images.githubusercontent.com/1171003/116170587-f4bc2c00-a6bb-11eb-9ae2-3e708c7dde06.png">


### Instructions

* Paste the following into your templates file
* then (on another page) invoke the template
* update the link inside `[reddit](>>HERE<<)` with a reddit.com link
  * to a post page - `https://www.reddit.com/r/<subreddit>/comments/<id>/<title>`
  * or a comments sub-thread - `https://www.reddit.com/r/<subreddit>/comments/<id>/<title>/<comment-id>`
  * or to a user page (even with parameters!) - `https://www.reddit.com/user/<username>/?sort=top&t=day`
  * or to a subreddit (even with parameters!) - `https://www.reddit.com/r/<subreddit>/top/?sort=top&t=week`
* hit escape
* click "fetch thread button"
* [optional] since this is a 2-step process (only after clicking "fetch" the thread is embedded), this means you can put the result of the 1st step (after inserting the link) into another template


Start by inserting this template in one of your pages (recommended: separate `templates.md` file)

```
[reddit]() @@html: <button onclick="Function(document.getElementById('fetch-reddit-code').innerHTML)()(this)">↻ fetch thread</button>@@
:PROPERTIES:
:template: embed-reddit
:END:
<script id="fetch-reddit-code">
return function(button) {
    function pressEsc(elem) {
        elem.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
    }
    
    async function fetchRedditAsMarkdown(href, extraFirstLineText) {
        function fix(str = '') {
            var reg = new RegExp("([\(\)\[\],])", "gi");
            return str
                .replace(reg, '\\$1')
                .replace(/_/g, '\\_');
        }
        var commentCounter = 0;
        function formatBody(comment, level) {
            commentCounter++;
            let author = fix(comment.author);
            let isComment = comment.kind === 't1';
            let body = isComment ? comment.body.replace(/^#/, '\\#').replace(/\n#/g, '\n\\#') : comment.is_self ? comment.selftext.replace(/^#/, '\\#').replace(/\n#/g, '\n\\#') : comment.url;
            
            level = level > 0 && level || 2;
            let isOp = postData && comment.author === postData.author;
            let fixedBody = (body || '');
            let ret = [`${"#".repeat(level)} [${isComment ? 'comment' : fix(comment.title)}](https://www.reddit.com${(comment.permalink)}) by ${author} ${isOp ? "(OP)" : ""}\n${fixedBody}`];
            if (comment.replies?.data?.children?.length) {
                comment.replies?.data?.children.reduce((acc, comment) => {
                    if (comment.kind === "more") {
                        return acc;
                    }
                    comment.data.kind = comment.kind;
                    acc.push(formatBody(comment.data, level + 1));
                    
                    return acc;
                }, ret);
            }
            return ret
                .map((e) => e.trim && e.trim() || '')
                .filter(Boolean)
                .join('\n');
        }
        let [pathname, search] = href.split('?');
        let url = pathname + '.json?raw_json=1&app=res' + (search ? ('&' + search) : '');
        let response = await fetch(url);
        let json = await response.json();
        
        let postData = json[0]?.data?.children?.[0]?.data;
        let flair = '';
        if (postData?.link_flair_richtext?.length) {
            let firstFlair = postData?.link_flair_richtext.find((e) => e.e === 'text')?.t;
            if (firstFlair) {
                flair = ` | \\[[${firstFlair}]]`;
            }
        }
        let type;
        let isCommentOrPost = pathname.match(/\/r\/(?<sub>\w+?)\/comments\/(?<id>[\w\d]+)\/?(?:[\w_]+\/(?<cid>\w+)\/?)?/);
        if (isCommentOrPost) {
            type = isCommentOrPost.groups?.cid ? 'comment' : 'post';
        } else {
            type = 'overview';
        }
        let commentThread = json[1];
        if (type === 'comment') {
            if (commentThread) {
                let firstComment = commentThread.data.children[0].data;
                firstComment.kind = commentThread.data.children[0].kind;
                let commentsBody = formatBody(firstComment, 3);
                let result = `## ${commentCounter} comments from [${fix(postData.title)}](https://www.reddit.com${postData.permalink}) in [r/${fix(postData.subreddit)}](https://www.reddit.com/${postData.subreddit}) by ${fix(postData.author)}${flair}${extraFirstLineText || ''}\n${commentsBody.trim()}`;
                return result;
            }
        } else if (type === 'overview') {
            let comments = json?.data?.children.map((c) => {
                c.data.kind = c.kind;
                return formatBody(c.data, 3);
            });
            let commentsBody = comments.join('\n');
            
            let result = `## Overview of ${href}${extraFirstLineText || ''}\n${commentsBody.trim()}`;
            return result;
        } else {
            let comments = commentThread.data.children.map((c) => {
                c.data.kind = c.kind;
                return formatBody(c.data, 3);
            });
            let commentsBody = comments.join('\n');
            
            let result = `## Post with ${commentCounter} comments from [${fix(postData.title)}](https://www.reddit.com${postData.permalink}) in [r/${fix(postData.subreddit)}](https://www.reddit.com/${postData.subreddit}) by ${fix(postData.author)}${flair}${extraFirstLineText || ''}\n${postData.is_self ? postData.selftext.replace(/^#/, '\\#').replace(/\n#/g, '\n\\#') : postData.url}\n${commentsBody.trim()}`;
            return result;
        }
    }
    
    function rightClickElement(el, leftClick) {
        var ev1 = new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: leftClick ? 1 : 2,
            // buttons: 2,
            clientX: el.getBoundingClientRect().x,
            clientY: el.getBoundingClientRect().y
        });
        
        el.dispatchEvent(ev1);
        var ev2 = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: leftClick ? 1 : 2,
            buttons: 0,
            clientX: el.getBoundingClientRect().x,
            clientY: el.getBoundingClientRect().y
        });
        el.dispatchEvent(ev2);
        if (!leftClick) {
            var ev3 = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: false,
                view: window,
                button: 2,
                buttons: 0,
                clientX: el.getBoundingClientRect().x,
                clientY: el.getBoundingClientRect().y
            });
            el.dispatchEvent(ev3);
        }
    }
    let block = button.closest('.ls-block');
    let redditDiv = button.closest('#reddit');
    let link = redditDiv.querySelector('a[href]');
    let tags = Array.from(redditDiv.querySelectorAll('.tag')).map((t) => t.innerText).join(' ');
    tags = tags ? (' ' + tags) : '';
    let ahref = link?.href;
    if (!ahref || !ahref.includes('reddit.com')) {
        alert('url should include reddit.com');
        return
    }
    rightClickElement(redditDiv, true);
    setTimeout(async () => {
        let textarea = block.querySelector('textarea');
        let oldMd = textarea.value;
        window.restoreCell = async function() {
            rightClickElement(block.querySelector("#reddit"), true);
            await new Promise(r => setTimeout(r, 50));
            let textarea = block.querySelector('textarea');
            textarea.value = oldMd;
            await new Promise(r => setTimeout(r, 50));
            pressEsc(textarea);
        }
        let newMd = await fetchRedditAsMarkdown(ahref, tags);
        textarea.value = newMd;
        await new Promise(r => setTimeout(r, 200));
        pressEsc(textarea);
    }, 10);
}
</script>
<style>
    #reddit a.external-link:not([href*="reddit.com"]):after {
        content: " (NEEDS A REDDIT URL)"
    }
    #reddit a.external-link:not([href*="reddit.com"]) {
        color: white !important;
        background-color: red !important;
    }
</style>
```

# Article inliner

This interactive template embeds an article inline (!!) after passing it through a readability algorithm

![image](https://user-images.githubusercontent.com/1171003/116480865-00802d80-a837-11eb-9c98-ab03fa35896b.png)

#### NOTE: the userscript adds 2 external libraries from public CDNs, use at your own risk, I will make a proper bundled version of this when plugins come to logseq

### Instructions

* Needs the [logseq.user.js](logseq.user.js) userscript (I run it with [violentmonkey](https://violentmonkey.github.io/))
  * it adds a method to fetch HTML regardless of cors (thanks to [71/logseq-snippets](https://github.com/71/logseq-snippets) for this tip)
  * it adds 2 libraries, one for converting HTML to markdown and one for readability
* Paste the following template into your templates file
* then (on another page) invoke the template
* update the link inside `[link-here](>>HERE<<)` with a link to a page with an article (no JS apps supported of course, regular pages only)
* hit escape
* click "inline article" button

Start by inserting this template in one of your pages (recommended: separate `templates.md` file)

```
[link-here]() @@html: <button onclick="Function(document.getElementById('inline-article').innerHTML)()(this)">↻ inline article</button>@@
:PROPERTIES:
:template: article-link
:END:
<script id="inline-article">
return function(button) {
    function pressEsc(elem) {
        elem.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
    }
    
    function rightClickElement(el, leftClick) {
        var ev1 = new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: leftClick ? 1 : 2,
            // buttons: 2,
            clientX: el.getBoundingClientRect().x,
            clientY: el.getBoundingClientRect().y
        });
        
        el.dispatchEvent(ev1);
        var ev2 = new MouseEvent("mouseup", {
            bubbles: true,
            cancelable: false,
            view: window,
            button: leftClick ? 1 : 2,
            buttons: 0,
            clientX: el.getBoundingClientRect().x,
            clientY: el.getBoundingClientRect().y
        });
        el.dispatchEvent(ev2);
        if (!leftClick) {
            var ev3 = new MouseEvent("contextmenu", {
                bubbles: true,
                cancelable: false,
                view: window,
                button: 2,
                buttons: 0,
                clientX: el.getBoundingClientRect().x,
                clientY: el.getBoundingClientRect().y
            });
            el.dispatchEvent(ev3);
        }
    }
    if (!window.pageToMarkdown) {
       console.warn('this requires a global "pageToMarkdown" function created by the userscript!!')
    }
    let block = button.closest('.ls-block');
    let noteDiv = block.querySelector('.external-link').closest('div');
    let link = noteDiv.querySelector('a[href]');
    let oldContent = link.innerText;
    let ahref = link?.href;
    
    rightClickElement(noteDiv, true);
    setTimeout(async () => {
        let textarea = block.querySelector('textarea');
        let result = await pageToMarkdown(ahref);
        let {title, md} = result;
        textarea.value = `[${title || oldContent}](${ahref})\n\n${md}`;
        await new Promise(r => setTimeout(r, 200));
        pressEsc(textarea);
    }, 10);
}
</script>
```


## References

The inspiration for this feature came from [71/logseq-snippets](https://github.com/71/logseq-snippets#rss-page)
