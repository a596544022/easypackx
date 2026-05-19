# EasyPackX

EasyPackX 是一个用于 `uni-app x` Android 本地离线打包的 HBuilderX 插件，可以构建自定义调试基座、正式发行包，或仅生成原生工程。

## 功能特性

- 本地离线构建 Android 安装包
- 自动合并项目资源、`uni_modules` 原生资源和扩展包
- 自动识别可导入的 `uni-app x` 模块
- 支持自定义证书、包名、APK/AAB 和渠道包
- 支持 Android 离线打包 SDK 自动下载、缓存和更新
- 支持项目级模块配置缓存
- 支持自动检测 Android SDK 与 JDK 环境

## 使用方式

在 HBuilderX 中打开目标项目后，可以通过以下入口启动：

- 右键菜单：`EasyPackX` -> `打包uniapp x`
- 顶部运行菜单：`EasyPackX` -> `打包uniapp x`

## 插件配置

打开 HBuilderX 的 `设置` -> `插件配置` -> `EasyPackX` 可以设置全局配置。

常用配置项：

- `easypackx.sdkDownloadUrl`：Android 离线打包 SDK 下载地址或本地 SDK 路径
- `easypackx.sdkDir`：本机 Android SDK 路径
- `easypackx.javaHome`：JDK 路径，建议 JDK 17
- `easypackx.uniappxNativeAndroid`：生成的原生工程保存目录
- `easypackx.validateSDKVersion`：是否校验 HBuilderX 编译器与离线 SDK 版本
- `easypackx.projectCacheConfig`：是否按项目单独缓存模块配置
- `easypackx.autoPublishAppResource`：打包前是否自动发行本地资源
- `easypackx.customSDKPath`：自定义本地 SDK 解压目录或压缩包路径

## 本地开发

```shell
npm install
```

核心打包逻辑位于 `src/easypackx`。调试核心逻辑时可以进入该目录执行：

```shell
npm install
npm run doctor
```

## 发布说明

仓库应提交插件入口、表单、核心源码、模板和基础原生工程。不要提交以下内容：

- `node_modules`
- Android 离线 SDK 缓存
- 生成的 `uniappx-native-android`
- 运行日志
