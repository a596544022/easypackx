const hx = require('hbuilderx');

async function getActiveProject() {
	const activeEditor = await hx.window.getActiveTextEditor();
	const workspaceFolder = await hx.workspace.getWorkspaceFolder(activeEditor?.document?.workspaceFolder);
	
	return workspaceFolder;
}

module.exports = {
	getActiveProject,
	hx
}
