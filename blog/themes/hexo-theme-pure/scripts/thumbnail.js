/**
* Thumbnail Helper
* @description Get the thumbnail url from a post
* @example
*     <%- thumbnail(post) %>
*/
var fs = require('hexo-fs');
hexo.extend.helper.register('thumbnail', function (post) {
    return post.thumbnail || post.banner || '';
});

hexo.extend.generator.register('post-images-copy', function (locals) {
    let postPath = `${process.cwd()}/source/_posts/`
    let publicPath = `${process.cwd()}/public/post/images/`
    fs.listDirSync(postPath).forEach(function (file) {
        if (file.endsWith('.png')) {
            let fileSplits = file.split('/')
            fs.copyFile(`${postPath}${file}`, `${publicPath}/${fileSplits[fileSplits.length - 1]}`)
        }
    })
    return {
        path: 'file.txt',
        data: function () {
            return null
        }
    };
});
