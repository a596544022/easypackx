const fs = require('fs');
const path = require('path');
const hx = require('hbuilderx');
const NodeCache = require('node-cache');
const WebSocket = require('ws');
const { DEFAULT_IOS_BUNDLE_ID, DEFAULT_IOS_SDK_URL } = require('../utils');
const { executeCliCommand, getCliDir, output } = require('../utils');
const { getIosPackStart } = require('../utils/easypackxCore');

const localCache = new NodeCache();
let activeWebSocketServer = null;
const OLD_DEFAULT_IOS_SDK_URL = 'https://web-ext-storage.dcloud.net.cn/uni-app-x/sdk/iOS/UniAppX-iOS@5.07.zip';

function getFirstConfiguration(configuration, keys) {
	for (const key of keys) {
		const value = configuration.get(key);
		if (value) {
			return value;
		}
	}
	return '';
}

async function getWorkspaceProjects() {
	const folders = await hx.workspace.getWorkspaceFolders();
	return folders.map(item => ({
		name: item.name,
		fsPath: item.uri.fsPath
	}));
}

async function getActiveProjectPath() {
	const activeEditor = await hx.window.getActiveTextEditor();
	const workspaceFolder = await hx.workspace.getWorkspaceFolder(activeEditor?.document?.workspaceFolder);
	if (workspaceFolder?.uri?.uri?.fsPath) {
		return workspaceFolder.uri.uri.fsPath;
	}
	const folders = await hx.workspace.getWorkspaceFolders();
	return folders?.[0]?.uri?.fsPath ?? localCache.get('uniName') ?? '';
}

function getDefaultNativeIosDirectory(configuration) {
	return localCache.get('uniappxNativeIos') || configuration.get('easypackx.uniappxNativeIos') || '';
}

function getFormDialogValue(result, name) {
	return result?.data?.[name] ?? result?.[name] ?? '';
}

function getDefaultIosSdkUrl(configuration) {
	const cachedUrl = localCache.get('iosSdkDownloadUrl')
		|| getFirstConfiguration(configuration, ['easypackx.iosSdkDownloadUrl']);
	return normalizeIosSdkUrl(cachedUrl)
		|| DEFAULT_IOS_SDK_URL;
}

function getDefaultIosBundleId(configuration) {
	return localCache.get('iosBundleId')
		|| configuration.get('easypackx.iosBundleId')
		|| DEFAULT_IOS_BUNDLE_ID;
}

function normalizeIosSdkUrl(url) {
	if (url === OLD_DEFAULT_IOS_SDK_URL) {
		return DEFAULT_IOS_SDK_URL;
	}
	return url || '';
}

function closeActiveWebSocketServer() {
	if (!activeWebSocketServer) {
		return;
	}
	activeWebSocketServer.close(() => {
		console.log('iOS WebSocket 服务已停止');
	});
	activeWebSocketServer = null;
}

function notifyError(message) {
	output.error(message);
	if (typeof hx.window.showErrorMessage === 'function') {
		hx.window.showErrorMessage(message);
		return;
	}
	hx.window.showInformationMessage(message);
}

async function selectFolderByFormDialog({ name, title, label, value, placeholder }) {
	const result = await hx.window.showFormDialog({
		title,
		subtitle: '',
		hideSubTitle: true,
		hideErrorLabel: true,
		width: 560,
		height: 168,
		submitButtonText: '确定(&S)',
		cancelButtonText: '取消(&C)',
		formItems: [{
			type: 'fileSelectInput',
			name,
			label,
			placeholder,
			mode: 'folder',
			value
		}]
	});
	return getFormDialogValue(result, name);
}

async function publishIosResource(projectPath, customConsoleLog) {
	const args = ['publish', 'app-ios', '--type', 'appResource', '--project', projectPath];
	return new Promise((resolve, reject) => {
		let exportFinished = false;
		executeCliCommand(getCliDir(), args, (error, code) => {
			if (error) {
				reject(error);
				return;
			}
			if (code !== 0 && !exportFinished) {
				reject(new Error(`iOS 本地资源导出失败，CLI 退出码：${code}`));
				return;
			}
			resolve();
		}, (outputStr) => {
			customConsoleLog?.(outputStr);
			if (outputStr.includes('导出 ios 成功') || outputStr.includes('导出 iOS 成功')) {
				exportFinished = true;
				return true;
			}
			return false;
		});
	});
}

async function startIosPack(context, formData, configuration, customConsoleLog) {
	formData.iosSdkDownloadUrl = normalizeIosSdkUrl(formData.iosSdkDownloadUrl) || DEFAULT_IOS_SDK_URL;
	localCache.set('uniName', formData.uniName);
	localCache.set('iosSdkDownloadUrl', formData.iosSdkDownloadUrl);
	localCache.set('uniappxNativeIos', formData.uniappxNativeIos);
	localCache.set('iosBundleId', formData.iosBundleId || DEFAULT_IOS_BUNDLE_ID);
	await configuration.update('easypackx.iosSdkDownloadUrl', formData.iosSdkDownloadUrl);
	await configuration.update('easypackx.uniappxNativeIos', formData.uniappxNativeIos || '');
	await configuration.update('easypackx.iosBundleId', formData.iosBundleId || DEFAULT_IOS_BUNDLE_ID);
	if (formData.autoPublishAppResource) {
		await publishIosResource(formData.uniName, customConsoleLog);
	}
	const start = getIosPackStart(context.extensionPath);
	await start({
		hx,
		root: path.join(context.extensionPath, 'src', 'easypackx'),
		uniappProjectPath: formData.uniName,
		iosSdkDownloadUrl: formData.iosSdkDownloadUrl,
		uniappxNativeIos: formData.uniappxNativeIos || configuration.get('easypackx.uniappxNativeIos'),
		iosBundleId: formData.iosBundleId || DEFAULT_IOS_BUNDLE_ID,
		customConsoleLog,
		customSetStatusMessage: hx.window.setStatusBarMessage
	});
}

