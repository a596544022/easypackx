let hx = require('hbuilderx');
let fs = require('fs');
const { mark2html } = require('./utils');

async function showReadme(webviewPanel, context) {
	let webview = webviewPanel.webView;
	
	const content = await fs.promises.readFile(`${context.extensionPath}/README.md`, 'utf-8');
	
	const cssPath = `${context.extensionPath}/src/style/github-markdown.css`;
	
	const html = `
		<html>
		<head>
		</head>
		<body>
			<link rel="stylesheet" href="${cssPath}">
			<article class="markdown-body">
				${await mark2html(content)}
			</article>
		<body>
		<script>
			window.onload = function () {
				document.addEventListener('click', function (event) {
					if (event.target && event.target.tagName == 'A') {
						const href = event.target.href;
						if (href.indexOf('http') > -1) {
							hbuilderx.postMessage({
								command: 'openWeb',
								href: href
							})
						}
						event.preventDefault();
					}
				})
			}
		</script>
		</html>
	`;
	
	webview.onDidReceiveMessage((msg) => {
		if (msg.command == 'openWeb') {
			hx.env.openExternal(msg.href);
		}
	});

	webview.html = html;
}

module.exports = showReadme;