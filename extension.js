var fs = require('fs');
var axios = require('axios')
const {
	showFormDialog
} = require('./src/components/showFormDialog');

// const showFormDialog = require("./src/packUnixAndroid");
const showReadme = require("./src/showReadme");
const {
	logger
} = require("./src/kux-easy-pack/log/logger");
const {
	getVersionCode,
	executeCliCommand,
	getCliDir,
	hx,
	getActiveProject
} = require("./src/utils");

//该方法将在插件激活的时候调用
async function activate(context) {
	axios.get('https://api.uvuejs.cn/version/easy-pack')
		.then(response => {
			const versionCode = getVersionCode(response.data)
			// 获取扩展的package.json文件
			const extensionPackage = require(context.asAbsolutePath('./package.json'))
			// 获取扩展的版本号
			const extensionVersionCode = getVersionCode(extensionPackage.version)
			if (versionCode > extensionVersionCode) {
				let resultPromise = hx.window.showInformationMessage(
					`kux自定义打包插件已发布新版本 ${response.data}。\n请及时更新，以确保插件正常工作。`, ['前往更新', '稍后提醒'])
				resultPromise.then((result) => {
					if (result == '前往更新') {
						hx.env.openExternal('https://ext.dcloud.net.cn/plugin?id=18800')
					}
				})
			}

		})
		.catch(error => {
			logger.warn('【检查插件版本异常】' + error.stack)
		})
	let disposable1 = hx.commands.registerCommand('extension.helloWorld', () => {
		hx.window.showInformationMessage('你好，这是我的第一个插件扩展。');
	});
	let disposable2 = hx.commands.registerCommand('extension.kux.packUnixAndroid', async () => {
		// showFormDialog(context);
		showFormDialog(context);
	});
	let disposable3 = hx.commands.registerCommand('extension.kux.packUniAndroid', () => {
		hx.window.showInformationMessage('暂不支持该打包方式。');
	});
	let disposable4 = hx.commands.registerCommand('extension.kux.openCombinedLog', () => {
		hx.workspace.openTextDocument(`${context.extensionPath}/src/kux-easy-pack/log/combined.log`);
	});
	let disposable5 = hx.commands.registerCommand('extension.kux.openErrorLog', () => {
		hx.workspace.openTextDocument(`${context.extensionPath}/src/kux-easy-pack/log/error.log`);
	});
	let webviewPanel = hx.window.createWebView("extension.kux.view.readme", {
		enableScripts: true
	});

	showReadme(webviewPanel, context);

	let disposable6 = hx.commands.registerCommand('extension.kux.openReadme', () => {
		hx.window.showView({
			viewId: 'extension.kux.openReadme',
			containerId: 'kuxEasyPackReadme'
		});
	});
	let disposable7 = hx.commands.registerCommand('extension.kux.openExtUrl', () => {
		hx.env.openExternal('https://ext.dcloud.net.cn/plugin?id=18800');
	});
	// let onDidOpenTextDocumentEventDispose = hx.workspace.onDidOpenTextDocument((textDocument) => {
	// 	console.log('文档打开了', textDocument.workspaceFolder);
	// })
	//订阅销毁钩子，插件禁用的时候，自动注销该command。
	context.subscriptions.push(...[
		disposable1,
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