const fs = require('fs');
const path = require('path');

function getCoreRoot(extensionPath) {
	return path.join(extensionPath, 'src', 'easypackx');
}

function buildMissingCoreError(coreRoot) {
	return new Error(
		`缺少核心打包目录：${coreRoot}。请确认 src/easypackx 已随插件一起安装，否则只能加载界面，无法执行打包。`
	);
}

function getPackStart(extensionPath) {
	const coreRoot = getCoreRoot(extensionPath);
	const packPath = path.join(coreRoot, 'src', 'pack.js');
	if (!fs.existsSync(packPath)) {
		throw buildMissingCoreError(coreRoot);
	}

	const packModule = require(packPath);
	if (typeof packModule.start !== 'function') {
		throw new Error(`核心打包入口无效：${packPath} 未导出 start 方法。`);
	}

	return packModule.start;
}

function getLogger(extensionPath) {
	const loggerPath = path.join(getCoreRoot(extensionPath), 'log', 'logger.js');
	try {
		if (fs.existsSync(loggerPath)) {
			return require(loggerPath).logger;
		}
	} catch (error) {
		console.warn('加载 EasyPackX 日志模块失败：', error);
	}

	// 缺少私有核心目录时，退回到控制台，保证插件激活阶段不崩溃。
	return {
		warn: console.warn,
		error: console.error,
		info: console.log
	};
}

module.exports = {
	getPackStart,
	getLogger
};
