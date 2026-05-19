var fs = require('fs');
const {
	showFormDialog
} = require('./src/components/showFormDialog');

const showReadme = require("./src/showReadme");
const {
	hx
} = require("./src/utils");

function openLogDocument(context, relativePath, label) {
	const filePath = `${context.extensionPath}/${relativePath}`;
	if (!fs.existsSync(filePath)) {
		hx.window.showInformationMessage(`${label}不存在，可能是核心打包目录尚未安装或还没有生成日志。`);
		return;
	}

	hx.workspace.openTextDocument(filePath);
}

//该方法将在插件激活的时候调用
async function activate(context) {
	let disposable2 = hx.commands.registerCommand('extension.easypackx.packUnixAndroid', async () => {
		// showFormDialog(context);
		showFormDialog(context);
	});
	let disposable3 = hx.commands.registerCommand('extension.easypackx.packUniAndroid', () => {
		hx.window.showInformationMessage('暂不支持该打包方式。');
	});
	let disposable4 = hx.commands.registerCommand('extension.easypackx.openCombinedLog', () => {
		openLogDocument(context, 'src/easypackx/log/combined.log', '运行日志');
	});
	let disposable5 = hx.commands.registerCommand('extension.easypackx.openErrorLog', () => {
		openLogDocument(context, 'src/easypackx/log/error.log', '错误日志');
	});
	let webviewPanel = hx.window.createWebView("extension.easypackx.view.readme", {
		enableScripts: true
	});

	showReadme(webviewPanel, context);

	let disposable6 = hx.commands.registerCommand('extension.easypackx.openReadme', () => {
		hx.window.showView({
			viewId: 'extension.easypackx.view.readme',
			containerId: 'easypackxReadme'
		});
	});
	// let onDidOpenTextDocumentEventDispose = hx.workspace.onDidOpenTextDocument((textDocument) => {
	// 	console.log('文档打开了', textDocument.workspaceFolder);
	// })
	//订阅销毁钩子，插件禁用的时候，自动注销该command。
	context.subscriptions.push(...[
		disposable2,
		disposable3,
		disposable4,
		disposable5,
		disposable6,
		// onDidOpenTextDocumentEventDispose
	]);
}
//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

}
module.exports = {
	activate,
	deactivate
}
