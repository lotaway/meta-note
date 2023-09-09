@[TOC](docker学习笔记-基础介绍)

# 概念

docker是一个可以帮助开发者规范简化发布和部署项目工作的软件，其核心是一个只有内核的操作系统，可以将它当作速度超快的虚拟机。
用户通过在项目内定义好配置文件，之后docker会执行该配置文件将项目打包成镜像，服务器上只需要同样安装docker后运行该镜像即可。
整个发布/测试环境可以更好地与开发环境保持一致，并与其他服务器部分隔离开。
docker本身也包含公开的云仓库，可以像使用github一样将自己的项目镜像发布到网上供人下载部署，也可以当作一种镜像版本管理工具使用。

# 下载安装

可以在[官网下载页](https://docs.docker.com/get-docker/)进行下载。

# docker-compose

这是一个可以方便将项目模块和所需第三方工具一次性打包发布成多个镜像的，例如你的项目由源代码前后端、数据库组成，docker本身只支持要不全部打包成一个镜像，要不就只能单独一个个手动执行发布，而docker-compose支持使用配置文件链接多个dockerfile一次性发布并保持多个镜像之间的内置关联。
[官方下载链接](https://docs.docker.com/compose/install/standalone/)

## Image 镜像

Image即镜像，是用于运行的包文件，根据需要可能是一个系统、一个数据库或者一个网站程序等，如Ubuntu。
通常来源于别人打包好放在云端仓库，通过docker下载后配置必需的参数后即可运行。

查找线上镜像，如ubuntu，若要查找特定版本如20.04只需要改成ubuntu:20.04。

```bash
docker search ubuntu
```

下载镜像，若想要下载最新的则改成ubuntu:latest

```bash
docker pull ubuntu:14.04
```

查看本地镜像，可看到镜像名称、id等信息

```bash
docker images
``` 

* <code>docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]</code>
  提交对镜像的更改，用于配置自己的个性化镜像（注意镜像名称不支持大写字母）。如 <code>docker commit -t devcontainerforlw
  imageforfrontbylw:lastest</code> 。
* <code>docker export > develop.tar</code> 当前Container导出Image。执行完后，在你的个人目录下（Mac 上是
  /Users/你的用户名）可以找到`develop.tar`文件。

## Container 容器

Container容器，镜像运行后的实例状态，一般一个镜像对应一个容器，隔绝了本地环境和开发环境。
这也是使用docker后日常运行时最频繁接触的东西。

运行镜像使之生成实例容器，部分镜像如MySQL数据库一般需要配置，此时需要参考官方说明在运行时传递运行环境参数

```bash
docker run [container] -p 8000:8000
```

参数介绍：

* `--name` 自定义容器名称
* `-d` 后台运行
* `-it` 分配伪终端进入交互模式，即会自动进入容器内的命令行
* `-p` 本地端口:容器端口 本地端口映射到容器端口，其他软件需要通过端口访问容器时则需要主动添加该参数
* `-v` 本地文件夹:容器内部路径 挂载本地文件夹到容器内部路径
* `-net` 指定容器的网络连接类型，支持 bridge/host/none/container四种类型，如–net=“bridge”，常见于分布式微服务等大型应用多个容器一起使用且互相之间需要进行连接访问的情况，如前端界面一个容器，后端程序一个容器，关系数据库一个容器，缓存数据库一个容器，消息队列一个容器。

在已存在的容器中执行命令

```bash
docker exec [container] -it /bin/bash
```

例如开启了mysql的容器，要进入mysql，需要先执行以上命令进入容器（相当于一个只有内核的系统），成功后再继续输入进入数据库的命令。

以下进入mysql数据库服务，-u后面是用户名root，-p表示需要输入密码，之后按照password提示输入正确后即可进入：

```bash
mysql -uroot -p
```

因此无论启动何种服务，除了少数可以直接通过ip地址+端口号进入的以外，其他就是先进入容器再输入命令进入相应的服务。

查看当前正在运行的容器：

```bash
# 方式1
docker ps
# 方式2
docker container ls
```

查看所有容器（包含已经停止运行的）只需要加上参数-a

```bash
# 方式1
docker ps -a
# 方式2
docker container -a
```

其他操作
```bash
# 停止一个正在运行的容器
docker stop [container]
# 启动一个在停止状态的容器
docker start [container]
# 删除一个在停止状态的容器
docker rm [container]
# 删除一个没有容器的镜像
docker rmi [image]
```

## Volume 数据卷

数据卷，即可指定读取存储外部数据的路径，如项目所在文件夹。

启动Image时可以通过 `-v 本地目录:容器目录`映射本地路径到容器。
一个容器可以挂载多个Volume，Volume中的数据独立于Image，方便用于放置额外生成的日志、临时资源和各种因为运行使用生成与上传的内容、数据库文件等。

# 配置自己的镜像

1. 下载并安装Docker；
2. 注册一个Docker Hub账号并登陆，下载并运行镜像，如ubuntu系统；
3. 通过命令行做常规的系统初始化工作（换源、安装常用工具）
4. 通过命令行安装开发环境，如前端npm=》nodejs=》webpakc=》vue-cli等（开发工具仍安装在本地环境中），之后记得提交镜像方可保存。
5. 导出镜像 docker export

# 使用自己的镜像

1. 准备好Docker安装包和镜像；
2. 安装Docker后打开Docker Desktop，注册账号并登陆；
3. 打开Docker命令行；
4. 导入镜像：输入命令docker import，从文件夹中直接把 ubuntu 文件拖拽到命令行中（注意文件路径中不能有中文，如果有，先把文件移动到另一个纯英文路径的文件夹中）；
5. 挂载本地文件夹和映射访问地址并运行镜像：输入命令docker images，复制出镜像的 IMAGE ID（如54184b993d46）。
6. 输入命令：docker run -t -d -p 8080:8080/tcp --name dev -v /local/path/to/workplace:/container/path/to/workplace
   IMAGEID
   （IMAGEID为上一步复制的）

记录配置命令和映射等内容方便日后重做和查看：使用dockerfile
打开终端，进入我们指定的文件目录，新建Dockerfile文件，把做过的指令写下来前面加个RUN
（apt-get install后面需要多加-y，可在之后需要交互的地方默认Yes，否则之后的建立镜像时，linux apt-get会因为得不到用户响应而自动退出。
之后即可以通过运行dockerfile文件直接建立镜像

### 常用命令

查看当前正在运行中的container容器

### 总结：

docker运行镜像生成container，在其中安装开发环境并保存，本地装开发工具和放置项目，通过挂载项目到images中运行，通过映射端口在浏览器中访问container中运行的项目。