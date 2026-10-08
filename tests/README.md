# v4 测试复现

游戏运行不需要这些依赖。Node 用于纯模型验证；Python Playwright 用于浏览器回归，Pillow 仅用于转换截图。

```bash
node tests/depth_model.test.cjs
python -m pip install playwright
python -m playwright install chromium
python tests/static_assets.py
python tests/depth_flow.py
python tests/depth_state.py
python tests/depth_visual.py
python tests/campaign_flow.py
python tests/campaign_storage.py
```

使用已安装的 Chromium 时，可在命令前设置 `SW_BROWSER=/usr/bin/chromium`。例如：

```bash
SW_BROWSER=/usr/bin/chromium python tests/depth_flow.py hospital nightmare
SW_BROWSER=/usr/bin/chromium python tests/depth_state.py
SW_BROWSER=/usr/bin/chromium python tests/depth_visual.py
```

不带参数的 `depth_flow.py` 依次运行五章 × 两档高难度，需要数分钟。也可按 `hospital`、`metro`、`orphan`、`abyss`、`astro` 拆分运行；第二个可选参数为 `abyss` 或 `nightmare`。其中 `abyss` 既是沉没实验站的章节 ID，也是「深渊推演」的强度 ID，参数位置区分含义。

## 各测试检查什么

| 文件 | 范围 |
| --- | --- |
| `depth_model.test.cjs` | 60 种种子 × 2 强度 × 25 区域，共 3000 道生成题；确定性、参考解、按键操作可解性、回签运算、非法状态清洗、数织与真假证言唯一性 |
| `depth_flow.py` | 实际收集残页、返回旧区、填写新增题、完成原题、填写回签；两档高难度的 10 次整章撤离、150 个节点；每个分析输入提交前保存/继续；提前撤离拒绝 |
| `depth_state.py` | 25/45 秒错误扣时、40/60 秒提示规则、六次额度、暂停、草稿转义、长时限恢复、实际 JSON 下载与文件导入、旧 v3 存档继续经典、异常状态清洗与超时 |
| `depth_visual.py` | 桌面截图、320/390 像素竖屏的九类噩梦机关、手机触控、矩阵、横屏布局、2D 摇杆、寻路到分析入口和 WebGL 不可用降级 |
| `campaign_flow.py` | v4 的经典模式回归：全部 25 道原机关、93 个原调查点路径、15 份证词与总终章、原扣罚、经典存档隔离 |
| `campaign_storage.py` | v1 病院存档迁移不复活已清理运行、普通结局与已有完整证据保留；结局部分使用显式测试状态 |
| `static_assets.py` | Python 临时 HTTP 服务下的真实响应及字节核对，包含仓库式 URL 子路径 |

`depth_flow.py` 和 `campaign_flow.py` 由模型或内容数据提供测试答案，再通过实际界面输入；不直接把谜题标成完成。它们不等于真人解谜、难度评估或人类平均通关时长研究。

`depth_visual.py` 为覆盖全部类型，会显式设置前置条件、已开放门锁和资料收集状态。**这些布局测试状态不是通关证明**。其中移动端第一道身份题另通过正常资料收集和表单提交完成。真正的整章依赖链由 `depth_flow.py` 单独验证。

## 环境边界

本次浏览器不能导航到本地 HTTP 地址，因此 Playwright 用 `page.set_content` 加载生产离线版到 `about:blank`。存档测试注入 **仅限测试的内存 localStorage 替身**。生产游戏不含该替身；这不证明真实域名、隐私模式、跨进程或跨设备持久化。

本次环境的 Chromium 实際报告 `WebGL 2 unavailable`。v4 测试不再把“请求 3D 按钮”误记成“3D 渲染通过”；实际覆盖 2D、调查和不可用时的安全降级。未进行 iOS / Android 真机、Safari / Firefox、GPU 帧率和真实 GitHub Pages 发布验收。

`SW_SOFTWARE_GL=1` 可请求软件图形参数，但不保证环境真的提供 WebGL。始终检查日志中的 `Renderer availability`。

## 可选：原版 3D 视觉回归

`campaign_visual.py` 保留为**要求可用 WebGL 2** 的原空间视觉测试，并已指定经典强度。它在当前 v4 环境没有通过运行，不属于本版已验证项目。在具备图形能力的开发环境可单独执行：

```bash
SW_BROWSER=/usr/bin/chromium SW_SOFTWARE_GL=1 python tests/campaign_visual.py
```

该历史脚本的图片/报告仍使用 v3 命名，避免与新增 `depth_visual.py` 的结果混同。重新制作所有场景静态图的工具 `tools/capture_scenes.py` 同样需要有效 WebGL 2 和 Pillow。

测试输出在 `test-results/`，已被 Git 忽略；本次交付的实际报告副本在 `docs/test-results/v4/`。生产部署工作流不会发布测试、攻略或报告。
