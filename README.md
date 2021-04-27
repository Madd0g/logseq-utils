# logseq-utils
My utilities for logseq

# Reddit importer

This little template+script imports a reddit post or a comment sub-thread and because it's markdown, it EMBEDS IT AS NESTED BLOCKS!!!  
(sorry if I'm yelling, it's exciting)

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

## References

The inspiration for this feature came from [71/logseq-snippets](https://github.com/71/logseq-snippets#rss-page)
