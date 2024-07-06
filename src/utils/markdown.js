const markdownIt = require('markdown-it');

const md = markdownIt({
	// 配置选项，如：
	html: true, // 允许 HTML 标签
	breaks: true, // 允许换行符
	linkify: true, // 自动链接 URL 和电子邮件地址
	typographer: true, // 自动换行符、标点符号和 HTML 标签
});

module.exports = md;