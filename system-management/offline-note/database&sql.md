@[TOC](Database&SQL学习-基础课程)

# 数据库类型

## 关系型数据库 Relational Database

类似Excel表格的结构化数据，
以`行 Row`和`列 Column`的形式存储数据，一行代表一条数据，一列代表一个属性。
这些行列组成一张`表 Table`，数据库可以有多张表，
每条数据都有`主键 Primary Key`用于代表数据的唯一性，一般是使用id。
接着可以有`外键 Foreign Key`，用于链接其他表的`id`以达成关系描述。

优势是结构统一，处理关系事务原子性强，数据一致性强，稳定规范。
缺点就是不够灵活，数据量大和属性多下性能就大幅下降。

## 列式数据库 Columnar Database

相比关系型数据库而言，是以`列 Column`的形式存储数据，
每列数据可以是不同的类型。
最大的优势体现在当数据库数据量非常大，字段又多的情况下，
若是只要两三个字段，按列逐行读取性能非常好。
适合数据庞大且复杂的企业。

## 文档数据库 Document Database

以`文档 Document`的形式存储一条数据，一般是`JSON`格式。
每个文档可以有任意不同的字段，但仍会使用`id`作为唯一键。
每个字段可以有一个或多个值。
多个文档成为`集合Colletion`，类似关系型数据库的表。
存储非常灵活，适合存储来自不同时间或者不同源头的数据。

可惜由于事务、关联能力都没有关系型数据库好，
并没有成为主流，
更多存在于野蛮成长阶段的个人或者初创企业项目里。

## 图形数据库 Graph Database

以`节点 Node`和`边 Edge`的形式存储数据，
节点可以有属性，边可以有方向。
例如可以记录十个学生和多间学校、一个老师的关系。
适合复杂的网络关系数据，如社交网络、推荐系统等。

## 矢量数据库 Vector Database

以`向量 Vector`的形式存储数据，
常用于将图片、视频、音频、文档等媒体文件变为向量存储，
常见于AI领域，如搜索时找相似的以图搜图。

## 键值对数据库 Key-Value Database

顾名思义以唯一键名作为索引，存储一个或多个值，
存取效率非常高，但关联性为零。
适合用于缓存、计数、日志等事件场景。

## 时间序列数据库 Time-Series Database

以时间戳作为索引，存储一段时间内的数据，
由于优化了时间关联如事件记录，方便记录大量数据，
可以用于监控、分析、预测等场景。

# SOL概念

SQL是Structured Query Language 的缩写,意为“结构化查询语言”。一般代指现在计算机中的各种SQL数据库，如MySQL、MicrosoftServerSQL。
SQL主要是在关系型数据库里使用的

* 以下语句以MySQL为主，其他数据库在字段类型、语法上会有轻微区别，但大同小异。

# 创建

通过`CREATE TABLE [tableName] (Array<field>)`创建一个用户表：

