# - [x] 自动学习机

## 目标

自动队列学习机，目前主要是针对 B 站视频平台，自动访问 B 站视频列表，过滤出可进行学习的知识类视频添加到学习队列里，逐个交给 LLM Provider 进行学习并记录到 RAG 数据库里，之后继续下一个，直到达到每日学习额度。

## 任务清单

### - [] B 站访问程序

自动访问 B 站`https://www.bilibili.com`，解析其 html 或者拦截视频列表接口，拿到推荐的所有视频信息，包括视频标题、视频链接、视频关键字，先执行低成本规则过滤在 LLM 前：

- 标题长度 < N 直接丢弃
- 含「开箱 / 日常 / vlog / 记录 / 娱乐」直接丢弃
  之后调用`/v1/chat/completions`LLM 接口提供对应提示词，对所有视频标题进行分类和难度等级的判断（1-10,数字越大越难越高级)，确定哪些是“教程”或者包含“知识”，要求 AI 返回数据格式为：

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

根据返回的数据数量和`.env`里填写的`STUDY_LIST_LIMIT_COUNT`x2 对比，如果不足则执行页面上的”换一换“按钮，等待页面刷新出新视频再重复以上步骤，最多重复`STUDY_LIST_LIMIT_COUNT`x2 次，如果还是不足也直接结束。
之后将得到的数据列表按照 level 和 confidence 综合进行排序，筛选出前`STUDY_LIST_LIMIT_COUNT`个数据，将这些数据留给后面的`请求学习接口`任务

### - [] 请求学习接口

提供一个`/api/study/request`接口给`B站访问程序`任务拿到的数据使用，包含以下请求参数字段：

- platform，目标平台，目前只有一个就是`bilibili`
- target,学习对象，目前是以 Web 视频链接为主要学习来源，如`https://www.bilibili.com/video/BV1kimbBMEr9`
- targetType,对象类型，目前只有一种就是`videoLink`
- targetPrefix,修正对象类型，主要是为了防止`targetType`作为公共类型不足以覆盖所有平台的可能性，需要一个次级类型作为辅助，非必填，默认放空
- studyType,学习的类型或者方向，目前只有一种就是`summary`即总结视频的内容，之后可能会添加如`though`即提取新思路，即之前灭有被记忆过的内容才会被学习

该接口会将此任务添加到`.env`指定的 Kafka，Topic 为`study_list`，并在`.env.example`说明，并遵守学习额度，超过额度则不执行并返回报错信息。

学习额度：记录上限为`.env`里填写的`STUDY_LIST_LIMIT_COUNT`（任务数量，最低 1，最高不能超过 100，默认 10）和`STUDY_LIMIT_TIME`（任务时间，按照每次调用`/v1/chat/completions`执行任务（目前是视频总结）耗时累计，最低 5 分钟，最高不能超过 120 分钟，默认 45 分钟。

### - [] 添加本地模型供应商

在当前已有的 chatgpt、deepseek 两种桥接模型外，提供 local 模型供应商给`/v1/chat/completions`。local 模型即`.env`里填写`LOCAL_LLM_PROVIDER`即视为可用，例如`http://localhost:10434`，这样访问上述接口时就会转发给这个 local 模型

### - [] 定时学习任务

在空闲时会根据`.env`指定的 Kafka，Topic 为`study_list`一条数据消化/移除，并将其先记录到 Kafka，Topic 为`studying_list`里，之后调用自身的`/v1/chat/completions`的 local 供应商按照规定提示词执行任务（目前是视频总结），总结后调用`LOCAL_LLM_PROVIDER`的 POST 接口`/rag/document/import`将总结导入，参数为：

```ts
interface ImportDocumentData {
  title: string;
  bvid: string;
  cid: number;
  source: string;
  content: string;
  contentType?: DocumentType;
}
```

如果调用总结成功则给 Redis String，Key 为`study_success_count`+1 并且过期时间定为距离当前 24 小时后，出现报错时会将错误信息记录到 Redis List，Key 为`study_list_error`里，无论是否成功都将从`studying_list`里移除，并继续进行下一个学习任务，直到消化完`study_list`所有任务或者达到规定的学习额度

## 具体职责边界

插件：拿结构化数据（DOM / XHR）、执行用户级操作（点击 / 滚动）
软件：决策是否换一换、是否继续抓、是否入队、是否执行学习、是否超额、是否重试

# - [x] 用 threejs+ts+react 实现 canvas3d 编辑器

左侧侧边栏 react 的伪文件管理目录，右侧剩余区域为编辑器，包含左边的工具栏和右边的布局区，工具栏包含可拖拽出来的放置到布局区的组件三种，分别是方块、球体、锥体，放到布局区后可任意拖动缩放和修改颜色，并可添加文字到该图形下方。

- [] 添加到布局里的组件用户可以编辑下方显示的文字
- [] 组件选中后右上角显示删除图标按钮，点击可删除
- [] 文件管理目录需要实现，可创建目录和选中目录，放到布局区里的组件也会对应到当前选中的目录进行归类，选中的目录里的组件才可被编辑，例如拖动和删除、编辑文字
