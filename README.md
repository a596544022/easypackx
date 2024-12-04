# kux-easy-pack-hxp
一个用来给 `uniapp/x` 打包自定义调试基座的hx插件，为了大幅度简化离线打包流程，让更多开发者们享受到离线打包自定义基座的丝滑体验。

## 插件特色
+ 自动化合并本地打包资源
+ 支持 `Github Actions` 自动打包
+ 支持离线自动打包
+ 自动生成自定义调试基座到项目中
+ 人性化打包错误输出
+ 人性化打包进度输出
+ 支持自动更新SDK
+ 支持自动同步本地模块
+ 支持全局可视化配置
+ 支持可视化模块配置
+ 支持自动检测打包环境
+ ...

> **提示**
>
> 选择云端打包时页面内容要有更新才能提交git，不然会提交失败。<br/>
> `v1.0.5` 及以上版本支持 `windows` 打包。
> 预计 `v1.1.0` 及以上版本支持 `uniapp` 打包。

## 插件运行方式
+ 右键菜单->kux自定义打包
+ 顶部运行菜单->kux自定义打包

## 全局可视化配置
插件提供了全局可视化配置。点击 `设置`-`插件配置` 即可看到 `kux自定义打包` 配置内容。
![kux自定义打包可视化配置](https://env-00jxho15nfxi.normal.cloudstatic.cn/easypack/WechatIMG296.jpg)

+ Android离线打包SDK下载地址：Android离线打包SDK下载地址。[详情](https://doc.dcloud.net.cn/uni-app-x/native/download/android.html)。
+ 原生工程仓库地址：请 `fork` [uniappx-native-android](https://github.com/kviewui/uniappx-native-android) 项目到自己的 github 仓库后填写代码仓库的ssh协议地址。（示例：git@github.com:kviewui/uniappx-native-android.git）
+ 安卓SDK路径：如未安装请到 [https://developer.android.google.cn/studio](https://developer.android.google.cn/studio) 下载。默认会获取全局的 `uts开发扩展-Android` 的安卓sdk路径。
+ JDK路径：如果安装了android studio，则为安装目录的jbr路径，（示例： %安装路径%\\jbr）
+ 自动验证SDK版本：勾选后插件会在进入打包前自动验证SDK版本和编译器版本，如果不一致会终止下面的流程。


## 打包配置说明

<a id="github_store"></a>
### 云端密钥配置
选择 `Github 云端打包` 时，需要先配置参考密钥信息，配置地址：

`https://github.com/{账户名}/uniappx-native-android/settings/secrets/actions`

需要将上面的仓库名替换为自己的，比如仓库名为 `bob`，完整地址即为：`https://github.com/bob/uniappx-native-android/settings/secrets/actions` <br/>
然后在 `Repository secrets` 板块点击 `New repository secret` 创建自己的密钥，名称必须为 `KEYSTORE_PASSWORD`。

### 项目模块配置
项目内置模块可以参考 [modules](https://doc.dcloud.net.cn/uni-app-x/collocation/manifest-modules.html#utsmodules)，在比如 `uni-ad`、`uni-push` 等模块时需要获取这些模块需要的 `appId` 等信息，所以提供了在项目 `manifest.json` 配置方式。具体字段说明参考如下：

#### 应用版本信息
应用版本信息字段全部在 `manifest.json` 跟节点设置。

| 字段名 | 说明
| --- | ---
| name | 应用名称，会自动替换原生工程的 `app_name`，默认为 `uniapp x`
| versionName | 版本名称，默认为 `1.0.0`
| versionCode | 版本号，默认为 `100`

#### 内置模块信息
内置模块信息字段在 `manifest.json` 中 `app -> distribute -> modules` 节点下设置。

| 字段名 | 说明
| --- | ---
| uni-ad | [uni-ad](https://doc.dcloud.net.cn/uni-app-x/collocation/manifest-modules.html#uni-ad) 模块信息，对象形式。
| - gdt | `uni-ad` 模块的 `gdt` 节点，腾讯优量汇广告联盟配置内容。对象形式，如：`"dgt":{}`
| - gm | `uni-ad` 模块的 `gm` 节点，穿山甲配置内容。对象形式，如：`"gm":{}`
| - ks | `uni-ad` 模块的 `ks` 节点，快手配置内容。对象形式，如：`"ks":{}`
| - bd | `uni-ad` 模块的 `bd` 节点，百度配置内容。对象形式，如：`"bd":{}`
| - sigmob | `uni-ad` 模块的 `sigmob` 节点，sigmob配置内容。对象形式，如：`"sigmob":{}`
| - DCLOUDUnionId | `uni-ad` 模块的 `DCLOUDUnionId` 节点，联盟ID值，示例：DCLOUDUnionId: "xxx"。联盟ID位于：[uni-AD后台](https://uniad.dcloud.net.cn/)->首页->联盟ID
| uni-facialRecognitionVerify | `uni-facialRecognitionVerify` 模块信息，对象形式。如：`"uni-facialRecognitionVerify":{}`
| uni-payment | [uni-payment](https://doc.dcloud.net.cn/uni-app-x/collocation/manifest-modules.html#uni-payment) 模块信息，对象形式。
| - alipay | [uni-payment](https://doc.dcloud.net.cn/uni-app-x/collocation/manifest-modules.html#uni-payment) 模块的 `alipay` 节点。对象形式，如：`"alipay":{}`
| - wxpay | [uni-payment](https://doc.dcloud.net.cn/uni-app-x/collocation/manifest-modules.html#uni-payment) 模块的 `wxpay` 节点。对象形式，如：`"wxpay":{}`
| uni-push | `uni-push` 模块信息，对象形式。
| - GETUI_APPID | `uni-push` 模块的 `GETUI_APPID` 节点，示例：`"GETUI_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - PUSH_APPID | `uni-push` 模块的 `PUSH_APPID` 节点，为示例：`"PUSH_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - dcloud_unipush_auto_notification | `uni-push` 模块的 `dcloud_unipush_auto_notification` 节点，示例：`"dcloud_unipush_auto_notification":true`。透传时是否自动创建通知，布尔类型。
| - MIPUSH_APPID | `uni-push` 模块的 `MIPUSH_APPID` 节点，示例：`"MIPUSH_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - MIPUSH_APPKEY | `uni-push` 模块的 `MIPUSH_APPKEY` 节点，示例：`"MIPUSH_APPKEY":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - MEIZUPUSH_APPID | `uni-push` 模块的 `MEIZUPUSH_APPID` 节点，示例：`"MEIZUPUSH_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - MEIZUPUSH_APPKEY | `uni-push` 模块的 `MEIZUPUSH_APPKEY` 节点，示例：`"MEIZUPUSH_APPKEY":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - OPPOPUSH_APPKEY | `uni-push` 模块的 `OPPOPUSH_APPKEY` 节点，示例：`"OPPOPUSH_APPKEY":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - OPPOPUSH_APPSECRET | `uni-push` 模块的 `OPPOPUSH_APPSECRET` 节点，示例：`"OPPOPUSH_APPSECRET":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - HUAWEI_APPID | `uni-push` 模块的 `HUAWEI_APPID` 节点，示例：`"HUAWEI_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - VIVO_APPID | `uni-push` 模块的 `VIVO_APPID` 节点，示例：`"VIVO_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - VIVO_APIKEY | `uni-push` 模块的 `VIVO_APIKEY` 节点，示例：`"VIVO_APIKEY":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| - HIHONOR_APPID | `uni-push` 模块的 `HIHONOR_APPID` 节点，示例：`"HIHONOR_APPID":"xxx"`。参考：[uni-push2.0配置](https://uniapp.dcloud.net.cn/unipush-v2.html#%E7%AC%AC%E4%BA%8C%E6%AD%A5-%E9%85%8D%E7%BD%AE)
| uni-video | `uni-video` 模块信息，对象形式。如：`"uni-video":{}`
| uni-verify | `uni-verify` 模块信息，对象形式。如：`"uni-verify":{}`
| - GETUI_APPID | `uni-verify` 的 `GETUI_APPID` 节点，示例：`"GETUI_APPID":"xxx"`。`GETUI_APPID`与`GY_APP_ID`在[开发者中心](https://dev.dcloud.net.cn/)->一键登录->基础配置->一键登录应用ID，GETUI_APPID与GY_APP_ID取值相同。
| - GY_APP_ID | `uni-verify` 的 `GY_APP_ID` 节点，示例：`"GY_APP_ID":"xxx"`。`GETUI_APPID`与`GY_APP_ID`在[开发者中心](https://dev.dcloud.net.cn/)->一键登录->基础配置->一键登录应用ID，GETUI_APPID与GY_APP_ID取值相同。

+ 以上配置内容已被插件视图化操作替代。

## 已知问题
+ 重复打包时无法自动关闭对话框，需要手动点击 `取消`。(`v1.0.13`及以上版本已修复)