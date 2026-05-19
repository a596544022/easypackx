const fs = require('fs');
const hx = require('hbuilderx');
const NodeCache = require('node-cache');
const {
	getJavaVersion,
	resolveJavaHome,
	checkAndroidHome,
	checkGradleJavaVersion
} = require('../utils/checkEnv');
const path = require('path');
const { executeCliCommand, getCliDir, getActiveProject, output, colors, DEFAULT_ANDROID_SDK_URL } = require('../utils');
const { getPackStart } = require('../utils/easypackxCore');
const localCache = new NodeCache();
const WebSocket = require('ws');

let activeWebSocketServer = null;
const SDK_DIR_CONFIG_KEYS = [
	'easypackx.sdkDir',
	'easypackx.androidLocalSdk',
	'uts-development-android.sdkDir'
];
const JAVA_HOME_CONFIG_KEYS = [
	'easypackx.javaHome',
	'uts-development-android.javaHome'
];
const SDK_DOWNLOAD_URL_CONFIG_KEYS = [
	'easypackx.sdkDownloadUrl',
	'easypackx.customSDKPath'
];
const CERTIFICATE_EXTENSIONS = new Set(['.keystore', '.jks', '.p12', '.pfx', '.ks']);

function getFirstConfiguration(configuration, keys) {
	for (const key of keys) {
		const value = configuration.get(key);
		if (value) {
			return value;
		}
	}
	return '';
}

function readJsonFile(filePath, fallback) {
	try {
		if (!fs.existsSync(filePath)) {
			return fallback;
		}
		return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
	} catch (error) {
		return fallback;
	}
}

