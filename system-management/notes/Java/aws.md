使用AWS SDK for Java可以轻松开启使用AWS云存储数据库等各种云服务。
其中云存储服务为AWS S3（Simple Storage Service）。

# AWS S3介绍

S3提供了一个类似文件管理系统的线上存储空间，用户可以通过接口将数据当作Bytes类型的字符串传输并存储为文件，无论是文字数据还是图片都可以。

# 配置流程

1. 在[Amazon Web Service官网](https://www.amazonaws.cn/)注册账号；
2. 在云服务里添加访问管理的账户（如同操作系统的用户）；
3. 在云服务里创建用于鉴权的密钥Access Key；
4. 回到所在电脑环境，在用户文件夹目录中创建.aws/credentials用于存放前面得到的账号权限信息，window上是C:\Users\用户名\，linux上是/Users/用户名/，注意部署到服务器时也要配置这部分账号信息；
5. 在项目导入AWS SDK，并配置地区完成初始化（前面开通密钥后有示例代码）；
6. 到这一步可正式在项目想要的位置进行服务的使用与标准化建立，例如最常见用的putObject和getObject。