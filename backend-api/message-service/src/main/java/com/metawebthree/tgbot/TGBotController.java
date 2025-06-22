package com.metawebthree.tgbot;

import jakarta.annotation.PostConstruct;

public class TGBotController {

    @PostConstruct
    public void init() {
        System.out.println("TGBotController init");
        // @TODO Telegram Bot API Initialization
        // TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
    }
}
