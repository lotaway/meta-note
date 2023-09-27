@[TOC](Open Interpreter，一个让ChatGPT入驻你的电脑并获得联网能力成为贾维斯！)

# 介绍

最近看了[Github最近大火的程序员终端大升级](https://www.bilibili.com/video/BV1qN411p7cY)，发现了open interpreter这个可以部署到本地命令行的对话AI，其依赖ChatGPT，可以使用联网功能和本地模型，很好地拓展了原有的功能并且能结合物理设备软硬件特性，于是我赶紧搜索一番开始安装。

安装之前需要满足以下条件：
* 一个处于正常使用中的ChatGPT账号，除非你不打算用ChatGPT线上模型而是用如Code-Llama的本地模型。
* 该软件安装到Mac或者Linux系统，虽然我是Window，但幸亏Window提供了[WSL](https://blog.csdn.net/zhangzl4321/article/details/124351538)，可以几乎完美地模拟Linux系统环境。
* 由于需要下载大量依赖包，过程中可能需要借用魔法才能成功，即使如此也很容易出现`TimeoutError: The read operation timed out`，这时只需要重新安装即可。

# 安装

我是参考文章[](https://www.thepaper.cn/newsDetail_forward_24551940)进行的。

安装很简单，只需要开启命令行执行以下命令：

```bash
pip install open-interpreter
```

注意这里的pip是一个python用包安装器，如果之前没安装过则先执行以下命令安装：

```bash
sudo apt install pip -y
```

安装过程大概是5分钟，视网络情况而定。

我在安装完成后还出现了提示脚本安装好但没有写入PATH里：

```bash
  WARNING: The script interpreter is installed in '/home/lotaway/.local/bin' which is not on PATH.
  Consider adding this directory to PATH or, if you prefer to suppress this warning, use --no-warn-script-location.
```

看来是使用的用户不是管理员root，所以导致了安装也是在本地环境里，所以安装前最好确保使用的是root账号，避免不必要的麻烦，当然如果非要使用独立的账号，也可以按照以上提示暴露脚本路径：

```bash
export PATH="$PATH:/home/lotaway/.local/bin"
```

# 使用

执行以下命令：

```bash
interpreter
```

等待30秒后看到提示`Welcome to Open Interpreter.`表示成功开启对话框。
首次进入会要求填写openAI API key，访问并登录[openai API keys](https://platform.openai.com/account/api-keys)，生成一个密钥即可，生成的密钥看起来可能是这样的：

```bash
hg-IG49uBEgpUauI7epsGilT3BlbkFJaArPA8SSRovV0urqmmbP
```

注意以上密钥并不是真实可用的，你需要使用GPT账号生成你自己的密钥！

完成初次设置后可正常使用（依旧需要魔法！），此时命令行会变成`>`符号，输入问题并点击回车则会进行询问和答复......然后我发了个hello等了几分钟都没有回复，我猜测是使用的魔法并没有作用到wsl所进行的网络访问上。
于是先按照[解决WSL下使用Clash for Windows的记录](https://zhuanlan.zhihu.com/p/451198301)完成了一遍Clash用于wsl的设置，大概意思就是需要打开魔法软件的局域网魔法功能，并在wsl中设置http和https的魔法地址为魔法服务的本地地址。

然后我这样做之后虽然wsl可以访问谷歌地址，但interpreter依旧没有反应。估计可能是进入interpreter环境时还有什么因素导致失败了，于是我换成了本地模型Code-Llama，结果也是在执行Parameter count选择模型大小后就没响应了。

只能等之后再看看是什么问题。