async function scanCertificateFiles(projectPath) {
	if (!projectPath || !fs.existsSync(projectPath)) {
		return [];
	}

	const entries = await fs.promises.readdir(projectPath, { withFileTypes: true });
	return entries
		.filter(entry => entry.isFile() && CERTIFICATE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
		.map(entry => {
			const filePath = path.join(projectPath, entry.name);
			return {
				label: entry.name,
				value: filePath
			};
		});
}

function getCachedConfig(configuration, fsPath) {
	const globalConfig = readJsonFile(configCachePath, {});
	if (!configuration.get('easypackx.projectCacheConfig')) {
		return globalConfig;
	}

	const projectConfigs = readJsonFile(moduleConfigCachePath, []);
	const projectConfig = projectConfigs.find(item => item.fsPath === fsPath)?.data;
	// 项目级缓存不存在时回退到全局缓存，避免 SDK 地址输入框变成空值。
	return projectConfig ?? globalConfig;
}

function getSdkDownloadUrl(configuration, cachedConfig = {}) {
	return localCache.get('sdkDownloadUrl')
		|| cachedConfig.sdkDownloadUrl
		|| getFirstConfiguration(configuration, SDK_DOWNLOAD_URL_CONFIG_KEYS)
		|| DEFAULT_ANDROID_SDK_URL;
}

function closeActiveWebSocketServer() {
	if (!activeWebSocketServer) {
		return;
	}

	// 主动关闭上一次遗留的本地通信服务，避免重复打开窗口时端口冲突。
	activeWebSocketServer.close(() => {
		console.log('WebSocket 服务已停止');
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

async function normalizePackData(data) {
	// 表单里可能残留旧版 JDK 11 路径，提交前统一切换到满足 Gradle 要求的 JDK。
	return {
		...data,
		javaHome: await resolveJavaHome(data.javaHome, 17)
	};
}

async function checkPackenv(androidHome, javaHome) {
	try {
		const checkAndroidHomeRes = await checkAndroidHome(androidHome)
		if (checkAndroidHomeRes != 'success') {
			return checkAndroidHomeRes
		}
		const checkGradleJavaVersionRes = await checkGradleJavaVersion(javaHome, 17)
		if (checkGradleJavaVersionRes != 'success') {
			return checkGradleJavaVersionRes
		}
		return 'success'
	} catch (e) {
		return e.stack;
	}
}

// 持久化存储配置信息的文件路径
const moduleConfigCachePath = path.join(__dirname, '../cache/', 'module.config.json');
const configCachePath = path.join(__dirname, '../cache/', 'config.json');

function writeJsonFile(filePath, data) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function buildModuleConfig(data) {
	const moduleConfig = {};
	Object.keys(data).map(item => {
		if (item.startsWith('uni-')) {
			moduleConfig[item] = data[item];
		}
	});
	return moduleConfig;
}

function getCacheFsPath(data, options) {
	return data.uniName || localCache.get('fsPath') || options.uniName;
}

function writeProjectCache(fsPath, cachePatch) {
	if (!fsPath) {
		const globalConfig = readJsonFile(configCachePath, {});
		writeJsonFile(configCachePath, {
			...globalConfig,
			...cachePatch
		});
		return;
	}

	const projectConfigs = readJsonFile(moduleConfigCachePath, []);
	const existingIndex = projectConfigs.findIndex(item => item.fsPath === fsPath);
	if (existingIndex >= 0) {
		projectConfigs[existingIndex] = {
			fsPath,
			data: {
				...projectConfigs[existingIndex].data,
				...cachePatch
			}
		};
	} else {
		projectConfigs.push({
			fsPath,
			data: cachePatch
		});
	}
	writeJsonFile(moduleConfigCachePath, projectConfigs);
}

function saveSdkDownloadUrlCache(data, options, configuration) {
	const sdkDownloadUrl = data.sdkDownloadUrl || options.sdkDownloadUrl || getSdkDownloadUrl(configuration);
	localCache.set('sdkDownloadUrl', sdkDownloadUrl);

	if (configuration.get('easypackx.projectCacheConfig')) {
		writeProjectCache(getCacheFsPath(data, options), { sdkDownloadUrl });
		return sdkDownloadUrl;
	}

	const globalConfig = readJsonFile(configCachePath, {});
	writeJsonFile(configCachePath, {
		...globalConfig,
		sdkDownloadUrl
	});
	return sdkDownloadUrl;
}

async function saveCache(data, options, configuration) {
	const sdkDownloadUrl = saveSdkDownloadUrlCache(data, options, configuration);
	if (data.saveLocalConfig) {
		const moduleConfig = buildModuleConfig(data);
		localCache.set('moduleConfig', moduleConfig)
		let cacheData = Object.assign({
			moduleConfig: moduleConfig,
			sdkDownloadUrl: sdkDownloadUrl
		}, {
			saveLocalConfig: data.saveLocalConfig
		})
		// 判断是否按照项目独立缓存
		if (configuration.get('easypackx.projectCacheConfig')) {
			writeProjectCache(getCacheFsPath(data, options), cacheData);
		} else {
			writeJsonFile(configCachePath, cacheData);
		}
	}
}

async function showFormDialog(context) {

	let webviewDialog = hx.window.createWebViewDialog({
		title: 'EasyPackX',
		description: '请填写构建前的必要配置内容',
		dialogButtons: [
			"取消", "开始构建"
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
	if (typeof webviewDialog.onDialogClosed === 'function') {
		webviewDialog.onDialogClosed(closeActiveWebSocketServer);
	}

	const workspaceFolders = await hx.workspace.getWorkspaceFolders();
	const configuration = hx.workspace.getConfiguration();
	const activeEditor = await hx.window.getActiveTextEditor();
	const workspaceFolder = await hx.workspace.getWorkspaceFolder(activeEditor?.document?.workspaceFolder);
	let options = {
		uniName: '',
		javaHome: await resolveJavaHome(localCache.get('javaHome') ?? getFirstConfiguration(configuration, JAVA_HOME_CONFIG_KEYS), 17),
		sdkDownloadUrl: getSdkDownloadUrl(configuration)
	}
	if (workspaceFolder?.uri?.uri?.fsPath) {
		options.uniName = workspaceFolder.uri.uri.fsPath ?? '';
		localCache.set('fsPath', options.uniName)
	} else {
		if (localCache.get('uniName')) {
			options.uniName = localCache.get('uniName');
		}
	}

	closeActiveWebSocketServer();
	let wss = null;
	try {
		// 表单页通过本地 WebSocket 与插件进程通信，重复打开前要先释放旧端口。
		wss = new WebSocket.Server({
			port: 9992
		});
		activeWebSocketServer = wss;
	} catch (error) {
		notifyError(`启动本地配置通信服务失败：${error.message}`);
		webviewDialog.close();
		return;
	}

	wss.on('error', (error) => {
		notifyError(`本地配置通信服务异常：${error.message}`);
	});

	const outputChannel = hx.window.createOutputChannel('EasyPackX');
	const customConsoleLog = outputChannel.appendLine.bind(outputChannel);
	
	async function executeCliPack (projectPath, callback) {
		try {
			if (configuration.get('easypackx.autoPublishAppResource') == true) {
				let exportFinished = false;
				const args = ['publish', 'app-android', '--type', 'appResource', '--project', projectPath];
				executeCliCommand(getCliDir(), args, (error, code) => {
					if (error) {
						output.error(`自动生成本地资源失败：${error}`);
						return;
					}
					if (code !== 0 && !exportFinished) {
						output.error(`自动生成本地资源失败，CLI 退出码：${code}`);
						return;
					}
					callback();
				}, (outputStr) => {
					output.info(outputStr);
					if (outputStr.indexOf('导出 android 成功') > -1) {
						exportFinished = true;
						return true;
					}
					return false;
				})
			} else {
				callback();
			}
		} catch (err) {
			// console.log(err);
			output.error(err);
		}
	}

	let globalWs = null;

	wss.on('connection', async function connection(ws, request) {
		const urlParams = new URL(request.url, 'http://127.0.0.1:9992');
		const key = urlParams.searchParams.get('key');

		if (key === 'adminadmin2024') {
			// console.log('客户端已连接');
			globalWs = ws;
			ws.on('message', async function incoming(message) {
				// console.log('收到消息: %s', message);
				// ws.send('收到消息：' + message);
				const msg = JSON.parse(message)
				if (msg.type === 'confirm') {
					msg.data = await normalizePackData(msg.data);
					outputChannel.show();
					localCache.set('uniName', msg.data.uniName);
					localCache.set('javaHome', msg.data.javaHome)
					localCache.set('saveLocalConfig', msg.data.saveLocalConfig)
					localCache.set('androidPackageName', msg.data.androidPackageName)
					localCache.set('storePath', msg.data.storeForm.storePath)
					localCache.set('storePassword', msg.data.storeForm.storePassword)
					localCache.set('keyAlias', msg.data.storeForm.keyAlias)
					localCache.set('keyPassword', msg.data.storeForm.keyPassword)
					localCache.set('sdkDownloadUrl', msg.data.sdkDownloadUrl)
					await saveCache(msg.data, options, configuration)
					closeActiveWebSocketServer()
					localCache.get('webviewDialog')?.close()
					await executeCliPack(msg.data.uniName, () => {
						let start = null;
						try {
							start = getPackStart(context.extensionPath);
						} catch (error) {
							notifyError(error.message);
							return;
						}
						start({
							hx: hx,
							uniappProjectPath: msg.data.uniName,
							allowClone: true,
							root: `${context.extensionPath}/src/easypackx`,
							customConsoleLog: customConsoleLog,
							customSetStatusMessage: hx.window.setStatusBarMessage,
							...msg.data,
							storePath: msg.data.storeForm.storePath,
							storePassword: msg.data.storeForm.storePassword,
							keyAlias: msg.data.storeForm.keyAlias,
							keyPassword: msg.data.storeForm.keyPassword,
							uniappxNativeAndroid: configuration.get("easypackx.uniappxNativeAndroid"),
							customSDKPath: configuration.get("easypackx.customSDKPath")
						})
					})
				}
				if (msg.type === 'checkPackenv' && msg.data.localPack) {
					const checkPackenvRes = await checkPackenv(msg.data.androidLocalSdk, msg
						.data.javaHome)
					ws.send(JSON.stringify({
						type: 'autoCheckPackenvRes',
						data: checkPackenvRes
					}))
				}
				if (msg.type === 'scanCertificateFiles') {
					ws.send(JSON.stringify({
						type: 'certificateFiles',
						data: await scanCertificateFiles(msg.data?.uniName)
					}));
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
				data: getFirstConfiguration(configuration, SDK_DIR_CONFIG_KEYS)
			}))
			const fsPath = localCache.get('fsPath') ?? options.uniName
			ws.send(JSON.stringify({
				type: 'uniName',
				data: fsPath
			}))
			ws.send(JSON.stringify({
				type: 'certificateFiles',
				data: await scanCertificateFiles(fsPath)
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
			const configData = getCachedConfig(configuration, fsPath);
			if (Object.keys(configData).length > 0 || localCache.get('moduleConfig')) {
				const saveLocalConfig = configData?.saveLocalConfig ?? localCache.get('saveLocalConfig')
				ws.send(JSON.stringify({
					type: 'saveLocalConfig',
					data: saveLocalConfig ?? false
				}))
				const moduleConfig = configData?.moduleConfig ?? localCache.get('moduleConfig')
				ws.send(JSON.stringify({
					type: 'moduleConfig',
					data: moduleConfig ?? {}
				}))
			}
			ws.send(JSON.stringify({
				type: 'androidPackageName',
				data: localCache.get('androidPackageName') ?? configuration.get(
					'easypackx.androidPackageName')
			}))
			ws.send(JSON.stringify({
				type: 'storePath',
				data: localCache.get('storePath') ?? configuration.get(
					'easypackx.storePath')
			}))
			ws.send(JSON.stringify({
				type: 'storePassword',
				data: localCache.get('storePassword') ?? configuration.get(
					'easypackx.storePassword')
			}))
			ws.send(JSON.stringify({
				type: 'keyAlias',
				data: localCache.get('keyAlias') ?? configuration.get(
					'easypackx.keyAlias')
			}))
			ws.send(JSON.stringify({
				type: 'keyPassword',
				data: localCache.get('keyPassword') ?? configuration.get(
					'easypackx.keyPassword')
			}))
			ws.send(JSON.stringify({
				type: 'sdkDownloadUrl',
				data: getSdkDownloadUrl(configuration, configData)
			}))
		} else {
			console.log('认证失败');
			ws.close(1008, '认证失败');
		}
	});

	webview.onDidReceiveMessage(async (msg) => {
		if (msg.command == 'cancel') {
			closeActiveWebSocketServer()
			webviewDialog.close();
		}
		if (msg.command == 'openWeb') {
			hx.env.openExternal(msg.href);
		}
		if (msg.command == 'confirm') {
			msg.data = await normalizePackData(msg.data);
			outputChannel.show();
			// webviewDialog.close()
			localCache.set('uniName', msg.data.uniName);
			localCache.set('javaHome', msg.data.javaHome)
			localCache.set('androidPackageName', msg.data.androidPackageName)
			localCache.set('storePath', msg.data.storeForm.storePath)
			localCache.set('storePassword', msg.data.storeForm.storePassword)
			localCache.set('keyAlias', msg.data.storeForm.keyAlias)
			localCache.set('keyPassword', msg.data.storeForm.keyPassword)
			localCache.set('sdkDownloadUrl', msg.data.sdkDownloadUrl)
			await saveCache(msg.data, options, configuration)
			// if (msg.data.saveLocalConfig) {
			// 	const moduleConfig = {}
			// 	Object.keys(msg.data).map(item => {
			// 		if (item.startsWith('uni-')) {
			// 			moduleConfig[item] = msg.data[item]
			// 		}
			// 	})
			// 	localCache.set('moduleConfig', moduleConfig)
			// }
			closeActiveWebSocketServer()
			webviewDialog.close()
			await executeCliPack(msg.data.uniName, () => {
				let start = null;
				try {
					start = getPackStart(context.extensionPath);
				} catch (error) {
					notifyError(error.message);
					return;
				}
				start({
					hx: hx,
					uniappProjectPath: msg.data.uniName,
					allowClone: true,
					root: `${context.extensionPath}/src/easypackx`,
					customConsoleLog: outputChannel.appendLine.bind(outputChannel),
					customSetStatusMessage: hx.window.setStatusBarMessage,
					...msg.data,
					storePath: msg.data.storeForm.storePath,
					storePassword: msg.data.storeForm.storePassword,
					keyAlias: msg.data.storeForm.keyAlias,
					keyPassword: msg.data.storeForm.keyPassword,
					uniappxNativeAndroid: configuration.get("easypackx.uniappxNativeAndroid"),
					customSDKPath: configuration.get("easypackx.customSDKPath")
				})
			})
		}
	});

	console.log('WebSocket服务器正在监听9992端口');

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
