# 延迟求值类型注解，使 `X | None` / `dict[str, Any]` 在 Python 3.9 及以下也能正常导入
from __future__ import annotations

import requests
from typing import Any, Callable


class XgatherClient:
    BASE_URL = "https://mes-y.com/api/v1"

    def __init__(self, timeout: int = 30):
        self.session = requests.Session()
        self.timeout = timeout

    def _request(self, endpoint: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """内部通用GET请求封装，处理状态码"""
        url = f"{self.BASE_URL}{endpoint}"
        resp = self.session.get(url, params=params, timeout=self.timeout)

        if resp.status_code == 404:
            raise Exception("资源不存在 404")
        elif resp.status_code == 410:
            raise Exception("帖子已被移除 410")
        elif resp.status_code == 422:
            raise Exception("参数或者游标无效 422")
        resp.raise_for_status()
        return resp.json()

    def list_users(self, q: str | None = None, sort: str | None = None, limit: int = 20, next_cursor: str | None = None):
        """
        GET /api/v1/users
        分页浏览用户，支持搜索、排序
        :param q: 搜索用户名/昵称
        :param sort: 排序：粉丝数、资料更新时间、用户名
        :param limit: 1~100
        :param next_cursor: 分页游标
        """
        params: dict[str, Any] = {
            "limit": max(1, min(limit, 100))
        }
        if q:
            params["q"] = q
        if sort:
            params["sort"] = sort
        if next_cursor:
            params["next_cursor"] = next_cursor
        return self._request("/users", params=params)

    def get_user_by_username(self, username: str):
        """
        GET /api/v1/users/by-username/{username}
        根据用户名查询用户，可带@，不区分大小写
        """
        return self._request(f"/users/by-username/{username}")

    def get_user_tweets(self, user_id: str, has_media: bool | None = None,
                        media_type: str | None = None, include_media: bool = True,
                        limit: int = 20, next_cursor: str | None = None):
        """
        GET /api/v1/users/{user_id}/tweets
        获取用户帖子
        """
        params: dict[str, Any] = {
            "limit": max(1, min(limit, 100)),
            "include_media": include_media
        }
        if has_media is not None:
            params["has_media"] = has_media
        if media_type:
            params["media_type"] = media_type
        if next_cursor:
            params["next_cursor"] = next_cursor
        return self._request(f"/users/{user_id}/tweets", params=params)

    def get_user_following(self, user_id: str, limit: int = 20, next_cursor: str | None = None):
        """
        GET /api/v1/users/{user_id}/following
        获取用户关注列表
        """
        params: dict[str, Any] = {"limit": max(1, min(limit, 100))}
        if next_cursor:
            params["next_cursor"] = next_cursor
        return self._request(f"/users/{user_id}/following", params=params)

    def list_tweets(self, limit: int = 20, next_cursor: str | None = None,
                    include_media: bool = True, **kwargs: Any):
        """
        GET /api/v1/tweets
        全局帖子列表，批量读取入口
        :param kwargs: 其他过滤参数，如用户、媒体状态等
        """
        params: dict[str, Any] = {
            "limit": max(1, min(limit, 100)),
            "include_media": include_media,
            **kwargs
        }
        if next_cursor:
            params["next_cursor"] = next_cursor
        return self._request("/tweets", params=params)

    def get_tweet_detail(self, tweet_id: str):
        """
        GET /api/v1/tweets/{tweet_id}
        获取单条帖子详情
        """
        return self._request(f"/tweets/{tweet_id}")

    def fetch_all(self, func: Callable[..., dict[str, Any]], **kwargs: Any) -> list[Any]:
        """
        自动分页迭代获取全部数据
        example: fetch_all(client.list_tweets, limit=50)
        """
        all_items: list[Any] = []
        cursor = None
        while True:
            resp = func(next_cursor=cursor, **kwargs)
            data_list = resp.get("data", [])
            all_items.extend(data_list)
            cursor = resp.get("next_cursor")
            if not cursor:
                break
        return all_items


if __name__ == "__main__":
    # ----------------使用示例----------------
    client = XgatherClient()

    # 1.获取全局最近5条帖子，等价文档curl示例
    try:
        res = client.list_tweets(limit=5)
        print("全局帖子列表：")
        for item in res["data"]:
            print(f"id: {item.get('id')}, text: {(item.get('text') or '')[:80]}")
    except Exception as e:
        print(f"请求异常: {e}")

    # 2.根据用户名获取用户信息
    # user = client.get_user_by_username("someuser")
    # print(user)

    # 3.获取该用户的全部帖子（自动分页）
    # all_tweets = client.fetch_all(client.get_user_tweets, user_id=user["id"], limit=100)
    # print(f"一共获取帖子 {len(all_tweets)}")

    # 4.获取单条帖子详情
    # tw = client.get_tweet_detail("123456789")
    # print(tw)
