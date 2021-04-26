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
* hit escape
* click "fetch thread button"


Create this template in one of your pages (recommended: separate `templates.md` file)

```
## [reddit]() @@html: <button onclick="Function(document.getElementById('fetch-reddit-code').innerHTML)()(this)">↻ fetch thread</button>@@
:PROPERTIES:
:template: embed-reddit
:END:
<script id="fetch-reddit-code">
return function(button) {
    function pressEsc(elem) {
        elem.dispatchEvent(new KeyboardEvent("keydown", { keyCode: 27 }));
    }
    
    async function fetchRedditAsMarkdown(href) {
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
            let body = comment.body;
            level = level > 0 && level || 2;
            let isOp = comment.author === postData.author;
            let fixedBody = (body || '').replace(/^#/, '\\#').replace(/\n#/g, '\n\\#');
            let ret = [`${"#".repeat(level)} [comment](https://www.reddit.com${(comment.permalink)}) by ${author} ${isOp ? "(OP)" : ""}\n${fixedBody}`];
            if (comment.replies?.data?.children?.length) {
                comment.replies?.data?.children.reduce((acc, comment) => {
                    acc.push(formatBody(comment.data, level + 1));
                    return acc;
                }, ret);
            }
            return ret
                .map((e) => e.trim && e.trim() || '')
                .filter(Boolean)
                .join('\n');
        }
        
        let url = href + '.json?raw_json=1&app=res';
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
        let commentThread = json[1];
        let type = commentThread?.data?.children?.[0]?.length === 1 ? 'comment' : 'post';
        if (type === 'comment') {
            if (commentThread) {
                let firstComment = commentThread.data.children[0].data;
                let commentsBody = formatBody(firstComment, 3);
                let result = `## ${commentCounter} comments from [${fix(postData.title)}](https://www.reddit.com${postData.permalink}) in [r/${fix(postData.subreddit)}](https://www.reddit.com/${postData.subreddit}) by ${fix(postData.author)}${flair}\n${commentsBody.trim()}`;
                return result;
            }
        } else {
            let comments = commentThread.data.children.map((c) => formatBody(c.data, 3));
            let commentsBody = comments.join('\n');
            
            let result = `## Post with ${commentCounter} comments from [${fix(postData.title)}](https://www.reddit.com${postData.permalink}) in [r/${fix(postData.subreddit)}](https://www.reddit.com/${postData.subreddit}) by ${fix(postData.author)}${flair}\n${postData.is_self ? postData.selftext.replace(/^#/, '\\#').replace(/\n#/g, '\n\\#') : postData.url}\n${commentsBody.trim()}`;
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
    let href = link?.href;
    if (!href || !href.includes('reddit.com')) {
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
        let newMd = await fetchRedditAsMarkdown(href);
        textarea.value = newMd;
        await new Promise(r => setTimeout(r, 200));
        pressEsc(textarea);
    }, 10);
}
</script>
<style>
    #reddit a:not([href*="reddit.com"]):after {
        content: " (NEEDS A REDDIT URL)"
    }
    #reddit a:not([href*="reddit.com"]) {
        color: white !important;
        background-color: red !important;
    }
</style>
```

## References

The inspiration for this feature came from [71/logseq-snippets](https://github.com/71/logseq-snippets#rss-page)
