@[TOC](年度指南-Web网页开发学习总纲-2024修订版)
来源：[YTB视频](https://www.youtube.com/watch?v=EqzUcMzfV1w)有修改

# 为什么学习写代码？

可以有非常多的理由学习写代码。找出你自己为什么想要这项技能的原因。
通常理由是想要能很好地活下去、或者有激情或者想要有很好的收入来拥抱爱情。

## Web网页开发的用途

1、被雇佣成为一名公司的开发岗位的员工；
2、作为自由职业者或运营自己的事业中使用；
3、建造自己的产品或者[SAAS服务](https://baike.baidu.com/item/SaaS)（即将软件本身作为一种服务）。
4、制作相关教育课程内容；
5、只作为一项兴趣发展。

# Web网页开发者类型

## Front-End Engineer 前端开发者


前端开发工程师的工作内容是为客户端或浏览器端打造用户界面。通用会使用到的语言/语法包括作为基础的HTML、CSS、JS和React、Vue等前端框架和Threejs库等。

## Back-End Engineer 后端开发者

后端开发工程师工作内容是在服务端上处理数据相关事务。会使用以下其中一种开发语言：Java，Go，C#，Nodejs、
少量会使用Python，PHP，Ruby等，
数据部分会使用以下其中一种：Oracle，MySQL，Postgres，Micronet Server SQL，MongoDB，
并会包含使用如Redis、RocketMQ等，需要了解HTTP服务器配置部署等devOpts技能。

## Full-Stack Engineer 全栈开发者

全栈开发工程师包含前端开发者和后端开发者的工作，完成所有所需工具、技能、语言的组合。
一般由于前后端各自的工作内容就非常多，
所以就算作为全栈可能也会有所偏向，
如偏重前端的全栈，或者偏重后端的全栈。

# 可能需要用到的工具

1、电脑和对应的操作系统，开发机推荐MacOS，或者Windows，而服务器一般会选用Linux，或者用[WSL](https://baike.baidu.com/item/wsl/20359185?fr=aladdin)
作为代替；
2、网页浏览器，推荐用谷歌浏览器或Edge，其次是火狐、Brave（加密货币用得多），360、QQ、Safari之类只需要做做兼容，最好不要作为主要目标浏览器；
3、文本编辑器或者集成开发工具，前端一般是VS Code、Webstorm、Sublime等，后端根据所选语言可以是Visual Studio、Idea、VS Code、Vim等；
4、命令行，使用操作系统默认的，或者iTErm2、Powershell、Git Bash、Hyper等；
5、设计软件，前端开发会接触比较多，如Figma、Adobe XD、Sketch、Axure等。
6、数据库界面工具，后端开发会接触比较多，一般是数据库自带的，或者开发工具集成插件，或者Navicat等集成各类数据库的工具。

# HTML & CSS

HTML & CSS是网页前端开发打造用户界面的基础模块，你需要掌握：
1、HTML5基础和语义化标签、页面结构；
2、CSS盒子模型、排列、单位、百分比、媒体查询、容器、布局、响应式设计；
3、动画和变形、SVG、Canvas等。

# CSS预处理器

Sass/Scss/Less是CSS的预处理器，可能添加很多功能到基础CSS里，例如可以提供变量、依赖链、混合器、函数等。
PostCSS是一个CSS转换工具，可以帮助抹平不同浏览器中的CSS属性差异，一般是作为插件配合Sass一起使用即可。

# CSS框架

CSS框架一般也叫UI框架，可以提供给你的元素提供样式类或者直接提供元素组件。常见的有：
1、Bootstrap 5，非常流行的高度集成框架，包含大量已经完成的组件和可选项；
2、Tailwind CSS，简化的工具式框架，只有基础的样式，可灵活使用；
3、Materialize，基于扁平化设计的框架；
4、Bulma，移动端优先的模型化框架；
5、Foundation，高级CSS框架。

# UI设计规范

前端开发和网页设计师需要知道基础设计规范，包含：
1、颜色和对比，注意文字可读性；
2、留白，注意不同元素之间需要留出空间；
3、尺寸，相近元素应该注意彼此的大小是否合适；
4、视觉层次，突出非常重要和优先级高的；
5、字体排版，字体、大小等。

# Javascript

Javascript是浏览器里的开发语言，所有网页开发者都需要达到一定的JS知识登记。
1、JS基础，如数据类型、数据结构、函数、判断、循环，数组方法，如map、filter、reduce等，数据转换，如toFixed、toString、Math.floor等；
2、DOM、BOM，主要是宿主（一般指代浏览器）通过操作系统提供的功能，如Document对象模型、时间日期、窗口屏幕和设备参数等；
3、异步编程，如Promise、Async/Await、Worker、addListener，请求和响应，如HTTP原理、Fetch接口请求、Socket；
4、本地存储，使用Map、Object、Set、Array存储在内存、Redux/Vuex全局数据源、LocalStorage/SessionStorage本地存储、IndexDB本地数据库、Caches；

# 额外的编程工具

1、Git，最受欢迎的版本控制协议工具，一般配合远程仓库如GitHub、GitLab、BitBucket等，国内用得比较多的是Gitee；
2、npm/yarn/pnpm等包管理工具，可以用来安装各种第三方包，但需要先安装Nodejs；
3、对所有类型的网页开发者来说，浏览器开发工具或语句都非常重要，需要知道元素选择器、输出、本地存储、网页活动等；
4、插件，如Emmet优化文本编辑、Live Server快速启动静态页、Prettier代码格式化、ESlint代码检查、GitHub Copilot自动生成代码块等。

# 部署网站

受欢迎的平台：
1、cloudflare
2、netlify
3、AmazonS3
4、Vercel
5、cPanel

域名注册一般需要10到15美元（约90元一年）：
1、namecheap
2、domani.com
3、bluehost
4、GoDaddy

部署方式：
Git、SSH、FTP/SFTP、Docker

# 前端开发涉及内容

1、通过HTML和CSS创建网页布局；
2、了解基础的设计规范；
3、了解Javascript并应用到DOM上；
4、创建基础交互式前端应用；
5、通过Fetch请求API接口；
6、使用Git版本控制；
7、部署和管理小型产品项目。

# 后续学习

## 网页设计

* 视觉：渐变、视差、滤镜、过渡；
* 工程：模块化打包、自动测试、离线；
* 质量：架构、设计模式、中间件。

## 网页前端框架（推荐学习）

1、React，Vue，Svelte；
2、State状态管理，如Redux、Mobi、Vuex；
3、SSR服务端渲染如Nextjs、Nuxtjs。

## 后端

1、Java、Nodejs、Python、PHP、C#、Go；
2、数据处理-Postgres、MongoDB、索引优化、锁、事务等；
3、HTTP和API开发、TCP/UDP/RPC/Socket等高效通讯；
4、Redis缓存、RocketMQ/RabbitMQ异步消息、数据一致性、预防击穿、雪崩等；
5、高并发、微服务、分布式、集群、熔断、降级、令牌桶、漏斗等特性学习。

# 前端框架

前端框架一般是用于建造[单页应用](https://baike.baidu.com/item/SPA/17536313)
，将页面拆分为一个个组件去制作，甚至组件也可以通过[Storybook](https://storybook.js.org/)进行单独开发和维护，可选择一个学习：
1、React，由Facebook创造和持续维护，算是国外最受欢迎的前端框架，学习曲线适中；
2、Vue，由中国单人开发者创造，国内企业比较常用，非常棒的社区支持，非常容易学习；
3、Angular，由谷歌创造并持续维护，在大企业中比较可能见到，学习曲线比较陡峭。
4、Svelte，正在崛起中，轻量化和可观性能的编译器，低学习曲线。

# Typescript

Javascript的超集，添加了静态类型支持和最新的JS特性，包含：
1、静态类型检查和自动推断，在开发阶段就减少可能性的代码错误；
2、支持类、命名空间和其他ES6+特性，如装饰器、反射、元数据操作等；
3、提升可阅读性，增强代码鲁棒性和可靠性。

# 适用于前端框架的UI框架

专门适用于前端框架，因为一般的UI框架并不会考虑组件化的设计和样式隔离，也不会根据不同的前端框架组合形式去重新设计对应的使用方式，因此就有了这些专门适用于前端框架的UI框架。

## 适用于React

* Material UI
* Chakra UI
* Onsen UI
* React Boostrap
* Ant Design（中国更流行）

## 适用于Vue

* Vuetify
* Buefy
* Vue Material
* Bootstrap Vue
* ElementUI（中国更流行）

## 适用于Angular

1、Angular Material
2、Ng-Zorro
3、Ng-Bootstrap
4、MD Bootstrap

## 适用于Svelte

* Svelte Material UI
* Materialify
* Smelte
* Sveltestrap

# 测试

1、单元测试，测试最小区域的代码，如测试函数、模块、类；
2、集成式测试，将模块组合在一起后进行测试；
3、E2E测试，模拟用户测试。
常用的JS测试工具有Jest，Cypress和Puppeteer，也有断言式测试的Mocha+Chai，前端框架也有或官方或第三方提供的组件测试框架，其他开发语言也有自己的测试工具。

# 前端框架的服务端渲染SSR

服务端渲染（Server-Side-Render），是由于前端全面使用React、Vue等前端框架配合接口获取内容，页面都是通过前端JS渲染出来，相当于要两次以上请求才能完成页面渲染，在请求没完成时会出现白屏、内容残缺或者直接显示代码的情况，而传统后端渲染的网页只需要一次请求即可，对SEO也是一个打击，所以就有了适用于前端的服务器渲染，如：
1、Nextjs，适用于React，支持数据提前获取再渲染，图片优化、SEO等；
2、Nuxtjs，适用于Vue，支持数据提前获取再渲染，自动转换和构建；
3、Remix，适用于React，支持数据提前获取的Loader和Action触发器，可拥有最大限度的请求和响应控制权；
4、SvelteKit，适用于Svelte，高级路由，有代码拆分等特性。
*、Nestjs，Angular公司制作的Nodejs后端开发框架，没有限定适用的前端框架语言，可以接入其他任意一种渲染框架，但强大的装饰器写法推荐学习。

# 生成静态网站的框架

1、Gatsby，适用于React，支持[GraphQL](https://www.jianshu.com/p/da1260b95faf)，数据层；
2、Nextjs，适用于React，可以快速导出静态网站，支持数据提前获取；
3、Gridsome，适用于Vue，支持PWA渐进式网页和SEO；
4、Jekyll，基于Ruby构造，已推出一段时间，轻量化模板引擎。

# CMS 无头内容管理系统

Headless CMS，内容管理框架，一般用于前后端之间管理和发布内容，如音视频、接口文档、表格、文件等，后端将想要展示的内容发布到管理系统里，前端需要展示时就从管理系统里获取内容，如：
1、[Strapi](https://docs.strapi.io)，开源，基于Nodejs构造，可自定义，自带域名；
2、[Sanity](https://www.sanity.io)，强大而灵活的平台，合作很棒，有工具套件；
3、[ContentFul](https://www.contentful.com)，团队使用很棒，优化了速度，适用于庞大的商业世界；
4、[Hygraph](https://hygraph.com)，原名GraphCMS，通过GraphQL接口建造，轻量化和直观，可扩展UI。
*、[更多CMS系统介绍](https://zhuanlan.zhihu.com/p/433173175)

# 页面静态化

前端SSR通过像[Jamstack](https://jamstack.org/)生成静态网站，并托管到CDN，结合Headless CMS大幅提升性能。

## 关于Jamstack

全称为Javascript Api Markup Stack，即运用脚本渲染、接口内容、模板生成器组成的框架，其首要完成的目标或者说特性就是将脚本渲染的页面包含内容变输出成为静态页面，无需服务器完成方法调用、高性能、强安全性和低成本。

# 前端开发者能力总结

前端开发者应当能做到：

* 通过前端框架构建用户界面；
* 理解如何使用本地存储和全局状态；
* 理解和使用REST Api/GraphGL配合HTTP、TCP等。
  额外技能：
* 通过Typescript创建应用；
* 使用服务端和静态渲染技术——SSR、Jamstack（SSG+Headless CMS）；
* 编写自动化测试。

# 服务端/后端开发语言

* Node.js，事件驱动，适合高强度IO请求，不适合CPU重度计算用途的应用。作为前端能很轻松上手，适合大前端或前端转全栈的岗位。
* Java，最常见的大型后端程序开发语言，一般和SpringBoot一起出现，拥有众多支持库和无数的历史坑，中国比较常见使用。
* Kotlin，非常新，主要是作为Android开发中代替Java的存在，也可以用于网站开发但非常少见。
* GoLang，简称go，比较新的开发语言，Google制作用于取代Java，剔除历史包袱，适用于高并发应用，小而美的存在，建议是Java和Go里选择一个选择甚至两个都学。
* Python，常见于大数据、机械学习、人工智能等领域相关，作为网站和桌面开发、脚本开发都比较常见。
* PHP，比较常见于个人或者小型企业网站，但因为国外顶尖建站平台的Wordexpress和Shopify都使用PHP，并附带可自定义开发，而国内也有【】企业需求全栈的PHP人员，所以作为起步也是不错的选择。
* C#（ASP.NET），比较常见于中国国内网站和国外桌面软件，基础起步也不错，但在国内不如Java受欢迎。
* Rust，比较新，号称最安全的语言，内存管理好，用于替代C++，国外比较多，中国国内非常小众，开发桌面软件比较多，但也有用于网站开发微服务应用。
* Ruby，国内非常少见，国外比较多。
* Scala，少见，主要是数据引擎、接口服务、微服务等。
* Swift，主要是作为iOS开发中代替Object-C的存在，但也可以用于网站开发但非常少见。
* RLang，少见，用于统计计算、数据分析、科学调查等比较强，还可以使用markdown语法开发。

# 服务端/后端网站框架

## Nodejs

一般是Express、Koa、Fastify中选一个，常见是Express，而Koa比较轻巧，一般伴随egg或midway作为全套框架出现。
而Fastify比较少见，但如它名称在各方面比较快速。
也可以使用Nestjs，伴随Typescript一起使用众多装饰器语法，用过Angular2会比较熟悉这种方式。
或者直接使用SSR专用框架的Nextjs（对应React）和Nuxtjs（对应Vue）作为起步也可以，这些SSR框架甚至可以尝试和其他后端框架混用，各取好用的部件。

## Java

一说到Java必定伴随着Spring，现在发展成为SpringBoot和SpringCloud了，前者是集成了各种便利化的配置，后者主要用于支持分布式和微服务。

## GoLang

本身比较新，也没有发展出高集成度的框架，大部分还处于探索阶段，比较常见是Gin和Beego作为第三方库支持。

## Python

常见是Django和Flask，Django全套集成度非常高，也需要按照它的思维去开发应用。
也嗑药用FastAPI敏捷开发出接口服务。

## PHP

Laravel非常常见，严谨化了PHP本身，并且是建造在另一个框架Symfony上，还有Slim可选。

## C#

几乎没有别的可选，就是官方自带的ASP.NET和MVC框架。并且还是那句话，更常见于桌面软件、游戏引擎等。

## Kotlin

和Java一样适用Spring Boot，其次是Vert.x。

## Rust

常见是Rocket，可以快速搭建类型安全的小型应用。另一个是非常类似Express的Actix Web。

## Ruby

最常见最受欢迎的就是Ruby on Rails，可以轻松创建不同类型应用或功能集。
其次是Sinatra，小型微服务比较适用。

## Scala

比较常见的是Play和Lift，其中Play有很多工具集成方便开发调试，甚至Java也可以用该框架。

## Swift & RLang

略。

# 数据库

主要分为传统的关系型结数据库和非关系型数据库，关系型即表结构固定，例如规定了用户表有哪些信息字段，每个用户记录也都将相同。
而非关系型即打破这种特性，不同用户记录是可以完全不同的信息字段记录。

* MySQL，关系型数据库，常见搭配PHP，Wordpress和Shopify也在使用。建议学习，MSSQL和PostSQL都与MySQL差不多。
* Microsoft SQL Server，即MSSQL，关系型数据库，和MySQL差不多，一般搭配C#使用。
* PostgreSQL，关系型数据库，和MySQL差不多，国外使用比较多，中国国内也在逐渐流行起来。
* Redis，非关系型数据库，建议学习，一般作为缓存层，嫁接在关系型数据库和程序之间。
* MongoDB，文档型数据库，也是非关系型，一般和Nodejs一起出现，适合各种结构差异大的数据高速读写。
* SQLite，小型轻量化数据库。
* Firebase，基于云服务平台存在的数据库，意味着配置和监控方便的同时，也很容易因为平台性质丧失控制权。
* Supabase，因为Firebase本身原因的开源替换方案，常见于备份Firebase数据库。

## ORM

ORM（Object-Reference-Module）即对象映射模型，因为SQL语法和程序开发语言截然不同，实际开发过程中必须不断切换思维去编写程序。
为了简化开发过程和强化程序中的对象特性，ORM类型的框架出现了，通过建立表模型来自动创建数据结构和映射成为程序中熟悉的操作对象。
一般ORM框架都能同时支持复数类型的数据库，让开发者在使用不同数据库时也能用同一种开发思维和操作方式。
常见ORM框架：

* Sequelize
* TypeORM
* Mongoose，专用于MongoDB
* Prisma，支持PostgreSQL、MongoDB和MySQL
* SQLAlchemy
* Doctrine

# REST APIs

REST-API是一种接口请求开发方式，通过HTTP的请求方法POST、DELETE、PUT、GET对应增删改查，通过统一语义化的URL地址对应请求的功能，例如GET：/product/1对应读取查询id为1的产品信息，DELETE：/product/1对应删除id为1的产品

# GraphQL

GraphQL是基于前端需要经常变化接口请求所得的数据内容和结构而出现的方式。
通过引入GraphQL相关的第三方库，后端对应数据库表结构建造模型和方法后，前端可以自行在请求时指定想要的数据内容和结构，第三方库即可自动编写SQL语句查询出对应的内容。
这也相应减少了后续调整接口所需的工作量。
其中Apollo是非常受欢迎的一个库。

# 身份验证和授权

* JSON Web Tokens，非常方便地跨不同网站域、应用和桌面软件等完成身份授权的方式。
* Cookies & Sessions，网站传统登录存储和验证方式，无法跨域和用于应用和桌面软件等非网站型程序。
* 第三方登录，通过第三方常见平台验证登录本程序，而无需填写繁琐的注册信息。国内常使用微信、支付宝、新浪微博、CSDN，而国外使用Google，Twitter、Facebook、GitHub等。

密码存储一般配合第三方库完成各种加解密等，路由（访问地址）一般需要包装成虚拟的地址，不要对应实际文件物理地址。

# Wordpress

国外非常受欢迎的建站平台，很多小型企业和个人用户会用它建造网站，并且代码可以二次修改，因此对许多开发者也相应要求有Wordpress开发经验。
也可以当做无头CMS使用。

# 辅助支持 & DevOps

最需要了解的是web服务器软件，如Apache、Nginx、IIS等。你的网站程序开发完后需要发布到这些web服务软件中，才能保持持续运行和提供各种拦截、分配、重定向、域名绑定等。
还有了解现代各种云服务平台，如AWS亚马逊云服务、阿里云、腾讯云等，一般企业不会拥有自己的服务器或者租服务器，而是选择租用云服务平台，把程序托管到平台上。
云服务平台一般还会提供各种域名注册等，也有单独提供的如heroku、DigitalOcean。
其次需要了解DevOps，即持续集成运维部署。
简单讲就是开发到部署过程中，通过一些自动化工具或框架如Docker、Kubernetes抹平开发环境和服务器的差异（如Window里开发部署到Linux服务器），并且减少程序发布部署时的手动配置过程，附带自动化测试等。

# 后端开发者能力总结

* 熟练至少一种服务端/后端开发语言
* 熟练使用数据库，并能搭配ORM/ODM
* 知道如何创建REST API和验证授权
* 熟练Linux等命令行
* 熟练如何从零开发项目并发布部署到服务器

# 手机端/应用/APP开发

主要是通过跨端框架一次性完成Android和iOS应用的开发工作，虽然大部分时候并不能抹平差异和性能底下、层出不穷的奇怪BUG，跟不上原生系统更新速度等。

* Flutter，目前最受欢迎的跨端框架，通过制作动画一样的方式完成界面开发，需要学习Dart开发语言，无论是Web开发人员还是原生开发人员都可以学习。
* React Native，基于React的手机应用跨端框架，并加入许多原生组件和属性、特性，实际没有减少多少开发量，坑也多，慎入。
* Uniapp，中国国内非常常见的跨端框架，主要是能同时兼容H5、Android、iOS、各种小程序，但对PC支持有限（由于类小程序的限制导致响应式设计效果不太好），且性能较差，Web开发人员可以学一学，但坑也非常多，国内主要是用于开发小程序比较方便。
* Ionic，可以兼容使用其他任何框架，使用预建UI组件来搭建。
* Xamarin，基于C#的跨端框架，很少见，不建议学习。

# Web3

需要学习的内容：

* 区块链技术，了解最大的公网以太网和ETH币，最有价值的比特币，了解如Layer1、P2TR、UTXO、部分签名、多签、跨链桥、Swap
* 阅读最新的技术或链如铭文、符文、Ordinal、Runealpha、Linea
* Solidity/Viper 契约型编程语言，用于编写智能合约、了解ERC20、ERC721、ERC404、转账
* 应用类型，如D游戏、DAO、DeFi、NFT、碳平衡，其中广为外界所知的NFT其实就是一种带有唯一性的货币作为产品本身销售，所以每个货币会因为价值变得价格不一。

# 人工智能

* TensorFlow一个强大的前端脚本，可以用于加载已完成机器学习的模型，更可搭配调用用户设备摄像头、麦克风、陀螺仪、手势等现场完成训练模型。例如可以用摄像头对你头部动作采样后，让你的头部动作可以控制游戏操作如上下左右移动或者视角变化等。
* GitHub Copilot，一个编程助手，作为软件插件出现，可以根据当前文件上下文和编写的注释提供比较通用的代码片段，减少重复劳动。
* ChatGPT，一个非常强大的对话型助手，可以通过输入问题让其提供已知的解决方案，也可以帮你解析代码中存在的问题，相当于一个什么事都懂一点的万能助手。
* ML-APIs，Python中封装好的识别库，的可以用于图像分类（如狮子和帆船）、多人脸识别、图像文字读取等。

# WebAssembly

WebAssembly简称wasm，可以看做新时代的Flash或者程序版的Docker，主要是用于将程序代码打包放到前端方便调用，高效完成前端javascript不擅长的密集计算、3D模型加载等。
而使用的程序开发语言根据编译工具决定，可以是Rust或者C/C++、Python等，相当于Flash里的ActionScript。
其次还有wasi（Web Assembly System Interface），基于系统接口进行程序编程的wasm，目标是通过操作系统的适配，使wasm能在Window、Mac、Linux、Android、iOS、浏览器、服务端所有地方都能直接运行并调用系统接口，如摄像头、本地文件系统、消息推送等，这是系统层面的适配而不是原本的浏览器/服务端程序开发语言层面的实现。简单讲就是适用性更广，一次开发处处运行。

# Metaverse 元宇宙

元宇宙其实是一种综合性的概念项目，包含3D、人工智能、区块链等特性，
通过结合VR或者摄像头、麦克风、陀螺仪、GPS等让用户像玩游戏一样进行办公、买菜、逛街购物等，
也有AR/MR方向，让本地软件都转移到云电脑上实现实时共享，其次是线下能大幅得到线上的支持和增强。
如苹果目前的Vision Pro、之前的Quest4、魅族眼镜等都属于此范畴的产物。
目前已有做好的元宇宙框架雏形，声称可以帮助开发者提升300%效率在开发自己的元宇宙项目上，意味着耗时几年的项目可以在六个月到一年内完成。

# 总结

无论是网站、应用还是桌面软件的发展是非常离谱和令人惊叹的，
其中前端的发展是日新月异，
很多功能已经不是简单地区分客户端、浏览器端和服务端或者后端就能解决的问题，
而是功能特性、界面交互与业务数据处理之间的三者如何协作和划分，所以保持学习！
