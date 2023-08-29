from cmd import Cmd
import os
import requests
import django


class Mm:
    def __init__(self, radio=1.0):
        self.radio = radio

    def add(self, a, b) -> int:
        return self.radio + a + b


class Status:
    def __init__(self, default_value: bool):
        self.is_start = default_value


def test_file():
    with open("./python.md", encoding="utf-8") as file_run_dev:
        file_run_dev_content = file_run_dev.read()
        print("get file")
        if file_run_dev_content:
            lines = file_run_dev_content.split("\n")
            count = 0
            status = Status(False)
            for line in lines:
                is_start = line.find("```python") > -1
                if status.is_start is True or is_start:
                    print("This is a python line", count, ':', line)
                    count += 1
                if status.is_start is True and line.find("```") > -1:
                    print("\n")
                    status.is_start = False
                if is_start:
                    status.is_start = True
        file_run_dev.close()
    cmd = Cmd(file_run_dev_content)
    requests.get("https://demo.8248.net")
    # os.system("dir")


def decorator_log(fn):
    def wrap(*args):
        print(*args)
        return fn(*args)

    return wrap


class LinkMap:

    @staticmethod
    def from_list(li: list[int]):
        lm = None
        temp = None
        for i in li:
            if temp:
                temp.next = LinkMap(i)
                temp = temp.next
            else:
                lm = LinkMap(i)
                temp = lm
        return lm

    def __init__(self, data, next=None):
        self.data = data
        self.next = next

    def print(self):
        _link_map = self
        while _link_map is not None:
            print(_link_map.data)
            _link_map = _link_map.next

    def tolist(self):
        arr = []
        _link_map = self
        while _link_map is not None:
            arr.append(_link_map.data)
            _link_map = _link_map.next
        return arr


    def reverse(self):
        return link_map_reverse(self)


# @decorator_log
def link_map_reverse(node: LinkMap, new_node: LinkMap = None) -> LinkMap:
    if new_node is None:
        new_node = LinkMap(node.data)
    else:
        new_node = LinkMap(node.data, new_node)
    if node.next is None:
        return new_node
    return link_map_reverse(node.next, new_node)


def test_link_map_reverse():
    result = LinkMap.from_list([1, 3, 5, 7])
    print(result.tolist())
    reverse_result = result.reverse()
    print(reverse_result.tolist())


def get_url():
    print("response url request by Django:" + django.get_version())


def main(args: list[str, ...] = None):
    get_url()


if __name__ == '__main__':
    main()