```mysql
--  用户表
CREATE TABLE `User`
(
    id         INTEGER PRIMARY KEY UNIQUE AUTO_INCREMENT COMMENT '用户标识',
    username   VARCHAR(20) NOT NULL UNIQUE COMMENT '用户名',
    nickname   VARCHAR(20)          DEFAULT '' COMMENT '昵称',
    sex        CHAR(2)     NOT NULL DEFAULT 0 COMMENT '性别',
    age        CHAR(2)     NOT NULL DEFAULT 0 COMMENT '年龄',
    author_id   INTEGER COMMENT '作者标识',
    create_time DATETIME(3)          DEFAULT date(3),
    update_time DATETIME(3)          DEFAULT date(3)
);
-- 作者表
CREATE TABLE `Author`
(
    id       INTEGER PRIMARY KEY UNIQUE AUTO_INCREMENT COMMENT '作者标识',
    nickname VARCHAR(20) UNIQUE COMMENT '昵称',
    user_id   INTEGER NOT NULL,
    CONSTRAINT `Author_userId_fkey` FOREIGN KEY (user_id) REFERENCES `User` (`id`),
    state    CHAR(1) DEFAULT 0 COMMENT '账号状态',
    category TINYINT(50) COMMENT '写作类型',
    level    TINYINT(10) COMMENT '级别'
);
-- 书籍表
CREATE TABLE `Book`
(
    id          INTEGER PRIMARY KEY UNIQUE AUTO_INCREMENT COMMENT '书标识',
    author_id    INTEGER      NOT NULL,
    CONSTRAINT `Book_authorId_fkey` FOREIGN KEY (author_id) REFERENCES `Author` (`id`),
    book_name    VARCHAR(30)  NOT NULL UNIQUE COMMENT '书名',
    description VARCHAR(255) NOT NULL UNIQUE COMMENT '描述',
    state       CHAR(1) DEFAULT 0 COMMENT '书籍状态',
    readCount   INTEGER DEFAULT 0 COMMENT '阅读量',
    create_time datetime(3) COMMENT '上架时间',
    update_time datetime(3) COMMENT '更新时间'
);
-- 书籍章节内容
CREATE TABLE `BookChapter`
(
    id          VARCHAR(50) UNIQUE DEFAULT uuid() COMMENT '书籍章节标识',
    book_id      INTEGER     NOT NULL,
    CONSTRAINT `BookChapter_bookId_fkey` FOREIGN KEY (book_id) REFERENCES `Book` (`id`),
    chapter_name VARCHAR(50) NOT NULL UNIQUE COMMENT '章节名称',
    state       CHAR(1)            DEFAULT 0 COMMENT '章节状态',
    content     text               DEFAULT '' COMMENT '章节内容',
    readCount   INTEGER            DEFAULT 0 COMMENT '阅读量'
);
-- 订阅书籍，通过state：【0：互不关注，1：用户1关注用户2，2：用户2关注用户1，3：用户1和2互相关注】
CREATE TABLE `AuthorSubscribe`
(
    id      INTEGER UNIQUE   DEFAULT uuid() COMMENT '订阅标识',
    f_user_id INTEGER NOT NULL COMMENT '被订阅的作者标识',
    CONSTRAINT `BookSubscribe_fUserId_fkey` FOREIGN KEY (f_user_id) REFERENCES `Author` (`id`),
    s_user_id INTEGER NOT NULL COMMENT '要订阅的用户标识',
    CONSTRAINT `BookSubscribe_sUserId_fkey` FOREIGN KEY (s_user_id) REFERENCES `Author` (`id`),
    state   CHAR(1) NOT NULL DEFAULT 0
)
```

## 外键 FOREIGN KEY

外键是用于关联两张表之间的关系，如教师和学生之间，是一个教师带领一群学生，这样就需要在学生表中设置外键指向教师表，之后若是需要查找某个教师带领的所有学生，或者查找某个学生与其教师即可通过这种关联查找。
前面创建表结构时演示过直接附加外键，以下通过额外修改表的方式添加外键：

```mysql
ALTER TABLE `Author`
    ADD CONSTRAINT `Author_userId_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`);
```

如果只是数据库的外键，一般是指物理外键，但也可以不依靠数据库，单纯通过代码方式进行关联，这种称为逻辑外键。

* 物理外键，对某列使用foreign key定义外键关联其他表，优点是关系都在数据库中定好，不会轻易出现人为错误。缺点是影响增删改效率，容易引发死锁，也不适用于分布式、集群和微服务等场景。
* 逻辑外键，只在代码里定义关联，所有增删改查都需要经过这层处理，优点是易于改动和处理复杂情况，缺点是缺乏直接关联，一旦有漏网之鱼没有经过中间层处理或直接操作数据库则会出现错乱。

# 查询 Query

通过语句`SELECT * FROM [tableName]`查询

```sql
SELECT *
FROM User;
```

要注意目前大部分企业不允许直接使用*号查询，而是要求写出列名，因为使用*
号会先执行查找表中有哪些字段，之后再按照这些字段进行查询，效率会有问题，其次是如果表结构更新了会无意间泄露了敏感信息，也不利于尽早发现问题。

# 添加/插入数据 Create

通过语句`insert into [tableName] values (Array<field>)`插入数据

# 修改/更新数据 Update

通过语句`UPDATE [tableName] SET [field]=[value] WHERE [condition]`：

```sql
UPDATE `Author`
SET penname='笔下留情'
WHERE id = 1;
```

# 删除数据 Delete

通过语句`DELETE FROM [tableName] WHERE [condition]`：

```shell
DELETE FROM `BookChapter` WHERE id=1;
```

## 列查询

列查询即不使用*号，而是罗列具体要查询的字段名，通过`SELECT fieldName1, fieldName2 FROM [tableName]`查询

```sql
SELECT book_name, state
FROM Book;
```

## 列运算

列查询结果支持进行一些简单的运算或函数使用

```sql
SELECT book_name, create_time * 1000
FROM Book;
```

## 列别名

