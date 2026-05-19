const hx = require('hbuilderx');
const outputChannel = hx.window.createOutputChannel('uni-app x 离线打包');
const customConsoleLog = outputChannel.appendLine;

const colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",
  
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

function colorize (text, color) {
	return color + text + colors.Reset;
}

const output = {
	warn (text) {
		customConsoleLog?.({
			line: colorize(text, colors.FgYellow),
			nocolor: false
		});
	},
	success (text) {
		customConsoleLog?.({
			line: colorize(text, colors.FgGreen),
			nocolor: false
		});
	},
	error (text) {
		customConsoleLog?.({
			line: colorize(text, colors.FgRed),
			nocolor: false
		});
	},
	info (text, color = null) {
		// endgine?.({
		// 	line: colorize(text, colors.FgBlack),
		// 	nocolor: false
		// });
		customConsoleLog?.(text, color);
	}
}

module.exports = {
	output,
	colors
}
