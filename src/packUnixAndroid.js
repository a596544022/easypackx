let hx = require('hbuilderx');
const fs = require('fs');
const { DEFAULT_ANDROID_SDK_URL } = require('./utils');
const { resolveJavaHome } = require('./utils/checkEnv');
const { getPackStart } = require('./utils/easypackxCore');
const NodeCache = require('node-cache');
const localCache = new NodeCache();
const JAVA_HOME_CONFIG_KEYS = [
	'easypackx.javaHome',
	'uts-development-android.javaHome'
];

function getFirstConfiguration(configuration, keys) {
	for (const key of keys) {
		const value = configuration.get(key);
		if (value) {
			return value;
		}
	}
	return '';
}

const androidLocalSdkItem = {
	type: 'fileSelectInput',
	name: 'androidLocalSdk',
	label: '安卓SDK位置',
	placeholder: '请输入本地安装的安卓SDK位置',
	mode: 'folder',
	value: hx.workspace.getConfiguration().get('easypackx.sdkDir') ?? hx.workspace.getConfiguration().get('uts-development-android.sdkDir') ?? ''
};

const javaHomeItem = {
	type: 'fileSelectInput',
	name: 'javaHome',
	label: 'JDK路径',
	placeholder: '请输入本地安装的JDK路径，如安装了android studio，则一般为 %安装路径%\\jbr。如未填写则以gradlew默认配置为准。',
	mode: 'folder',
	value: ''
}

const javaHomeDescItem = {
	type: "label",
	name: "javaHomeDesc",
	text: "请输入本地安装的JDK路径，如安装了android studio，则一般为 %安装路径%\\jbr。如未填写则以gradlew默认配置为准。",
	canSelect: true
}

const widgetGroupLocalItems = [androidLocalSdkItem, javaHomeItem, javaHomeDescItem];

const moduleItem = {
	type: "label",
	name: "moduleItem",
	text: "模块配置"
}

/**
 * @description 窗口控件
 * @param {Object} selected
 */
function getUIData(options) {
	let uiData = {
		title: "EasyPackX",
		subtitle: "请填写构建前的必要配置内容",
		formItems: [{
				type: "fileSelectInput",
				name: "uniName",
				label: "项目位置",
				placeholder: "请选择要打包的项目",
				mode: 'folder',
				value: options.uniName
			},
			{
				type: "textEditor",
				name: "sdkDownloadUrl",
				title: "Android离线打包SDK下载地址",
				placeholder: "请输入uni-app x Android离线打包SDK下载地址",
				text: hx.workspace.getConfiguration().get('easypackx.sdkDownloadUrl') ?? DEFAULT_ANDROID_SDK_URL
			},
			{
				type: "label",
				name: "sdkDownloadUrlDesc",
				text: '请输入uni-app x Android离线打包SDK下载地址，<a href="https://doc.dcloud.net.cn/uni-app-x/native/download/android.html">查看详情</a>'
			}
		]
	}
	uiData.formItems.push(...widgetGroupLocalItems);
	return uiData;
};

function getFolderByPath (filePath) {
	// 使用最后一个'/'分割路径，得到目录和文件名
	const lastSlashIndex = filePath.lastIndexOf('/');
	
	// 获取目录部分
	const directory = filePath.substring(0, lastSlashIndex);
	
	if (directory[0] == '/') {
		return directory.replace(/^\//, '');
	}
	
	return directory;
}

async function showFormDialog(context) {
	// console.log((await hx.window.getActiveTextEditor()).document.workspaceFolder);
	const configuration = hx.workspace.getConfiguration();
	javaHomeItem.value = await resolveJavaHome(getFirstConfiguration(configuration, JAVA_HOME_CONFIG_KEYS), 17);
	let options = {
		pickType: 'local',
		uniName: ''
	}
	
	const activeEditor = await hx.window.getActiveTextEditor();
	const workspaceFolder = await hx.workspace.getWorkspaceFolder(activeEditor?.document?.workspaceFolder);
	if (workspaceFolder?.uri?.uri?.fsPath) {
		options.uniName = workspaceFolder.uri.uri.fsPath ?? '';
	} else {
		if (localCache.get('uniName')) {
			options.uniName = localCache.get('uniName');
		}
	}
	
	// 获取默认UI数据
	let uidata = getUIData(options);
	uidata.formItems.push(moduleItem);

	hx.window.showFormDialog({
		...uidata,
		width: 480,
		height: 280,
		submitButtonText: "提交(&S)",
		cancelButtonText: "取消(&C)",
		validate: function(formData) {
			if (!formData.uniName) {
				this.showError("项目位置不能为空，请填写");
				return false;
			};
			if (!formData.androidLocalSdk) {
				this.showError("安卓SDK地址不能为空，请填写");
				return false;
			}
			return true;
		},
		onOpened: function() {},
		onChanged: function() {}
	}).then(async (res) => {
		const outputChannel = hx.window.createOutputChannel('EasyPackX');
		outputChannel.show();
		try {
			localCache.set('uniName', res.uniName);
			const start = getPackStart(context.extensionPath);
			await start({
				localPack: true,
				uniappProjectPath: res.uniName,
				allowClone: true,
				root: `${context.extensionPath}/src/easypackx`,
				androidLocalSdk: res.androidLocalSdk,
				customConsoleLog: outputChannel.appendLine.bind(outputChannel),
				customSetStatusMessage: hx.window.setStatusBarMessage,
				hx: hx,
				...res
			})
		} catch (e) {
			// outputChannel.appendLine(JSON.stringify(e));
			console.log(e);
		}
	})

};

module.exports = showFormDialog;
