const md = require("./markdown");
const path = require("path");
const { executeCliCommand } = require('./execute');
const { getActiveProject, hx } = require('./hx');
const { output, colors } = require('./output');
const { DEFAULT_ANDROID_SDK_URL, DEFAULT_IOS_SDK_URL, DEFAULT_IOS_BUNDLE_ID } = require('./constants');

function arrayRemove(arr, elementOrIndex) {
	// 检查是否是数字（索引）
	if (typeof elementOrIndex === 'number') {
		// 删除指定索引的元素
		arr.splice(elementOrIndex, 1);
	} else {
		// 查找元素在数组中的索引
		const index = arr.indexOf(elementOrIndex);
		if (index !== -1) {
			// 如果元素存在，删除它
			arr.splice(index, 1);
		}
	}
	return arr;
}

async function mark2html (html) {
	return md.render(html);
}

function getVersionCode (version) {
	return parseInt(version.split('.').join(''));
}

function getContentBeforeSubstring(str, substr) {
  const index = str.indexOf(substr);
  if (index === -1) {
    // 子字符串未找到
    return null;
  }
  return str.substring(0, index);
}

/**
 * 获取cli所在的目录
 */
function getCliDir() {
	if (process.platform === 'darwin') {
		const appRoot = hx.env.appRoot ?? '';
		const appBundleRoot = getContentBeforeSubstring(appRoot, '/Contents/HBuilderX');
		if (appBundleRoot) {
			return path.join(appBundleRoot, 'Contents', 'MacOS');
		}

		// 兼容 HBuilderX 未来调整 appRoot 的情况，优先回退到当前 appRoot 旁边的 MacOS 目录。
		return path.join(appRoot, '..', 'MacOS');
	}
	
	return `${hx.env.appRoot}`;
}

module.exports = {
	arrayRemove,
	mark2html,
	getVersionCode,
	executeCliCommand,
	getCliDir,
	hx,
	getActiveProject,
	output,
	colors,
	DEFAULT_ANDROID_SDK_URL,
	DEFAULT_IOS_SDK_URL,
	DEFAULT_IOS_BUNDLE_ID
}
