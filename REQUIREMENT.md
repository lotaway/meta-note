# 自动学习机

## 目标

自动队列学习机，目前主要是针对B站视频平台，自动访问B站视频列表，过滤出可进行学习的知识类视频添加到学习队列里，逐个交给LLM Provider进行学习并记录到RAG数据库里，之后继续下一个，直到达到每日学习额度。

## 任务清单

### - [] B站访问程序

自动访问B站`https://www.bilibili.com`，解析其html或者拦截视频列表接口，拿到推荐的所有视频信息，包括视频标题、视频链接、视频关键字，先执行低成本规则过滤在LLM前：
* 标题长度 < N 直接丢弃
* 含「开箱 / 日常 / vlog / 记录 / 娱乐」直接丢弃
之后调用`/v1/chat/completions`LLM接口提供对应提示词，对所有视频标题进行分类和难度等级的判断（1-10,数字越大越难越高级)，确定哪些是“教程”或者包含“知识”，要求AI返回数据格式为：
```json
[
    {
        "category": "class|knowledge",
        "link": "https://www.bilibili.com/video/BV1kimbBMEr9",
        "level": 1-10,
        "confidence": 1-10,
        "reason": "模型判定的原因"
    }
]
```
根据返回的数据数量和`.env`里填写的`STUDY_LIST_LIMIT_COUNT`x2对比，如果不足则执行页面上的”换一换“按钮，等待页面刷新出新视频再重复以上步骤，最多重复`STUDY_LIST_LIMIT_COUNT`x2次，如果还是不足也直接结束。
之后将得到的数据列表按照level和confidence综合进行排序，筛选出前`STUDY_LIST_LIMIT_COUNT`个数据，将这些数据留给后面的`请求学习接口`任务

### - [] 请求学习接口

提供一个`/api/study/request`接口给`B站访问程序`任务拿到的数据使用，包含以下请求参数字段：

* platform，目标平台，目前只有一个就是`bilibili`
* target,学习对象，目前是以Web视频链接为主要学习来源，如`https://www.bilibili.com/video/BV1kimbBMEr9`
* targetType,对象类型，目前只有一种就是`videoLink`
* targetPrefix,修正对象类型，主要是为了防止`targetType`作为公共类型不足以覆盖所有平台的可能性，需要一个次级类型作为辅助，非必填，默认放空
* studyType,学习的类型或者方向，目前只有一种就是`summary`即总结视频的内容，之后可能会添加如`though`即提取新思路，即之前灭有被记忆过的内容才会被学习

该接口会将此任务添加到`.env`指定的Kafka，Topic为`study_list`，并在`.env.example`说明，并遵守学习额度，超过额度则不执行并返回报错信息。

学习额度：记录上限为`.env`里填写的`STUDY_LIST_LIMIT_COUNT`（任务数量，最低1，最高不能超过100，默认10）和`STUDY_LIMIT_TIME`（任务时间，按照每次调用`/v1/chat/completions`执行任务（目前是视频总结）耗时累计，最低5分钟，最高不能超过120分钟，默认45分钟。


### - [] 添加本地模型供应商

在当前已有的chatgpt、deepseek两种桥接模型外，提供local模型供应商给`/v1/chat/completions`。local模型即`.env`里填写`LOCAL_LLM_PROVIDER`即视为可用，例如`http://localhost:10434`，这样访问上述接口时就会转发给这个local模型

### - [] 定时学习任务

在空闲时会根据`.env`指定的Kafka，Topic为`study_list`一条数据消化/移除，并将其先记录到Kafka，Topic为`studying_list`里，之后调用自身的`/v1/chat/completions`的local供应商按照规定提示词执行任务（目前是视频总结），总结后调用`LOCAL_LLM_PROVIDER`的POST接口`/rag/document/import`将总结导入，参数为：
```ts
interface ImportDocumentData {
  title: string
  bvid: string
  cid: number
  source: string
  content: string
  contentType?: DocumentType
}
```

如果调用总结成功则给Redis String，Key为`study_success_count`+1并且过期时间定为距离当前24小时后，出现报错时会将错误信息记录到Redis List，Key为`study_list_error`里，无论是否成功都将从`studying_list`里移除，并继续进行下一个学习任务，直到消化完`study_list`所有任务或者达到规定的学习额度

## 推荐结构

Electron (主进程)
 ├─ NestJS (API + Scheduler)
 ├─ Redis client
 ├─ Kafka consumer
 ├─ LLM Provider bridge
 └─ Plugin bridge

## 具体职责边界

插件【只干 3 件事】

打开页面

拿结构化数据（DOM / XHR）

执行用户级操作（点击 / 滚动）

插件 不：

判定是否学习

控制额度

决定学习顺序

调用 LLM

Electron【唯一决策者】

是否换一换

是否继续抓

是否入队

是否执行学习

是否超额

是否重试

为什么不能 Electron 直接访问页面

B 站反爬

cookie / 登录态

推荐算法差异

指纹一致性

插件是“合法身份”，Electron 不是。