const crossSpawn = require('cross-spawn');
const path = require('path');

function executeCliCommand(cliPath, args, callback, killFunc) {
	// 根据操作系统确定可执行文件的名称
	const cliExecutable = process.platform === 'win32' ? 'cli.exe' : 'cli';
	// 组装完整的可执行文件路径
	const cliCommand = path.join(cliPath, cliExecutable);
	
	// 启动子进程
	const childProcess = crossSpawn.spawn(cliCommand, args);
	
	// 将子进程的输出和错误输出重定向到父进程
	childProcess.stdout.pipe(process.stdout);
	childProcess.stderr.pipe(process.stderr);
	
	// 监听子进程输出，根据输出判断是否需要杀死子进程
	childProcess.stdout.on('data', (data) => {
		if (killFunc && killFunc(data.toString())) {
			childProcess.kill();
			return;
		}
	});
	
	// 监听子进程的错误
	childProcess.on('error', (err) => {
		callback(err);
	});
	
	// 监听子进程的关闭
	childProcess.on('close', (code) => {
		callback(null, code);
	});
}

module.exports = {
	executeCliCommand
}