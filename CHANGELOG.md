## 1.0.34 (2025-05-22)
+ 修复 `uni_modules` 插件依赖三方插件时原生工程重复导入依赖的问题。
+ 打包类型新增支持 `仅生成原生工程`。
+ 优化其他已知问题。

## 1.0.33 (2025-05-14)
+ 【内置模块】新增 `uni-modal` [模态弹窗](https://doc.dcloud.net.cn/uni-app-x/api/modal.html)模块。
+ 【内置模块】新增 `uni-camera` [相机组件](https://doc.dcloud.net.cn/uni-app-x/component/camera.html#camera)模块。
+ 【内置模块】新增 `uni-requestMerchantTransfer` [转账确认收款](https://doc.dcloud.net.cn/uni-app-x/api/request-merchant-transfer.html#requestmerchanttransfer)模块。
+ 【内置模块】新增 `uni-recorder` [录音](https://doc.dcloud.net.cn/uni-app-x/api/get-recorder-manager.html)模块。
+ 【内置模块】新增 `uni-makePhoneCall` [拨打电话](https://doc.dcloud.net.cn/uni-app-x/api/make-phone-call.html)模块。
+ 优化打包自动添加被依赖模块。

## 1.0.32 (2025-04-16)
+ 修复 `uni-getLocation` 模块在 `4.61` 编译器适配问题。
+ 优化其他已知问题。

## 1.0.31 (2025-02-27)
+ 【内置模块】新增 `uni-getBackgroundAudioManager` 背景音频模块。
+ 【内置模块】新增 `uni-actionSheet` 弹出操作菜单模块。
+ 【内置模块】新增 `uni-previewImage` 图片预览模块。
+ 【内置模块】新增 `uni-chooseMedia` 拍摄或从手机相册中选择图片或视频模块。
+ 【内置模块】新增 `uni-arrayBufferToBase64` arrayBufferToBase64模块。
+ 【内置模块】新增 `uni-base64ToArrayBuffer` base64ToArrayBuffer模块。
+ 【内置模块】新增 `uni-sse` sse模块。
+ 插件可视化界面新增 `自定义项目SDK路径`。选择自己下载解压后的SDK目录路径
+ `Android离线打包SDK地址` 新增支持本地SDK路径，支持压缩包或者解压后的目录。
+ 修复 `4.53` SDK解压异常问题。
+ 优化其他已知问题。

## 1.0.30 (2024-12-06)
+ 修复开启 `插件自动发行本地资源` 后打包提示 `不支持host参数` 问题。

## 1.0.29 (2024-12-05)
+ 默认CPU类型对齐官方配置，默认只打包 `arm64-v8a` 架构。
+ 新增打包格式，支持 `apk` 和 `aab` 格式。
+ 新增APK发行渠道，支持官方最新渠道配置。
+ 【内置模块】新增 `uni-privacy` 隐私API模块。
+ 【内置模块】新增 `uni-getProvider` 获取服务供应商模块。
+ 【内置模块】新增 `uni-shareWithSystem` [系统分享](https://doc.dcloud.net.cn/uni-app-x/api/share-with-system.html)模块。
+ 【内置模块】新增 `uni-createInnerAudioContext` [音频](https://doc.dcloud.net.cn/uni-app-x/api/create-inner-audio-context.html)模块。
+ 【内置模块】新增 `uni-chooseLocation` [使用地图选择位置](https://doc.dcloud.net.cn/uni-app-x/api/choose-location.html)模块。
+ 【内置模块】`uni-getLocation-system` 模块调整为 `uni-getLocation` 定位模块，支持 `腾讯定位` 和 `系统定位`。
+ 【内置模块】`uni-cloudClient` 依赖模块新增 `uni-map-tencent`。
+ 【其他模块】新增 `uni-map-tencent` [map地图组件](https://doc.dcloud.net.cn/uni-app-x/component/map.html) 模块。
+ 【其他模块】`uni-ad` 新增同步支持官方最新聚合平台。
+ 新增【模块服务商配置参数】，用来设置模块里面需要的服务商秘钥等信息。
+ 优化打包UI界面展示，对齐官方模块文档。
+ 插件可视化界面新增 `插件自动发行本地资源` ，勾选后每次打包时都会自动调用cli的发行本地资源命令
	+ 注意：该选项为实验性特性，如果开启后打包失败请关闭后重新打包。
+ 新增支持自动替换项目根目录的 `AndroidManifest.xml`，插件会把项目根目录的该文件替换到 `app` 主模块下面，插件默认的配置代码如下：

	```
	<?xml version="1.0" encoding="utf-8"?>
	<manifest xmlns:android="http://schemas.android.com/apk/res/android"
	    xmlns:tools="http://schemas.android.com/tools">
	
	    <uses-permission android:name="android.permission.INTERNET" />
	    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
	
	    <application
	        android:allowBackup="true"
	        android:dataExtractionRules="@xml/data_extraction_rules"
	        android:fullBackupContent="@xml/backup_rules"
	        android:icon="@mipmap/ic_launcher"
	        android:label="@string/app_name"
	        android:roundIcon="@mipmap/ic_launcher_round"
	        android:supportsRtl="true"
			android:theme="@style/Theme.AppCompat.NoActionBar"
			tools:replace="android:allowBackup,android:theme"
	        tools:targetApi="31">
	        <activity android:name="io.dcloud.uniapp.UniAppActivity" android:configChanges="orientation|keyboard|keyboardHidden|smallestScreenSize|screenLayout|screenSize|mcc|mnc|fontScale|navigation|uiMode" android:exported="true" android:screenOrientation="portrait" android:theme="@style/UniAppX.Activity.DefaultTheme" android:windowSoftInputMode="adjustResize" tools:replace="android:exported,android:theme,android:configChanges,android:windowSoftInputMode,android:screenOrientation">
	            <intent-filter>
	                <action android:name="android.intent.action.MAIN" />
	
	                <category android:name="android.intent.category.LAUNCHER" />
	            </intent-filter>
	        </activity>
	    </application>
	</manifest>
	```
	
	+ 注意：该操作需要非常谨慎，建议仔细核对好上面的配置后再自行和自己的配置做合并后再继续。

+ 优化其他已知问题。

## 1.0.28 (2024-11-21)
+ 修复 `webview` 模块打包后无法正常运行的问题。
+ 优化其他已知问题。

## 1.0.27 (2024-11-18)
+ 修复自定义插件 `kux-autopages` 打包失败的问题。
+ 优化其他已知问题。

## 1.0.26 (2024-11-11)
+ `maven` 远程仓库新增阿里云和华为云的支持，解决某些uts插件打包失败的问题。
+ 优化其他已知问题。

## 1.0.25 (2024-10-10)
+ 修复 `windows` 环境下部分内置依赖模块未合并的问题。
+ 修复其他已知问题。

## 1.0.24 (2024-10-09)
+ 打包模块新增画布模块，包括API：[canvasToTempFilePath](https://doc.dcloud.net.cn/uni-app-x/api/canvas-to-temp-file-path.html)、[createCanvasContextAsync](https://doc.dcloud.net.cn/uni-app-x/api/create-canvas-context-async.html)、[CanvasRenderingContext2D](https://doc.dcloud.net.cn/uni-app-x/api/canvasrenderingcontext2d.html)
+ 修复其他已知问题。

## 1.0.23 (2024-08-13)
+ 修复 `正式发行包` 打包失败的问题。
+ 优化打包失败提示语。

## 1.0.22 (2024-08-13)
+ 修复 `macos 15` 系统因 `gradlew` 没有执行权限导致打包失败的问题。

## 1.0.21 (2024-08-11)
+ 修复 `uts` 模块合并 `assets` 的异常问题。
+ 优化打包逻辑，解决云打包异常的问题。
+ SDK本地依赖匹配调整为通配符策略，避免硬编码版本的问题。
+ 优化打包流程，增强打包体验。
+ 插件配置新增自定义原生工程项目路径的设置，方便开发者们自行本地调试。
+ 修复打包界面超链接指向错误的问题。
+ 优化其他已知问题。

## 1.0.20 (2024-08-09)
+ 优化依赖管理，以此解决 `windows` 无法弹出打包界面的问题。

## 1.0.19 (2024-07-31)
+ 缓存新增 `离线打包SDK下载地址`。
+ 优化打包逻辑，解决多个 `uts` 插件偶尔信息错乱的问题。
+ 优化打包逻辑，支持自动解决 `uts` 插件依赖关系。
+ 优化其他已知问题。

## 1.0.18 (2024-07-10)
+ 修复 `mac` 环境jdk路径转义问题。
+ 优化打包失败提示，新增手动打包的命令。
+ 优化其他已知问题。

## 1.0.17 (2024-07-08)
+ 新增模块配置持久化存储，解决重启后打开插件配置界面导致配置丢失的问题。
+ 插件配置新增 `模块配置是否按照项目单独缓存` 。
+ 优化打包流程，解决部分情况下环境变量设置不生效的问题。
+ 新增 `nativeResources` 资源同步，解决 `uni-push app-android平台高级场景用途` 资源无法同步的问题。
+ 优化其他已知问题。

## 1.0.16 (2024-07-07)
+ 更新内置依赖列表，新增 `uni-rpx2px`、`uni-getProvider`、`uni-theme` 基础模块。

## 1.0.15 (2024-07-06)
+ 修复打包 `正式发行包` 时targetSdkVersion版本检测报错问题。

## 1.0.14 (2024-07-06)
+ 新增打包类型支持 `自定义基座` 和 `正式发行包`。
+ 优化打包流程。
+ 调整可视化界面远程代理，以此优化界面加载时间。
+ 优化其他已知问题。

## 1.0.13 (2024-07-05)
+ 修复非首次打包无法自动关闭对话框的问题。
+ 修复非首次打包项目位置未更新的问题。
+ 修复非首次打包项目配置未初始化的问题。
+ 新增自选证书配置，分为 `证书库文件`、`证书库密码`、`证书别名` 和 `证书密码`。
+ 新增自定义包名配置。
+ 插件全局配置新增 `证书库文件`、`证书库密码`、`证书别名`、 `证书密码` 和 `自定义包名`。
+ 新增自动检测更新机制。
+ 更新默认SDK版本为 `4.23`。
+ 优化其他已知问题。

## 1.0.12 (2024-07-02)
+ 【uni-payment】模块新增支付平台选择。
+ 新增 `同步全局配置`。
+ 修复远程打包时配置未初始化问题。
+ `gradle` 依赖新增国内代理，以解决部分网络环境无法访问谷歌的问题。
+ 优化其他已知问题。

## 1.0.11 (2024-06-29)
+ 修复部分没有 `config` 配置文件的uts插件打包异常问题。

## 1.0.10 (2024-06-27)
+ 调整打包配置界面，全新界面全新交互体验。
+ 修复因内置模块缺失打包异常问题。
+ 新增 `模块配置` ，支持 `可视化配置` 和 `JSON配置` 方式。
+ 右键菜单和帮助菜单新增日志管理，支持查看 `运行日志` 和 `错误日志`。
+ 右键菜单和帮助菜单新增 `查看文档`。
+ 右键菜单和帮助菜单新增 `打开插件市场地址`。
+ 打包流程新增自动同步应用 `图标`。
+ 新增 `自动检测打包环境`。
+ 优化其他已知问题。

## 1.0.9 (2024-06-21)
+ 修复 `mac` 打包异常问题。
+ 修复内置模块打包异常问题。
+ 优化其他已知问题。

## 1.0.8 (2024-06-20)
+ 修复打包成功后 `windows` 因为进程占用导致后续打包无法初始化的问题。
+ 修复 `uniappx` 未自动升级SDK依赖的问题。
+ 优化其他已知问题。

## 1.0.7 (2024-06-20)
+ 修复首次打包失败时后续打包异常的问题。
+ 全局可视化配置新增 `自动验证SDK版本`项，勾选后插件会自动验证SDK版本和编译器版本，如果不一致会提示是否继续打包。
+ 调整本地打包逻辑，去除代码克隆方式，改为内置原生工程方式。
+ 优化其他已知问题。

## 1.0.6 (2024-06-19)
+ 修复自动获取项目位置引起的问题。
+ 新增全局可视化插件配置项。点击 `设置`->`插件配置`即可看到 `kux自定义打包` 配置内容。
+ 优化其他已知问题。

## 1.0.5 (2024-06-19)
+ 修复因 `1.0.4` 升级带来的问题。
+ 调整不合理的打包流程，体验更流畅丝滑。
+ 优化打包流程提示，输出更友好。
+ 优化其他已知问题。

## 1.0.4 (2024-06-18)
+ 支持 `windows` 打包。[windows自动打包失败时请根据指导建议手动打包]
+ 项目位置支持自动获取。[在打开项目中的一个文件时有效]
+ 新增下载SDK前自动检测SDK版本，如果是最新版本不再重复下载SDK。
+ 新增本地打包完成用时。
+ 修复其他已知问题。

## 1.0.3 (2024-06-17)
+ 修复非首次打包时SDK下载失败的问题。
+ 修复打包成功运行自定义基座提示未找到应用资源的问题。
+ 同步官方 `gradle插件配置`。[详情](https://doc.dcloud.net.cn/uni-app-x/native/use/android.html#%E9%85%8D%E7%BD%AEgradle%E6%8F%92%E4%BB%B6)。
+ 更新默认SDK下载地址。[详情](https://doc.dcloud.net.cn/uni-app-x/native/download/android.html)。
+ 删除冗余插件。

## 1.0.2 (2024-06-17)
+ 修复新模块未自动同步 `settings.gradle` 导致打包失败的问题。

## 1.0.1 (2024-06-15)
+ 修复已知问题。

## 1.0.0 (2024-06-15)
+ 初始版本。