import * as redis from "redis";

//  todo 添加了redis地址会提示Invalid URL
// const redisURL = process.env.REDIS_URL ?? "";
const redisURL = "";
let client: ReturnType<typeof redis.createClient> = null;

export function redisClientProvider(): typeof client {
    if (client !== null) {
        return client;
    }
    client = redis.createClient({
        url: redisURL,
        password: "123123"
    });
    client.connect()
    client.on("error", err => {
        console.log("redis has problem: " + JSON.stringify(err));
    });
    return client;
}
