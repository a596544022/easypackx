const fs = require('fs');
const hx = require('hbuilderx');
const {
	start
} = require('../kux-easy-pack/src/pack');
const NodeCache = require('node-cache');
const {
	getJavaVersion,
	checkAndroidHome,
	checkGradleJavaVersion
} = require('../utils/checkEnv');
const path = require('path');
const {
	logger
} = require('../kux-easy-pack/log/logger');
const localCache = new NodeCache();
const WebSocket = require('ws');

async function checkPackenv(androidHome, javaHome) {
	try {
		const checkAndroidHomeRes = await checkAndroidHome(androidHome)
		if (checkAndroidHomeRes != 'success') {
			return checkAndroidHomeRes
		}
		const checkGradleJavaVersionRes = await checkGradleJavaVersion(javaHome, 11)
		if (checkGradleJavaVersionRes != 'success') {
			return checkGradleJavaVersionRes
		}
		return 'success'
	} catch (e) {
		return e.stack;
	}
}

async function showFormDialog(context) {

	let webviewDialog = hx.window.createWebViewDialog({
		title: 'kux自定义打包',
		description: '请填写打包前的必要配置内容',
		dialogButtons: [
			"取消", "提交"
		],
		size: {
			width: 650,
			height: 600
		}
	}, {
		enableScripts: true
	});
	
	localCache.set('webviewDialog', webviewDialog)

	let webview = webviewDialog.webView;

	const folders = await hx.workspace.getWorkspaceFolders();
	let uniNames = [];
	folders.map(item => {
		uniNames.push({
			name: item.name,
			fsPath: item.uri.fsPath
		})
	});

	webview.html = fs.readFileSync(`${__dirname}/form.html`, 'utf-8');

	let promi = webviewDialog.show();

	const workspaceFolders = await hx.workspace.getWorkspaceFolders();
	const configuration = hx.workspace.getConfiguration();
	const activeEditor = await hx.window.getActiveTextEditor();
	const workspaceFolder = await hx.workspace.getWorkspaceFolder(activeEditor?.document?.workspaceFolder);
	let options = {
		uniName: '',
		repositoryUrl: localCache.get('repositoryUrl') ?? configuration.get('kux-easy-pack-hxp.repositoryUrl'),
		javaHome: localCache.get('javaHome') ?? configuration.get('kux-easy-pack-hxp.javaHome')
	}
	if (workspaceFolder?.uri?.uri?.fsPath) {
		options.uniName = workspaceFolder.uri.uri.fsPath ?? '';
		localCache.set('fsPath', options.uniName)
	} else {
		if (localCache.get('uniName')) {
			options.uniName = localCache.get('uniName');
		}
	}
		
	// 创建一个WebSocket服务器实例，监听在9991端口
	const wss = new WebSocket.Server({
		port: 9991
	});

	const outputChannel = hx.window.createOutputChannel('kux自定义打包');

	let globalWs = null;

	wss.on('connection', async function connection(ws, request) {
		const urlParams = new URL(request.url, 'http://127.0.0.1:9991');
		const key = urlParams.searchParams.get('key');

		if (key === 'adminadmin2024') {
			console.log('客户端已连接');
			globalWs = ws;
			ws.on('message', async function incoming(message) {
				console.log('收到消息: %s', message);
				// ws.send('收到消息：' + message);
				const msg = JSON.parse(message)
				if (msg.type === 'confirm') {
					outputChannel.show();
					localCache.set('repositoryUrl', msg.data.repositoryUrl);
					localCache.set('uniName', msg.data.uniName);
					localCache.set('javaHome', msg.data.javaHome)
					localCache.set('saveLocalConfig', msg.data.saveLocalConfig)
					localCache.set('androidPackageName', msg.data.androidPackageName)
					localCache.set('storePath', msg.data.storeForm.storePath)
					localCache.set('storePassword', msg.data.storeForm.storePassword)
					localCache.set('keyAlias', msg.data.storeForm.keyAlias)
					localCache.set('keyPassword', msg.data.storeForm.keyPassword)
					if (msg.data.saveLocalConfig) {
						const moduleConfig = {}
						Object.keys(msg.data).map(item => {
							if (item.startsWith('uni-')) {
								moduleConfig[item] = msg.data[item]
							}
						})
						localCache.set('moduleConfig', moduleConfig)
					}
					start({
						hx: hx,
						uniappProjectPath: msg.data.uniName,
						allowClone: true,
						root: `${context.extensionPath}/src/kux-easy-pack`,
						customConsoleLog: outputChannel.appendLine,
						customSetStatusMessage: hx.window.setStatusBarMessage,
						...msg.data,
						storePath: msg.data.storeForm.storePath,
						storePassword: msg.data.storeForm.storePassword,
						keyAlias: msg.data.storeForm.keyAlias,
						keyPassword: msg.data.storeForm.keyPassword
					})
					localCache.get('webviewDialog')?.close()
				}
				if (msg.type === 'checkPackenv' && msg.data.localPack) {
					const checkPackenvRes = await checkPackenv(msg.data.androidLocalSdk, msg.data.javaHome)
					ws.send(JSON.stringify({
						type: 'autoCheckPackenvRes',
						data: checkPackenvRes
					}))
				}
			});

			ws.on('close', function close() {
				console.log('连接已关闭');
				// globalWs = null
				// localCache.set('globalWs', null)
			});

			ws.send(JSON.stringify({
				type: 'uniNames',
				data: uniNames
			}))
			ws.send(JSON.stringify({
				type: 'androidLocalSdk',
				data: configuration.get('kux-easy-pack-hxp.androidLocalSdk') ??
					configuration
					.get('uts-development-android.sdkDir')
			}))
			ws.send(JSON.stringify({
				type: 'uniName',
				data: localCache.get('fsPath') ?? options.uniName
			}))
			ws.send(JSON.stringify({
				type: 'repositoryUrl',
				data: options.repositoryUrl
			}))
			ws.send(JSON.stringify({
				type: 'javaHome',
				data: options.javaHome
			}))
			const checkAgconnectServicesRes = fs.existsSync(path.join(options.uniName, '/static/',
				'agconnect-services.json'))
			ws.send(JSON.stringify({
				type: 'checkAgconnectServicesRes',
				data: checkAgconnectServicesRes
			}))
			ws.send(JSON.stringify({
				type: 'saveLocalConfig',
				data: localCache.get('saveLocalConfig') ?? false
			}))
			ws.send(JSON.stringify({
				type: 'moduleConfig',
				data: localCache.get('moduleConfig') ?? {}
			}))
			ws.send(JSON.stringify({
				type: 'androidPackageName',
				data: localCache.get('androidPackageName') ?? configuration.get('kux-easy-pack-hxp.androidPackageName')
			}))
			ws.send(JSON.stringify({
				type: 'storePath',
				data: localCache.get('storePath') ?? configuration.get('kux-easy-pack-hxp.storePath')
			}))
			ws.send(JSON.stringify({
				type: 'storePassword',
				data: localCache.get('storePassword') ?? configuration.get('kux-easy-pack-hxp.storePassword')
			}))
			ws.send(JSON.stringify({
				type: 'keyAlias',
				data: localCache.get('keyAlias') ?? configuration.get('kux-easy-pack-hxp.keyAlias')
			}))
			ws.send(JSON.stringify({
				type: 'keyPassword',
				data: localCache.get('keyPassword') ?? configuration.get('kux-easy-pack-hxp.keyPassword')
			}))
		} else {
			console.log('认证失败');
			ws.close(1008, '认证失败');
		}
	});

	webview.onDidReceiveMessage(async (msg) => {
		if (msg.command == 'cancel') {
			webviewDialog.close();
		}
		if (msg.command == 'openWeb') {
			hx.env.openExternal(msg.href);
		}
		if (msg.command == 'confirm') {
			outputChannel.show();
			// webviewDialog.close()
			localCache.set('repositoryUrl', msg.data.repositoryUrl);
			localCache.set('uniName', msg.data.uniName);
			localCache.set('javaHome', msg.data.javaHome)
			localCache.set('androidPackageName', msg.data.androidPackageName)
			localCache.set('storePath', msg.data.storeForm.storePath)
			localCache.set('keyAlias', msg.data.storeForm.keyAlias)
			localCache.set('keyPassword', msg.data.storeForm.keyPassword)
			if (msg.data.saveLocalConfig) {
				const moduleConfig = {}
				Object.keys(msg.data).map(item => {
					if (item.startsWith('uni-')) {
						moduleConfig[item] = msg.data[item]
					}
				})
				localCache.set('moduleConfig', moduleConfig)
			}
			// let checkPackenvRes = null
			// if (msg.data.autoCheckPackenv === '1') {
			// 	checkPackenvRes = await checkPackenv(msg.data.androidLocalSdk, msg.data.javaHome)
			// 	if (globalWs != null) {
			// 		globalWs.send(JSON.stringify({
			// 			type: 'autoCheckPackenvRes',
			// 			data: checkPackenvRes
			// 		}))
			// 	} else {
			// 		console.log('ws连接尚未建立');
			// 		logger.warn('ws连接尚未建立')
			// 	}
			// 	return
			// }
			wss.close(() => {
				console.log('WebSocket 服务已停止');
			})
			webviewDialog.close()
			await start({
				hx: hx,
				uniappProjectPath: msg.data.uniName,
				allowClone: true,
				root: `${context.extensionPath}/src/kux-easy-pack`,
				customConsoleLog: outputChannel.appendLine,
				customSetStatusMessage: hx.window.setStatusBarMessage,
				...msg.data,
				storePath: msg.data.storeForm.storePath,
				storePassword: msg.data.storeForm.storePassword,
				keyAlias: msg.data.storeForm.keyAlias,
				keyPassword: msg.data.storeForm.keyPassword
			})
		}
	});

	console.log('WebSocket服务器正在监听9991端口');

	promi.then((data) => {
		console.log(data);
		webview.postMessage({
			type: "PostDataEvent",
			data: JSON.stringify(uniNames)
		})
	})
}

module.exports = {
	showFormDialog
}