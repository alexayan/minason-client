> Minason client

## Intro

Minason 基于微信小程序微信小程序提供的 [局域网通信](https://developers.weixin.qq.com/miniprogram/dev/api/wx.startLocalServiceDiscovery.html) 能力，用于构建线下场景的小程序微服务。

开发者可以基于 [Minason server](https://github.com/alexayan/minason-server) 编写服务器端代码，在服务器端生成自定义的小程序 UI，调用小程序的 Api，搭配 minason-client 小程序客户端，自由的创建和发布小程序服务。

用户在 minason-client 小程序客户端中，可以使用当前局域网内部可发现的小程序微服务。

Minason client 当前是一个快速开发完成的玩具项目，只是验证了可行性，不能用于生产环境。

Have Fun :)

## Usage

``` bash
# 安装 npm 依赖
npm i
# 小程序开发模式
npm run dev
# 小程序构建
npm run build
```

使用微信小程序开发工具，选择 `dist` 目录进行预览

## Reference

[Minason server](https://github.com/alexayan/minason-server)

## License

MIT © [alexayan](https://github.com/alexayan)