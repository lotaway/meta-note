# 文件夹同步

通过使用api获得用户授权之后，可以持续对用户授权的文件夹进行读写，创建任意文件的能力，达成以用户硬盘（指定文件夹）作为项目根目录在线使用Web编辑器的目的。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Create File Example</title>
</head>
<body>
    <h1>Create a File</h1>
    <label for="filename">Enter filename:</label>
    <input type="text" id="filename" placeholder="example.txt">
    <br><br>
    <label for="filecontent">Enter content:</label>
    <textarea id="filecontent" rows="4" cols="50" placeholder="File content..."></textarea>
    <br><br>
    <button id="createFile">Create File</button>

    <script>
        let directoryHandle;

        // 初始化：检查是否已有持久性权限
        async function init() {
            const savedHandle = await getDirectoryHandle();
            if (savedHandle) {
                directoryHandle = savedHandle;
            }
        }

        // 获取持久性存储的目录句柄
        async function getDirectoryHandle() {
            const handles = await navigator.storage.getDirectory();
            for await (const handle of handles.values()) {
                if (handle.kind === 'directory') {
                    return handle;
                }
            }
            return null;
        }

        // 请求持久性权限
        async function requestPersistentPermission() {
            try {
                const handle = await window.showDirectoryPicker();
                await verifyPermission(handle, true);
                await navigator.storage.persist();
                directoryHandle = handle;
            } catch (error) {
                console.error('Permission request failed:', error);
            }
        }

        // 验证并请求权限
        async function verifyPermission(fileHandle, withWrite) {
            const options = {};
            if (withWrite) {
                options.mode = 'readwrite';
            }
            if ((await fileHandle.queryPermission(options)) === 'granted') {
                return true;
            }
            if ((await fileHandle.requestPermission(options)) === 'granted') {
                return true;
            }
            return false;
        }

        document.getElementById('createFile').addEventListener('click', async () => {
            const filename = document.getElementById('filename').value;
            const content = document.getElementById('filecontent').value;

            if (!filename) {
                alert('Please enter a filename.');
                return;
            }

            if (!directoryHandle) {
                await requestPersistentPermission();
            }

            if (!directoryHandle) {
                alert('Failed to get directory permission.');
                return;
            }

            try {
                // 创建或获取文件句柄
                const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });

                // 创建可写入流
                const writable = await fileHandle.createWritable();

                // 写入内容到文件
                await writable.write(content);

                // 关闭流
                await writable.close();

                alert('File created successfully.');
            } catch (error) {
                console.error('Error:', error);
                alert('Failed to create file.');
            }
        });

        // 初始化检查持久性权限
        init();
    </script>
</body>
</html>
```