let hx = require('hbuilderx');
const fs = require('fs');
const {
	start
} = require('./kux-easy-pack/src/pack');
const { arrayRemove } = require('./utils');
const NodeCache = require('node-cache');
const localCache = new NodeCache();

const repositoryUrlItem = {
	type: 'textEditor',
	name: 'repositoryUrl',
	title: '原生工程仓库地址',
	placeholder: '请输入原生工程仓库地址',
	text: hx.workspace.getConfiguration().get('kux-easy-pack-hxp.repositoryUrl') ?? ''
};

function buildTag (content) {
	return `<span style="background: #F5F5F5;padding: 3px 6px;border-radius: 5px;"> ${content} </span>`;
}
const repositoryUrlDescItem = {
	type: 'label',
	name: 'repositoryUrlDesc',
	text: `1、请 ${buildTag('fork')}<a href="https://github.com/kviewui/uniappx-native-android">uniappx-native-android</a>项目到自己的 github 仓库。<br/>2、填写自己 ${buildTag('fork')} 后的仓库地址。<br/>3、请填写ssh协议格式，示例：${buildTag('git@github.com:kviewui/uniappx-native-android.git')}`,
	canSelect: true
};

const widgetGroupCloudItems = [repositoryUrlItem, repositoryUrlDescItem];

const androidLocalSdkItem = {
	type: 'fileSelectInput',
	name: 'androidLocalSdk',
	label: '安卓SDK位置',
	placeholder: '请输入本地安装的安卓SDK位置',
	mode: 'folder',
	value: hx.workspace.getConfiguration().get('uts-development-android.sdkDir') ?? ''
};

const javaHomeItem = {
	type: 'fileSelectInput',
	name: 'javaHome',
	label: 'JDK路径',
	placeholder: '请输入本地安装的JDK路径，如安装了android studio，则一般为 %安装路径%\\jbr。如未填写则以gradlew默认配置为准。',
	mode: 'folder',
	value: hx.workspace.getConfiguration().get('kux-easy-pack-hxp.javaHome') ?? ''
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
		title: "kux自定义打包",
		subtitle: "请填写打包前的必要配置内容",
		formItems: [{
				type: "fileSelectInput",
				name: "uniName",
				label: "项目位置",
				placeholder: "请选择要打包的项目",
				mode: 'folder',
				value: options.uniName
			},
			{
				type: "radioGroup",
				name: "packType",
				label: "打包方式",
				items: [{
						label: "Github自动打包",
						id: "github"
					},
					{
						label: "本地自动打包",
						id: "local"
					}
				],
				value: 'local'
			},
			{
				type: "textEditor",
				name: "sdkDownloadUrl",
				title: "Android离线打包SDK下载地址",
				placeholder: "请输入uni-app x Android离线打包SDK下载地址",
				text: hx.workspace.getConfiguration().get('kux-easy-pack-hxp.sdkDownloadUrl') ?? "https://web-ext-storage.dcloud.net.cn/uni-app-x/sdk/Android-uni-app-x-SDK@11848-4.19-1.zip"
			},
			{
				type: "label",
				name: "sdkDownloadUrlDesc",
				text: '请输入uni-app x Android离线打包SDK下载地址，<a href="https://doc.dcloud.net.cn/uni-app-x/native/download/android.html">查看详情</a>'
			}
		]
	}
	if (options.packType === 'github') {
		uiData.formItems.push(...widgetGroupCloudItems);
	} else {
		uiData.formItems.push(...widgetGroupLocalItems);
	}
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
	let options = {
		pickType: 'local',
		uniName: '',
		repositoryUrl: localCache.get('repositoryUrl') ?? hx.workspace.getConfiguration().get('kux-easy-pack-hxp.repositoryUrl')
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
			if (formData.packType === 'github' && !formData.repositoryUrl) {
				this.showError("选择云端打包时原生工程地址不能为空，请填写");
				return false;
			}
			if (formData.packType === 'local' && !formData.androidLocalSdk) {
				this.showError("选择本地打包时安卓SDK地址不能为空，请填写");
				return false;
			}
			return true;
		},
		onOpened: function() {},
		onChanged: function(field, value) {
			options.pickType = value;
			if (field == "packType") {
				let updateData = getUIData(options);
				if (value === 'github') {
					// 删除本地打包选项
					updateData.formItems = arrayRemove(updateData.formItems, androidLocalSdkItem);
					widgetGroupCloudItems[0].text = options.repositoryUrl;
					updateData.formItems.push(...widgetGroupCloudItems);
				} else {
					// 删除云端打包选项
					updateData.formItems = arrayRemove(updateData.formItems, repositoryUrlItem);
					updateData.formItems = arrayRemove(updateData.formItems, repositoryUrlDescItem);
					updateData.formItems.push(...widgetGroupLocalItems);
				}
				this.updateForm(updateData);
			};
		}
	}).then(async (res) => {
		const outputChannel = hx.window.createOutputChannel('kux自定义打包');
		outputChannel.show();
		try {
			localCache.set('repositoryUrl', res.repositoryUrl);
			localCache.set('uniName', res.uniName);
			await start({
				localPack: res.packType === 'local',
				uniappProjectPath: res.uniName,
				allowClone: true,
				root: `${context.extensionPath}/src/kux-easy-pack`,
				androidLocalSdk: res.androidLocalSdk,
				customConsoleLog: outputChannel.appendLine,
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