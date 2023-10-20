# 通道

在Tokio中，有四种常用的通道类型：
* Oneshot 一次性
* Mpsc 多生产者单消费者
* watch 观察者
* broadcast 广播

这些通道类型在异步编程中用于在任务之间传递消息和共享数据。

## Oneshot 一次性

- Oneshot通道用于生产者和消费者一对一的消息传递，发送者只能发送一次消息，而接收者只能接收一次消息。
- 适用于单次请求和响应的场景，例如等待异步任务完成并获取结果。
- 示例：
```rust
use tokio::sync::oneshot;
use tokio::task;

async fn worker(tx: oneshot::Sender<String>) {
    let result = "Hello, world!".to_string();
    let _ = tx.send(result);
}

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();
    let _ = task::spawn(worker(tx));

    if let Ok(result) = rx.await {
        println!("Received: {}", result);
    }
}
```

## mpsc 多生产者单消费者

- Mpsc通道允许多个任务同时发送消息，但只有一个任务可以接收消息。
- 适用于多个任务向单个任务发送消息的场景，例如事件发布-订阅模型。
- 如果使用while循环await等待的方式，消费者会持续监听直到所有生产者都完成发送为止
- 示例：
```rust
use tokio::sync::mpsc;
use tokio::task;

async fn worker(mut rx: mpsc::Receiver<String>) {
    while let Some(message) = rx.recv().await {
        println!("Received: {}", message);
    }
}

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(10);
    let _ = task::spawn(worker(rx));

    let _ = tx.send("Hello".to_string()).await;
    let _ = tx.send("World".to_string()).await;
}
```

## watch 观察者，单生产者多消费者

- 观察者通道用于多个任务观察某个事件的状态，并在事件发生时收到通知，例如任务状态通知。
- 示例：
```rust
use tokio::sync::watch;
use tokio::task;

async fn worker(tx: watch::Sender<String>) {
    let _ = tx.send("Task completed".to_string());
}

#[tokio::main]
async fn main() {
    let (tx, rx) = watch::channel("");
    let _ = task::spawn(worker(tx));

    if let Ok(message) = rx.recv().await {
        println!("Received: {}", message);
    }
}
```

## broadcast 广播，多生产者多消费者

- 广播通道用于将消息广播给多个观察者任务。
- 适用于将消息广播给多个任务的场景，例如实时数据更新。
- 示例：
```rust
use tokio::sync::broadcast;
use tokio::task;

async fn worker(tx: broadcast::Sender<String>) {
    let _ = tx.send("Message 1".to_string());
    let _ = tx.send("Message 2".to_string());
}

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel(10);
    let _ = task::spawn(worker(tx.clone()));
    let _ = task::spawn(worker(tx.clone()));

    let mut rx = tx.subscribe();
    while let Ok(message) = rx.recv().await {
        println!("Received: {}", message);
    }
}
```