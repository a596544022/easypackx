const fs = require('fs')
const path = require('path')
const child_process = require('child_process')

function getJavaHomeCandidates(javaHome) {
	return [
		javaHome,
		process.env.JAVA_HOME,
		'/Applications/ServBay/package/openjdk/17/current.sdk',
		'/Applications/ServBay/package/openjdk/17/current.sdk/Contents/Home',
		'/Applications/ServBay/package/openjdk/current.sdk',
		'/Applications/ServBay/package/openjdk/current.sdk/Contents/Home',
		'/Applications/Android Studio.app/Contents/jbr/Contents/Home',
		'/Applications/HBuilderX.app/Contents/HBuilderX/plugins/uts-development-android/openjdk'
	].filter(Boolean);
}

function normalizeJavaHome(javaHome) {
	const candidates = process.platform === 'win32'
		? [javaHome]
		: [
			javaHome,
			path.join(javaHome, 'Contents', 'Home')
		];

	return candidates.find(item => fs.existsSync(path.join(item, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) ?? javaHome;
}

function getJavaBinaryPath(javaHome) {
	const candidates = process.platform === 'win32'
		? [path.join(javaHome, 'bin', 'java.exe')]
		: [
			path.join(javaHome, 'bin', 'java'),
			path.join(javaHome, 'Contents', 'Home', 'bin', 'java')
		];

	// JDK、jbr、.jdk/Contents/Home 的目录结构不同，这里按存在性选择真实 java 可执行文件。
	return candidates.find(item => fs.existsSync(item)) ?? candidates[0];
}

async function resolveJavaHome(javaHome, requiredVersion = 17) {
	for (const candidate of getJavaHomeCandidates(javaHome)) {
		const normalized = normalizeJavaHome(candidate);
		if (!fs.existsSync(getJavaBinaryPath(normalized))) {
			continue;
		}
		const version = await getJavaVersion(normalized);
		if (!version.startsWith('获取') && !version.startsWith('无法') && parseInt(version) >= requiredVersion) {
			return normalized;
		}
	}
	return normalizeJavaHome(javaHome ?? process.env.JAVA_HOME ?? '');
}

/**
 * 获取 JAVA_HOME 下的 Java 版本
 * @returns {Promise<string>} Java 版本信息，如果出错则返回错误信息。
 */
async function getJavaVersion(javaHomePath) {
	const javaHome = normalizeJavaHome(javaHomePath ?? process.env.JAVA_HOME ?? '');
	if (!javaHome) {
		return 'JAVA_HOME 环境变量未设置';
	}

	const javaPath = getJavaBinaryPath(javaHome);
	try {
		const {
			stdout,
			stderr
		} = await new Promise((resolve, reject) => {
			child_process.execFile(javaPath, ['-version'], (err, stdout, stderr) => {
				if (err) {
					reject(err);
				} else {
					resolve({
						stdout,
						stderr
					});
				}
			});
		});

		// Java 版本信息通常在 stderr 中
		const versionLine = stderr.split('\n')[0];
		const versionMatch = versionLine.match(/version "(.*)"/);
		if (versionMatch && versionMatch[1]) {
			return versionMatch[1];
		} else {
			return '无法识别的 Java 版本';
		}
	} catch (err) {
		return `获取 Java 版本时出错: ${err.message}`;
	}
}

/**
 * 检测是否符合当前 gradlew 执行环境要求的 ANDROID_HOME
 * @returns {Promise<string>} 如果环境符合，返回 'success'，否则返回错误信息。
 */
async function checkAndroidHome(androidHomePath) {
	const androidHome = androidHomePath ?? process.env.ANDROID_HOME;
	if (!androidHome) {
		return 'ANDROID_HOME 环境变量未设置';
	}

	// 检查 ANDROID_HOME 目录是否存在
	try {
		await fs.promises.access(androidHome, fs.constants.F_OK);
	} catch (err) {
		return 'ANDROID_HOME 目录不存在';
	}

	// // 检查 ANDROID_HOME 目录下是否包含必要的 SDK 文件和目录
	// const sdkManagerPath = path.join(androidHome, 'tools', 'bin', 'sdkmanager');
	// try {
	//     await fs.promises.access(sdkManagerPath, fs.constants.F_OK);
	// } catch (err) {
	//     return 'ANDROID_HOME 目录不包含 sdkmanager';
	// }
	// 检查必要的工具和目录
	const requiredTools = ['platform-tools', 'build-tools'];
	for (const tool of requiredTools) {
		const toolPath = path.join(androidHome, tool);
		try {
			await fs.promises.access(toolPath, fs.constants.F_OK);
		} catch (err) {
			return `缺少必要的SDK工具或目录: ${tool}`;
		}
	}

	// 如果通过了所有检查，返回 'success'
	return 'success';
}

/**
 * 检测是否符合当前 gradlew 执行环境
 * @returns {Promise<string>} 如果环境符合，返回 'success'，否则返回错误信息。
 */
async function checkGradleEnvironment() {
	// 假设当前目录是项目的根目录
	const gradlewPath = path.join(process.cwd(), 'gradlew');

	try {
		// 检查 gradlew 脚本是否存在
		await fs.promises.access(gradlewPath, fs.constants.F_OK);
	} catch (err) {
		return 'gradlew 脚本不存在';
	}

	try {
		// 检查 gradlew 脚本是否可执行
		await fs.promises.access(gradlewPath, fs.constants.X_OK);
	} catch (err) {
		return 'gradlew 脚本不可执行';
	}

	// 尝试执行 gradlew 脚本来检查是否能够正常工作
	try {
		const {
			status,
			error
		} = await new Promise((resolve, reject) => {
			child_process.execFile(gradlewPath, ['--version'], (err, stdout, stderr) => {
				if (err) {
					reject({
						status: null,
						error: err
					});
				} else {
					resolve({
						status: stdout,
						error: null
					});
				}
			});
		});

		if (error) {
			return `执行 gradlew 脚本时出错: ${error.message}`;
		}

		// 如果执行成功，返回 'success'
		return 'success';
	} catch (err) {
		return `执行 gradlew 脚本时遇到未知错误: ${err.message}`;
	}
}

/**
 * 检测是否符合当前 gradlew 执行环境要求的 Java 版本
 * @param {string} requiredVersion - 要求的 Java 版本，例如 '1.8' 或 '11'。
 * @returns {Promise<string>} 如果环境符合，返回 'success'，否则返回错误信息。
 */
async function checkGradleJavaVersion(javaHome, requiredVersion) {
	const resolvedJavaHome = await resolveJavaHome(javaHome, requiredVersion);
	const currentVersion = await getJavaVersion(resolvedJavaHome);
	if (currentVersion.startsWith('无法') || currentVersion.startsWith('获取')) {
		return currentVersion;
	}

	// 检查当前 Java 版本是否符合要求
	if (parseInt(currentVersion) >= parseInt(`${requiredVersion}`)) {
		return 'success';
	}

	return `当前 Java 版本 ${currentVersion} 不符合要求的版本${requiredVersion}`
}

module.exports = {
	getJavaVersion,
	resolveJavaHome,
	checkAndroidHome,
	checkGradleEnvironment,
	checkGradleJavaVersion
}
