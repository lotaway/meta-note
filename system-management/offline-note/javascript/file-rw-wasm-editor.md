# 利用wasm实现读写本地项目的在线编辑器

本篇内容是通过AI-ChatGPT问答和查阅相关文档得到的答案。
起因是看到[在线Vscode](https://vscode.dev/)和[RemixIde](https://remix.ethereum.org/)都实现了在线读取用户电脑文件夹作为项目根目录，达成读取、创建、修改、删除该目录下所有文件、文件夹的功能。
而在浏览器中因为安全性问题，光凭javascript本身是做不到这么完整的功能，最多只能读写单个文件，还不是无缝衔接和高兼容性。
其中后者是使用Nodejs开发了[Remixd](https://www.npmjs.com/package/@remix-project/remixd)的浏览器插件来实现，而前者就是利用近年发展起来的wasm/wasi来实现的。
由于wasm/wasi更具有光明的前途，本文也是主要结合AI探索这项功能的基础实现方式。

1. 创建一个新的Rust项目：

```bash
cargo new --lib wasm-example
cd wasm-example
```

2. 在Cargo.toml文件中添加依赖项：

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
```

3. 创建一个名为lib.rs的文件，并添加以下代码：

```rust
use std::fs;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn read_folder(folder_path: &str) -> Result<Vec<String>, JsValue> {
    let entries = fs::read_dir(folder_path)
        .map_err(|err| JsValue::from_str(&format!("Error reading folder: {}", err)))?;

    let file_names: Vec<String> = entries
        .filter_map(|entry| {
            entry.ok().and_then(|e| e.file_name().into_string().ok())
        })
        .collect();

    Ok(file_names)
}

#[wasm_bindgen]
pub fn write_file(file_path: &str, content: &str) -> Result<(), JsValue> {
    fs::write(file_path, content)
        .map_err(|err| JsValue::from_str(&format!("Error writing file: {}", err)))?;

    Ok(())
}
```

4. 在项目根目录下运行以下命令，将Rust代码编译为Wasm模块：

```bash
wasm-pack build --target web --out-name wasm --out-dir ./static
```

5. 在前端HTML文件中引入生成的Wasm模块，并使用JavaScript与Wasm进行交互：

```html

<body>
<input type="file" id="folderInput" webkitdirectory directory multiple>
<ul id="fileList"></ul>

<input type="text" id="fileNameInput" placeholder="文件名">
<textarea id="fileContentInput" placeholder="文件内容"></textarea>
<button id="writeButton">写入文件</button>

<script>
    import init, {read_folder, write_file} from './static/wasm.js';

    async function run() {
        await init();

        const folderInput = document.getElementById('folderInput');
        const fileListElement = document.getElementById('fileList');

        folderInput.addEventListener('change', async (event) => {
            const files = event.target.files;
            fileListElement.innerHTML = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const listItem = document.createElement('li');
                listItem.textContent = file.name;
                fileListElement.appendChild(listItem);

                const fileContent = await readFile(file);
                console.log(fileContent);
            }
        });

        const writeButton = document.getElementById('writeButton');
        writeButton.addEventListener('click', async () => {
            const fileName = document.getElementById('fileNameInput').value;
            const fileContent = document.getElementById('fileContentInput').value;

            await writeFile(fileName, fileContent);
        });
    }

    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target.result);
            };
            reader.onerror = (e) => {
                reject(e.target.error);
            };
            reader.readAsText(file);
        });
    }

    async function writeFile(fileName, fileContent) {
        try {
            await write_file(fileName, fileContent);
            console.log('File written successfully');
        } catch (error) {
            console.error('Error writing file:', error);
        }
    }

    run();
</script>
</body>
```

你可以使用JavaScript中的File API来实现以编程方式触发文件夹选择的行为，而不是通过点击<input type="file">元素。

以下是一个示例代码，演示如何使用JavaScript创建一个<input type="file">元素，并通过点击<a>标签来触发文件夹选择：

```html

<body>
<a href="#" id="folderLink">选择文件夹</a>
<ul id="fileList"></ul>
<script>
    const folderLink = document.getElementById('folderLink');
    const fileListElement = document.getElementById('fileList');

    folderLink.addEventListener('click', (event) => {
        event.preventDefault();

        const folderInput = document.createElement('input');
        folderInput.type = 'file';
        folderInput.webkitdirectory = true;
        folderInput.directory = true;
        folderInput.multiple = true;

        folderInput.addEventListener('change', (event) => {
            const files = event.target.files;
            fileListElement.innerHTML = '';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const listItem = document.createElement('li');
                listItem.textContent = file.name;
                fileListElement.appendChild(listItem);
            }
        });

        folderInput.click();
    });
</script>
</body>
```

当用户选择文件夹后，会触发change事件，我们可以在事件处理程序中获取选择的文件列表，并将文件名显示在页面上。