async function submitIosPack(context, formData, configuration, webviewDialog, customConsoleLog, outputChannel) {
	outputChannel.show();
	closeActiveWebSocketServer();
	webviewDialog.close();
	await startIosPack(context, formData, configuration, customConsoleLog);
}

async function showIosFormDialog(context) {
	const configuration = hx.workspace.getConfiguration();
	const projects = await getWorkspaceProjects();
	const activeProjectPath = await getActiveProjectPath();
	const webviewDialog = hx.window.createWebViewDialog({
		title: 'EasyPackX iOS',
		description: '生成 uni-app x iOS 原生工程',
		dialogButtons: ['取消', '生成工程'],
		size: {
			width: 760,
			height: 620
		}
	}, {
		enableScripts: true
	});
	const webview = webviewDialog.webView;
	const outputChannel = hx.window.createOutputChannel('EasyPackX');
	const customConsoleLog = outputChannel.appendLine.bind(outputChannel);

	webview.html = fs.readFileSync(path.join(__dirname, 'iosForm.html'), 'utf-8');
	webviewDialog.show();
	if (typeof webviewDialog.onDialogClosed === 'function') {
		webviewDialog.onDialogClosed(closeActiveWebSocketServer);
	}

	webview.onDidReceiveMessage(async (msg) => {
		if (msg.command === 'cancel') {
			closeActiveWebSocketServer();
			webviewDialog.close();
			return;
		}
		if (msg.command === 'confirm') {
			try {
				await submitIosPack(context, msg.data, configuration, webviewDialog, customConsoleLog, outputChannel);
			} catch (error) {
				notifyError(error.message);
			}
		}
	});

	closeActiveWebSocketServer();
	let wss = null;
	try {
		// iOS 可视化表单使用独立端口，避免和 Android 表单同时打开时冲突。
		wss = new WebSocket.Server({ port: 9993 });
		activeWebSocketServer = wss;
	} catch (error) {
		notifyError(`启动 iOS 配置通信服务失败：${error.message}`);
		webviewDialog.close();
		return;
	}

	wss.on('error', (error) => {
		notifyError(`iOS 配置通信服务异常：${error.message}`);
	});

	wss.on('connection', (ws, request) => {
		const urlParams = new URL(request.url, 'http://127.0.0.1:9993');
		if (urlParams.searchParams.get('key') !== 'adminadmin2024') {
			ws.close();
			return;
		}

		ws.send(JSON.stringify({ type: 'uniNames', data: projects }));
		ws.send(JSON.stringify({ type: 'uniName', data: activeProjectPath }));
		ws.send(JSON.stringify({ type: 'iosSdkDownloadUrl', data: getDefaultIosSdkUrl(configuration) }));
		ws.send(JSON.stringify({ type: 'uniappxNativeIos', data: getDefaultNativeIosDirectory(configuration) }));
		ws.send(JSON.stringify({ type: 'iosBundleId', data: getDefaultIosBundleId(configuration) }));
		ws.send(JSON.stringify({
			type: 'autoPublishAppResource',
			data: configuration.get('easypackx.autoPublishAppResource') === true
		}));

		ws.on('message', async (message) => {
			const msg = JSON.parse(message);
			if (msg.type === 'selectNativeIosDirectory') {
				try {
					const selectedPath = await selectFolderByFormDialog({
						name: 'uniappxNativeIos',
						title: '选择 iOS 工程输出目录',
						label: '输出目录',
						value: msg.data?.currentValue || getDefaultNativeIosDirectory(configuration),
						placeholder: '请选择 iOS 原生工程生成目录'
					});
					if (selectedPath) {
						localCache.set('uniappxNativeIos', selectedPath);
						ws.send(JSON.stringify({ type: 'uniappxNativeIos', data: selectedPath }));
					}
				} catch (error) {
					ws.send(JSON.stringify({ type: 'formError', data: error.message }));
				}
				return;
			}
			if (msg.type === 'selectIosSdkDirectory') {
				try {
					const selectedPath = await selectFolderByFormDialog({
						name: 'iosSdkDownloadUrl',
						title: '选择 iOS 离线打包 SDK 目录',
						label: 'SDK 目录',
						value: msg.data?.currentValue || '',
						placeholder: '请选择 iOS SDK 解压目录'
					});
					if (selectedPath) {
						localCache.set('iosSdkDownloadUrl', selectedPath);
						ws.send(JSON.stringify({ type: 'iosSdkDownloadUrl', data: selectedPath }));
					}
				} catch (error) {
					ws.send(JSON.stringify({ type: 'formError', data: error.message }));
				}
				return;
			}
			if (msg.type === 'useProjectOutputDirectory') {
				const projectPath = msg.data?.projectPath || activeProjectPath;
				if (projectPath) {
					const selectedPath = path.join(projectPath, 'unpackage', 'native-ios');
					ws.send(JSON.stringify({ type: 'uniappxNativeIos', data: selectedPath }));
				}
				return;
			}
		});
	});
}

module.exports = {
	showIosFormDialog
};
