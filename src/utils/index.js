const md = require("./markdown");

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

module.exports = {
	arrayRemove,
	mark2html,
	getVersionCode
}