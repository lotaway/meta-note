@[TOC](AsmBB介绍——一个轻量级的论坛网站程序成品)

# 关于AsmBB

[AsmBB](https://asmbb.org/)是一个轻量级别的论坛网站程序成品，通过下载后在电脑里启用程序即可拥有自己的论坛网站。
网站前端采用tpl文件内嵌内容输出和html代码片段，后端是基于Assembly汇编编写，数据库采用内置的SQLite，其基于Fossil进行源代码发布管理。
通过修改Html、Css、Js即可达成大部分修改前端界面的目的，但由于是片段输出的虚拟页面，如果涉及到路由或者页面结构的复杂修改，或者分页这类程序关联度较强的代码，则需要通过汇编修改。

# 关于Fossil

[Fossil](https://fossil-scm.org/)是一个小型、高可靠性的发布用软件，用于托管你的项目服务，类似于git版本管理，其使用了C语言作为程序开发语言。
本文中述说的是AsmBB，因此后续不再讲述Fossil，有需要的可以到官网查看。

# 下载AsmBB

## 通过Fossil进行下载

可参考[官网下载链接](https://asm32.info/fossil/asmbb/index)进行下载。

推荐操作系统是Linux，如果是Window那建议使用WSL进行安装使用。
首先是先行下载Fossil，可直接通过[Fossil官方下载页](https://fossil-scm.org/home/uv/download.html)进行下载，或者在命令行输入：

```bash
wget -d https://fossil-scm.org/home/uv/fossil-linux-x64-2.22.tar.gz
```

之后执行解压缩：

```bash
tar -xvzf fossil-linux-x64-2.22.tar.gz
```

接着是使用Fossil来拉取asmbb项目（注意./Fossil/fossil是刚解压的出来的文件夹Fossil所在路径下的fossil文件）：

```bash
# 创建文件夹repositories
mkdir repositories
# 使用Fossil克隆asmbb的fossil打包文件
./Fossil/fossil clone https://asm32.info/fossil/repo/asmbb  ./repositories/asmbb.fossil
```

创建和解压项目文件：

```bash
# 创建文件夹asmbb
mkdir asmbb
# 解压项目文件
./Fossil/fossil open /repositories/asmbb.fossil
```

## 通过github公共仓库下载

命令行直接克隆整个项目：

```bash
git clone https://github.com/johnfound/asmbb.git 
```

这样就可以进行自己的修改了！
如果想要保持与官方版本一起更新，但又需要进行自定义修改，建议是先进行fork后进行修改，这样能从上游拉取官方版本的新提交，也能修改自己的版本，步骤参考：

1. 在官方项目仓库右上角点击fork，根据提示创建成自己的项目，这个项目将会保持对上游也就是官方仓库提交内容的跟踪；
2. 命令行克隆自己整个项目源码，命令前面已提供过，更换成自己的仓库地址即可；
3. 在自己本地项目里打开命令行，使用git相关命令设置和获取上游仓库的更新（参考下方）；
4. 之后可以进行自己的修改，按照往常一样上传到自己的远程仓库即可。

使用git命令设置和获取上游仓库的更新，具体因版本更新可能有所不同，若有错误参考网上git最新版本命令：

```bash
# 添加官方仓库作为自己本地项目的上游仓库
git remote set-url upsteam https://github.com/johnfound/asmbb.git
# 获取上游仓库的更新
git fetch upstream
# 获取自己远程仓库的更新
git checkout master
# 如果有更新，需要进行合并
git merge upstream/master
```

以上就完成了asmbb项目源代码的获取工作。

# 配置开发环境

接下来是开发和编译所需工作：
下载[Fresh编译器](https://fresh.flatassembler.net/index.cgi?page=content/2_download.txt)
用于编译汇编代码，注意下载安装后，打开Fresh开发工具，在菜单栏options/IDE
options里的Aliases一栏，修改/添加Name为TargetOS的值为Linux或Win32（根据最终部署网站的操作系统而定），配置name为lib的值为freshlib所在的FreshLibDev路径。

之后使用Fresh打开项目源代码目录下/source/engine.fpr，类似于开发工具的配置文件，这将会打开整个项目，之后可以进行汇编代码的修改和编译（Ctrl+F9）生成engine文件。

## 编译C

注意这一步在后续发布项目中会自动被执行，如无修改和替换的需要可忽略。
asmbb项目里有一部分是使用C语言编写的，还有一部分是Sqlite的支持库（会自动通过脚本下载源代码），也是C语言编写，可执行musl_sqlite目录下的build脚本文件进行生成libsqlite3.so和ld-musl-i386.so文件，用于最终的网站所依赖的文件。

## 前端界面

注意这一步在后续发布项目中会自动被执行，如无修改和替换的需要可忽略。
asmbb项目中有一部分是前端界面，位于www/templates目录下，采用类似php的tpl模板文件语法，样式文件则是less格式。
可执行www/templates下的build_styles.sh进行样式表编译工作。

注意项目会使用的clessc命令（在www/templates/**
/compile_styles.sh文件里）进行less文件的预编译工作，但我不了解这个命令是如何才能获取来使用的，不清楚的人可以先执行位于install目录下的create_release.sh脚本文件，如果报错找不到clessc，要不自己尝试找到clessc，要不通过我下面这种笨方法：

1. 下载安装了[nodejs](https://nodejs.org/)后，使用其自带的命令`npm install less -g`全局按照less文件编译器。
2. 将所有www/templates/**/*.less文件中的直接写入的文件路径改成less import的语法引用。
3. 将所有www/templates/**/compile_styles.sh中的语句`clessc "$file" -O "${file%.*}.css"`
   改成`lessc "$file" "${file%.*}.css"`。
4. 重新执行create_release.sh即可成功将less文件编译成css并执行后续的打包发布工作。

# 发布项目

执行位于install目录下的create_release.sh脚本文件，该脚本即可将项目发布成为asmbb.tar.gz压缩包文件。
之后可以执行install目录下的unpack.sh脚本文件进行解压使用，解压后发布的项目位于install/asmbb文件夹下。

# 部署项目

这里总共分为两步，第一步是配置Nginx/Apache来指定网站服务，第二步是配置fastcgi来启动前面生成的engine文件。
可参考[官方文章](https://board.asm32.info/how-to-install-asmbb-on-vps-with-nginx-and-systemd.163)
也可通过[docker部署](https://board.asm32.info/docker-support.256/#15717)

首先是第一步，这里采用Nginx为例，先下载并安装[Nginx服务](https://www.nginx-cn.net)，之后打开Nginx的站点配置文件：

```bash
vim /etc/nginx/sites-enabled/default
```

假设前面发布好的项目位于`/var/www/asmbb/install/asmbb`下，到最后一行输入i进入编辑模式，并添加以下内容：

```bash
server {
      listen 8082;
      listen [::]:8082;
      server_name localhost;
      root /var/www/asmbb/install/asmbb/;
      location / {
        fastcgi_pass unix:/var/www/asmbb/install/asmbb/engine.sock;
        include fastcgi_params;
      }
}
```

使用`:wq`回车保存并退出，这将在本地端口8082将asmbb项目启动为网站服务。
之后执行以下命令重启Nginx服务，使配置修改生效：

```bash
systemctl restart nginx.service
```

接着是第二步，配置fastcgi，使用命令创建并打开服务文件：

```bash
vim /etc/systemd/system/asmbb.service
```

假设前面发布好的项目位于`/var/www/asmbb/install/asmbb`下，在文件中输入i进入编辑模式，并添加以下内容：

```bash
[Unit]
Description=AsmBB forum engine FastCGI script.
After=nginx.service

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/asmbb/install/asmbb
ExecStart=/var/www/asmbb/install/asmbb/engine
Restart=on-failure

[Install]
WantedBy=nginx.service
```

其中`User=root`指代的是要用哪个Linux用户作为启动服务的用户，这里使用了root是为了简便，生产环境中最好另外创建一个权限受限的Linux用户来启动服务。

完成后执行`:wq`回车保存退出。

之后执行以下命令启动和查看服务：

```bash
# 启动服务
systemctl start /etc/systemd/system/asmbb.service
# 查看服务运行情况
systemctl status /etc/systemd/system/asmbb.service
```

若任务成功启动，则此时应该能在浏览器中输入`localhost:8082`访问到配置好的asmbb网站，若是第一次启动会自动生成border.sqlite数据库文件，并在页面中要求进行管理员邮箱和密码的配置，按要求填写后即可正常访问网站，到此大功告成。

# 可能遇到的问题

1. 若在浏览器中访问网站出现502等异常，应当是fastcgi服务没有配置好导致无法成功启动。
2. 若是Fresh工具编译汇编时报错，需要弄清楚是不是配置的lib路径和TargetOS错误导致的。
3. 若是使用install/create_release.sh或者musl_sqlite/build脚本文件编译报错，需要看具体情况而定，可以通过官方论坛发问。
4. 用户对engine文件没有执行权限可能会导致使用systemctl启动service命令会提示错误，需要使用`chmod 777 engine`莱赋予文件权限，并可以通过`./engine`直接运行方算成功。