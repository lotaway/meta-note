process.on("message", message => {
    console.log("子进程收到信息：" + message);
    process.send("我是子进程，我收到了！！");
});
