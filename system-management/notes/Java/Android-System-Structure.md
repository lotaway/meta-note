# 概述

客户端可以笼统地分成用户界面和数据，其中用户界面负责用户界面的渲染和展示工作，如果有新数据到来时，也负责各种跳转、更新界面结构等。
而数据则是指主要用于获取和存储数据，并负责一部分业务处理的数据逻辑层。
当UI出现用户事件需要更新数据时，用户界面通过发布事件通知订阅者，订阅者调用数据层进行数据更新并反馈到用户界面上。

例如一个新闻列表，用户可以滑动加载下一页，也可以将单条新闻收藏或取消收藏为书签，这个动作就是一个发布订阅的过程，之后进行数据获取并反馈到用户界面上，就是显示下一页的新闻、收藏状态的变更。

# 数据层 Model

数据层分成数据源和连接它们的仓库层，而数据源一般又分为网络数据源和本地数据源。一般是通过网络获取数据并存储到本地，但本地也有一些通过用户输入获取的数据存储起来。

## 网络数据源 Network

网络数据源包含网络数据来源的获取和系统实现，但一般不会进行存储，看情况进行缓存或者存储到本地数据源中。一般是通过api获取，也有长连接、rpc、socket、推送消息等获取方式。

## 本地数据源 Local

负责本地数据存储和获取的系统实现，例如安卓可提供的有本地文件、内存和本地数据库三种存储与获取方式，也可提供摄像头、麦克风、陀螺仪、指纹、距离等传感器数据，这也是大部分客户端提供的存储方式。

```kotlin
class LocalDataSource(private val dataStore: DataStore<UserPreferences>) {

    val bookmarksStream: Flow<List<String>> = dataStore.data.map {
        it.bookmarksMap.keys.toList()
    }

    suspend fun toggleBookmark(newsResourceId: String, isBookmarked: boolean) {
        // ...
        if (isBookmarked) {
            bookmarks.put(newsResourceId, true)
        }
        else {
            bookmarks.remove(newsResourceId)
        }
        // ...
    }

}
``` 

## 数据仓库 Repository

主要是负责接合同类的本地与网络数据源，过程化两者。
例如有的网络数据依赖本地数据作为参数获取，之后又需要存储到本地数据源里。
仓库将作为同类中唯一出入口管理数据源。
注意是”同类“才统合，而不是直接合并所有本地与网络数据，因此会有多个不同类的数据仓库。

# 用户界面 View and View Model

用户界面会包含有视图（View）和视图模型（ViewModel），其中视图层在安卓上的具体实现分为窗口（Activity）和屏幕/界面（Screen/View）。
传统应用一般是一个窗口对应一个界面，后来TabBar常驻界面和各种弹窗的出现让一个窗口对应多个界面成为必要。直到现在Jetpack Compose这类UI框架鼓励使用一个窗口上对应几乎所有界面的方式，以便统一数据源的管理，简化数据在不同界面的传递和同步方式。
视图模型负责统合各种数据，准备用于界面展示，因此数据模型往往和视图所需的数据展示结构有强对应关系。
视图模型的数据来源一部分是当前窗口/界面上的本地变量，但大部分是来源于Model数据层中的数据仓库。
视图模型根据需要选择所需的1~N个数据仓库进行数据整合工作。
如果展示的结构并不复杂，也可让视图模型尽可能对应单一数据仓库，通过使用多个不同视图模型来共给单个视图使用。

视图模型：

```kotlin
data class NewsResource {
    val id: Integer,
    val thumbnail: String,
    val title: String,
    val content: String,
    val url: String
}

data class SaveableNewsResource {
    val newsResource: NewsResource,
    val isBookmarked: Boolean
}

sealed interface NewsListState {
    object NoInit: NewsListState
    object Loading: NewsListState
    data class Success(val newsResources: List<SaveableNewsResource>): NewsListState
    object Error: NewsListState
    object End: NewsListState
}

class MyViewModel(val bookmarksRepository: BookmarksRepository, newsRepository: NewsRepository): ViewModel() {
    
    private val newsData: List<SaveableNewsResource> = combine(newsRepository.newsResourcesStream, bookmarksRepository.bookmarksStream) { newsResources, bookmarks ->
        newsResources.map { newsResource ->
            val isBookmarked = bookmarks.contains(newsResource.id)
            SaveableNewsResource(newsResource, isBookmarked)
        }
    }

    // 执行数据获取时，由于过程会有网络、解析、计算等导致的延迟，会有等待、成功、失败等状态，这些状态也需要作为数据展示到用户界面上
    val uiState: StateFlow<NewsListState> = NewsListState.NoInit()

    fun toggleBookmark(newsResourceId: String, isBookmarked: boolean) {
        this.scope {
            newsRepository.toggleBookmark(newsResourceId, isBookmarked)
        }
    }
}
```

视图层：

```kotlin
// 组件
@Composable
fun NewsResourceCard(newsResource: NewsResource, isBookmarked: Boolean, onToggleBookmark: () -> Unit) {
    Column {
        Text(text = newsResource.title)
        Text(text = newsResource.content)
        Button {
            Text(text = if (isBookmarked)  { "Unmark" } else { "Mark" })
        }
    }
}

@Composable
fun NewsFeed(newsResources: List<SaveableNewsResource>, onToggleBookmark: (String, Boolean) -> Unit) {
    LazyColumn {
        items(newsResources) {
            NewsResourceCard(
                newsResource = it.newsResource, 
                isBookmarked = it.isBookmarked, 
                onToggleBookmark = {
                    onToggleBookmark(it.newsResource.id, !it.isBookmarked)
                }
            )
        }
    }
}

// 屏幕
@Composable
fun NewsListScreen() {
    NewsFeed {
        Text(text = "News Title")
    }
}

// 窗口
class MainActivity: ComponentActivity() {
    override fun onCreated(savedInstance: SavedInstance? = null) {
        onCreated(savedInstance)
        showContent {
            NewsListScreen
        }
    }
}
```

# 整体结构

* Plugin 插件，负责各种通用依赖库，库可以被任意功能
* App 应用，负责整体生命周期，包含各种Activity窗口，窗口会依赖各种功能特性组成
* Feature 功能特性，负责各种具体功能区块，如新闻列表、关注列表、消息列表等，主要是屏幕/界面与视图模型，功能特性之间是独立的，互相之间不会形成依赖，但可依赖于核心层（注入系统实现）
* （可选）Component 组件，主要负责将功能特性中的各种界面抽象化通用实现，以便重复利用与统一修改，包含颜色、结构、字体大小、各种按钮与输入框规范
* Core 核心层，负责集合各种所需的抽象实现，如Model数据模型、数据仓库、数据获取方法、数据存储结构等
* （可选）SystemImpl 系统实现，负责完成核心层所需的各种网络与本地接口调用与存储，因为不同操作系统如安卓、苹果、Window、Mac、Web会有不同的系统接口，需要完成对应实现