对于某些查询出来的列名可能重命名的需要，常见于同时查询两张表，而两张表里都有相同的name列名，这时就需要对其中一个或两个都重命名。
重命名可以用`SELECT fieldName1 newFieldName1 FROM [tableName]`或者`SELECT filedName1 AS newFieldName1 FROM [tableName]`
语法，其中newFieldName1如果与表名冲突或者需要空格可以加上单引号或双引号'new field name1'

```sql
SELECT User.state user_state, Author.state author_state
FROM User,
     Author
WHERE...
```

## 去重

有时对于查询出来的列数据会有重复的情况（注意前面是列名重复，这里是数据重复），而如果不需要重复可以通过distinct修饰字段去重

```sql
SELECT username, DISTINCT author_id
FROM User;
```

## 条件查询 WHERE

通过条件查询指定含有符合要求的字段值才能输出对应行，这可以完成大部分日常要求。
条件查询根据字段类型可以使用：>, >=, <=, !=这种对单一数值的比较, between...and, IN, LIKE, is NULL, and ,OR, not这种对范围的处理

如查找日期在2023年之后创建或更新的：

```sql
-- 使用日期格式
SELECT *
FROM Book
WHERE update_time >= '2023-01-01'
   OR create_time >= '2023-01-01'
--    使用时间戳格式
SELECT *
FROM Book
WHERE update_time >= '1672531200000'
OR create_time >= '1672531200000'
-- 使用内置方法获取指定年份，如mysql的
SELECT *
FROM Book
WHERE update_time >= YEAR(NOW())
-- 使用内置方法获取指定时间范围
SELECT * FROM orders
WHERE order_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

查找多个不同关键字书名的：

```sql
SELECT book_name
FROM Book
WHERE book_name IN ('逆天', '邪神');
```

查找作者名称以某个结尾的：

```sql
SELECT authorName
FROM Author
WHERE authorName LIKE '%番茄';
```

## 聚合函数

聚合函数可以按照列（字段）进行整理操作，包含：

* SUM 计算总和。
* COUNT 计算列数，忽略Null值的列
* MAX 获取最大值的那一列
* MIN 获取最小值的那一列
* AVG 获取平均值

```sql
SELECT book_name,
       SUM(readCount) AS '总阅读数', COUNT(readCount) AS '总共书本量', MAX(readCount) AS '单本最多阅读数', MIN(readCount) AS '单本最少阅读数', AVG(readCount) AS '单本平均阅读数'
FROM Book
WHERE state = 1;
```

## 分组查询 GROUP BY/HAVING

分组查询既将查询到的结果再按照要求将相同字段的合并为一行。
包含group by 字段名 和 HAVING 筛选条件。
以下示例是将用户查询结果按照性别分组，并计算合并的行数（既性别人数）

```sql
SELECT *, COUNT(id)
FROM User
WHERE sex!=Null
GROUP BY sex
```

having可以用于对group by后的分组结果再进行筛选

```sql
SELECT *, COUNT(id)
FROM User
WHERE sex!=Null
GROUP BY sex, name
HAVING COUNT (id) > 1
```

## 窗口函数 OVER

over用于对单独字段进行类似group by的分组返回结果集。
语法:OVER (partition by [fieldName])

```sql
SELECT id, name, AVG(Book.id) OVER(PARTITION BY Book.type)
FROM Author,
     Book
WHERE Author.id = Book.author_id
```

over内部可使用order by进行排序，但会影响求值结果，导致每行结果只会根据前面已查询出来的行进行整理计算：

* 行1，按照行1计算
* 行2，按照行1、2计算
* 行3，按照行1、2、3计算
* ...以此类推
* 行n，按照行1、2、...n-1、n计算

PARTITION BY 后面还可跟特有函数。
可用函数：

* first_value(col)
* last_value(col)
  序号函数：
* rank() 根据排序返回，多个相同序号之后会跳到正确序号，如1、1、3、4、4、6
* row_number() 当排序值相同时只返回序号
* dense_rank() 当排序相同时不跳序号而是紧跟，如1、1、2、3、3、4

## 流程控制 CASE

流程控制语句可以用来根据字段值输出不同的内容，如性别定义为整型或布尔型时，可以通过这种方式输出更具有意义的文字男性与女性，相当于对值的一种别名处理：

```sql
SELECT (CASE sex
            WHEN 1 THEN 'male'
            WHEN 2 THEN 'female'
            else 'unknown' END
           ) sex,
       name
