# 测试复现

游戏运行不需要下面的依赖；仅开发者运行测试时需要。

```bash
python -m pip install playwright
python -m playwright install chromium
python tests/static_assets.py
python tests/full_flow.py
python tests/visual_and_touch.py
```

已有 Chromium 时，可以指定环境变量 `SW_BROWSER`，不必安装 Playwright 的捆绑浏览器。Linux 软件渲染环境可使用：

```bash
SW_BROWSER=/usr/bin/chromium SW_SOFTWARE_GL=1 xvfb-run -a python tests/full_flow.py
SW_BROWSER=/usr/bin/chromium SW_SOFTWARE_GL=1 xvfb-run -a python tests/visual_and_touch.py
```

以普通用户运行浏览器，不建议为了测试修改系统安全策略。某些容器中 GPU 初始化依赖可用的 X 显示；无 WebGL 的环境可以先运行静态资源检查，但不能将 3D 检查失败等同于谜题逻辑失败。

`full_flow.py` 使用正常界面完成五道机关、三证词及 S 结局；A 结局和 C 超时分支使用显式的测试状态准备；检查错误扣罚、提示扣罚、暂停和视角共享状态。`visual_and_touch.py` 验证真实渲染、键盘行走、拖动环顾、持续撞墙、手机尺寸和 Chromium 触摸输入，另以测试注入模拟 WebGL 缺失与存储拒绝。

为了在无法浏览本地 URL 的环境重现，浏览器检查加载的是生产单文件构建，使用 `page.set_content` 内联到 `about:blank`。序列化测试使用 **仅限测试的内存 localStorage 替身**。这能检查保存 / 恢复的数据逻辑，但不是跨进程、跨设备或真实域名的持久化测试。生产源码不包含替身。

`static_assets.py` 不需要第三方包：它另外启动临时本地 HTTP 服务，逐一核对目录版 HTML 所引用的脚本、样式、图标和菜单图像，并验证仓库子路径下的字节内容。它不是浏览器托管验收，也不是实际 GitHub Pages 部署测试。

测试截图与 JSON 输出写入 `test-results/`，该目录已被 Git 忽略。WebGL 软件渲染速度显著依赖环境，界面稳定等待采用宽松超时；本测试不是帧率基准测试。
