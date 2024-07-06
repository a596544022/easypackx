const fs = require('fs');
const path = require('path');
// 缓存文件路径
const cacheFilePath = path.join(__dirname, 'cache.json');

// 设置缓存
function setCache(key, value) {
  // 读取现有缓存
  fs.readFile(cacheFilePath, 'utf8', (err, data) => {
    if (err) {
      // 如果文件不存在，创建一个新对象
      data = {};
    } else {
      // 如果文件存在，解析缓存数据
      data = JSON.parse(data);
    }
    // 添加或更新缓存 key
    data[key] = value;
    // 将更新后的缓存写入文件
    fs.writeFile(cacheFilePath, JSON.stringify(data), 'utf8', (err) => {
      if (err) {
        console.error('写入缓存时出错:', err);
      }
    });
  });
}

// 获取缓存
function getCache(key) {
  return new Promise((resolve, reject) => {
    fs.readFile(cacheFilePath, 'utf8', (err, data) => {
      if (err) {
        // 如果文件不存在或读取错误，返回 null
        resolve(null);
      } else {
        // 如果文件存在，解析缓存数据并返回对应的 key
        const cache = JSON.parse(data);
        resolve(cache[key]);
      }
    });
  });
}

// 删除缓存
function deleteCache(key) {
  fs.readFile(cacheFilePath, 'utf8', (err, data) => {
    if (err) {
      // 如果文件不存在，不需要删除
      return;
    }
    // 解析缓存数据
    const cache = JSON.parse(data);
    // 删除指定的 key
    delete cache[key];
    // 将更新后的缓存写入文件
    fs.writeFile(cacheFilePath, JSON.stringify(cache), 'utf8', (err) => {
      if (err) {
        console.error('删除缓存时出错:', err);
      }
    });
  });
}

module.exports = {
	getCache,
	setCache,
	deleteCache
}