FROM User;
```

## 排序 ORDER BY

主要为升序asc和降序desc，默认按照升序。

```mysql
SELECT *
FROM Book
ORDER BY update_time desc;
```

## 多表联查

通过在from后添加多个表名，使用where指定正确的匹配即可，如果没有使用where筛选条件将会变成笛卡尔积，既获得左表列数n和右表列数m的乘积数量的行数，左表5条记录，右表6条记录，结果是30条记录:

```mysql
SELECT User.*, Author.*
FROM User,
     Author
WHERE User.id = Author.user_id;
```

## 连接查询 JOIN

通过在查询语句后面加入[JOIN 表名 on 条件]即可进行连接查询，可细分为多种，默认为left JOIN：

* inner JOIN，内连接，交集，表之间能被where匹配到的行记录才会显示。在from后添加多个表时实际是使用inner join进行查询。
* left JOIN，左外连接，左全集，右交集，左表全部行记录会显示，右表被左表where匹配到的行记录才会显示，相当于就算在右表查询到的记录为null也会因为左表的存在而显示出来，最常用的一种。
* right JOIN，右外连接，右全集，左交集，和上述相反。当在右表查询到的记录就算没有合适的左表匹配项也会显示出来。
* full JOIN，全连接，左右全集。

```mysql
SELECT User.*, Author.*
FROM `User`
         JOIN `Author` on `User`.`author_id` = `Author`.`id`
```

三表联查：

```mysql
SELECT User.*, Author.*, Book.*
FROM (User JOIN Author WHERE User.author_id=Author.id)
       JOIN Book
WHERE Author.id = Book.author_id
```

## 联合

union用于合并两条查询结果，注意查询结果之间的列数必须相等和注意次序，相同次序的列会被合并。
此功能更常见于合并对相同表的多个查询结果的合并。

```mysql
SELECT id, author_name
FROM Author
       JOIN User on Author.id = User.author_id and User.nickName = '逆天'
union
SELECT id, author_name
FROM Author
       JOIN Book on Author.id = Book.author_id and Book.update_time > '2023-01-01' 
```

## 子查询

通过在语句中添加可作为单独查询结果的语句并进行二次查询，其中条件部分称为子查询，其他部分称为主查询或者外部查询。
子查询大部分时候是用在where后面，所有可用位置：

* SELECT
* FROM
* WHERE
* JOIN

查询可以返回多种不同形式的结果，包括：

* 标量子查询
* 列子查询
* 行子查询（MySQL独有）
* 表子查询

### 标量子查询

子查询中只返回单行单列，只有唯一一个值，可使用=，<=等运算符直接匹配。

```mysql
SELECT *
FROM `User`
WHERE `id` = (SELECT user_id AS id FROM `Author` WHERE nickname = '很爱很爱你')
```

### 列子查询

子查询中返回单列的数据，但包含了多行，必须用in，NOT in范围匹配。
注意如果只有一行数据，即单列单行的话即称为标量子查询。

```mysql
SELECT *
FROM `User`
WHERE `id` IN (SELECT user_id AS id FROM `Author` WHERE state = '1' OR state = '2')
```

#### EXIST/IN

EXIST/IN都是类似的在集合范围中查找是否存在，如果子查询结果比外部查询记录数多的话，使用eXIST效率更好，即：

* 查找少存在于多用EXIST
* 查找多存在于少用IN

### 行子查询

子查询中返回一行多列，可对多列分别进行=,<=等运算符直接匹配。
注意如果只有一列数据，即单列单行的话即称为标量子查询。
这个是MySQL独有的。

```mysql
SELECT *
FROM `Author`
WHERE (category, level) = (SELECT category, level FROM `Author` WHERE id = 1);
```

### 表子查询

子查询中返回多行多列，类似双表查询，方便用做临时表时使用，常见用于from后面作为临时表，或者用在where后面搭配in查询。

作为临时表使用：

```mysql
SELECT *
FROM (SELECT * FROM `User` WHERE create_time > '2023-01-01') u,
     `Author`
WHERE u.id = Author.user_id;
```

作为集合范围使用：

```mysql
SELECT *
FROM `Author`
WHERE (category, level) IN (SELECT category, level FROM `Author` WHERE name LIKE '鱼');
```

### ALL/ANY

ALL/ANY可以让集合范围变成单独一个值用于=运算符等的对比：

* ALL，让对比过程必须满足所有集合值
* ANY，让对比过程只需要满足一个集合值即可

### 相关查询/临时表/中间表

临时表的特点就是子查询实际上可以与主查询已查出的数据进行交互筛选，让外部查询结果在子查询筛选（WHERE）时就能使用。
既在筛选过程中没有区分明显的先后关系，而是分别主子查询一次后再根据条件筛选，如：

```sql
SELECT *
FROM employee
       JOIN salary on salary.employee_id = employee.id
WHERE salary.pay = (SELECT MAX(salary.pay)
                    FROM salary
                    WHERE salary.employee_id = employee.id)
```

# 公用表达式 WITH

公用表达式用于创建出查询结果可被多次使用的语句。
语法：WITH [name] (field1, field2) AS (...SQL)
如：

```sql
WITH user_q (id, name, author_id, email) AS (*
FROM User, Author
WHERE User.id = Author.user_id)
SELECT *
FROM user_q;
SELECT *
FROM author
WHERE user_id IN (user_q);
```

# 视图 VIEW

视图用于创建多个查询语句一次性批量使用的情况，常见于统计报表使用。
语法：CREATE VIEW [name] AS (...SQL)，如：

```sql
CREATE VIEW user_author (id, name, author_id, email) AS
(
SELECT *
FROM User,
     Author
WHERE User.id = Author.user_id);
SELECT *
FROM user_author;
```

删除视图

```sql
DROP VIEW [name];
```

符合简单视图才能作为临时表被用于更新，简单视图规则：

* 无集合操作
* 无DISTINCT
* 无聚合和分析函数
* 无GROUP BY

不可更新意味着视图被作为临时表使用时，语句执行结果不可修改视图前后的查询结果，方便用于限制第三方的修改。

# 锁

## 全局锁/库锁

全局锁就是对整个数据库都加锁，使用以下命令完成：

```sql
Flush tables WITH READ lock;
```

也可以考虑用全局变量：

```sql
SET GLOBAL readonly=true;
```

这会让整个库都只能读，写入修改数据和结构都是不被允许的。这种方式一般只有用于数据库备份甚至不被使用。

## 表级锁

表级锁即对单个或多个表加锁，MySQL里的表级锁会分为表锁和元数据锁。

表锁可以限制只能读取或者读写都禁止：

```sql
-- 表锁
lock/unlock tables table_name_1 READ/WRITE, table_name_2 READ/WRITE;
```

MDL元数据锁（Meta Data Lock）是当sql语句执行时会自动添加而无须显式调用，增删改查的sql会添加MDL读锁，禁止修改表结构的sql；修改表结构的sql会添加MDL写锁，禁止增删改查的sql。
MDL是MySQL特有的。

## 行锁

行锁即只针对单行或多行数据加锁。
行锁一般是数据库引擎实现的，也不是所有的引擎都支持，常见于事务使用：

```sql
BEGIN;
UPDATE table_name_1
SET value = value + 1
WHERE name = 'a name';
DELETE
FROM table_name_2
WHERE id = 1;
COMMIT;
```

## 间隔锁 Gap Lock

间隔锁（Gap Lock）是MySQL中的一种行锁，用于锁定一个范围而不是单个行。它锁定一个范围，但不包括记录本身，因此允许其他事务在范围内插入新记录，但不允许其他事务插入已经存在的记录。间隔锁可以防止幻读问题，但是会降低并发性能。

间隔锁在以下场景会自动使用：
当使用范围条件查询时，MySQL会自动使用间隔锁来防止幻读问题。
例如：

```sql
SELECT *
FROM `table_name`
WHERE `id` BETWEEN 10 AND 20 FOR UPDATE;
```

手动使用间隔锁：
可以使用以下语句手动添加间隔锁：

### X锁/排他锁

```sql
SELECT *
FROM `table_name`
WHERE `id` BETWEEN 10 AND 20 FOR UPDATE;
```

或者

### S锁/共享锁

```sql
SELECT *
FROM `table_name`
WHERE `id` BETWEEN 10 AND 20 LOCK IN SHARE MODE;
```

共享锁和另一个共享锁可以共存，但共享锁和排他锁之间、排他锁和另一个排他锁之间不能共存

## 幻读和不可重复读

-- 幻读是指在同一事务中，由于其他事务插入了新的数据，导致同一查询条件下返回了不同的结果集。
-- 不可重复读是指在同一事务中，由于其他事务修改了数据，导致同一查询条件下返回了不同的结果集。
-- 幻读和不可重复读都是事务隔离级别中的问题，但是幻读是针对插入操作，不可重复读是针对修改操作。
-- 可以通过设置事务隔离级别来解决这些问题，例如将隔离级别设置为Serializable。 