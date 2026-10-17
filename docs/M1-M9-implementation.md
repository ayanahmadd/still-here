> Historical incremental design record. The later user-requested cognitive UI, footer removal, local storage, and naming changes supersede earlier entrance/footer details below. See [COMPLETION.md](COMPLETION.md) and [TEAM-HANDOFF.md](TEAM-HANDOFF.md) for the current delivery.

# Memory Garden — M1–M9 增量修改记录

应用页面仅显示英文。下方中文用于评审与文案对照，不进入网页界面。此次以修改前的本地英文版本为基线；不更换原有水彩背景、配色变量、字体、类名与主要组件结构。

审阅顺序：先看 [实际代码 diff](./M1-M9.patch)，再看本文说明。GitHub 尚未上传，等待用户查看本地效果。

## 1. 现状复述与理解

1. Next.js 的根页面加载 GardenApp，界面已经是英文。
2. 已有 entrance、topics、garden 三个页面状态。
3. 已有水彩空草地，首次不放预置花朵。
4. 已有 AI 气泡、语音输入、转写确认、文字输入及朗读。
5. 已有独立家属入口、逐次授权与补充来源署名。
6. 已有保存、收藏、故事回看、导出和删除。
7. 原生长 stage 为 0–5，旧保存逻辑会跳到完整花朵。
8. React useState/useRef 管理状态，localStorage 保存故事。
9. 保留纸色 #f9f7ef、文字 #31463a、绿色 #45664d；当前标题 Georgia、正文 Arial。
10. 队友模块尚未完成，仅接入三个导航与诚实的待接入页面；真实电话通过用户填写的联系人与 tel: 链接提供。

已确认：提前结束保存原阶段，之后可继续；话题可整组三个更换；先本地预览，确认后再上传。

## 2. 变更影响清单

| 编号 | 文件/组件 | 类型 | 风险与处理 |
|---|---|---|---|
| M1 | GardenApp、garden.css | 修改状态与显示条件 | 入口只保留标题、邀请、按钮；减少动效时不强制等待 |
| M2 | GardenApp、garden.ts | 状态扩展 | empty 不渲染植物；不覆盖个人故事 |
| M3 | GardenApp、garden.ts、garden.css | 状态扩展 | 防止连点；选择前不启动 AI 对话、朗读或麦克风 |
| M4 | GardenFlower、garden.ts | 状态扩展 | 首答只有 seed；所有回看入口也使用真实 stage |
| M5 | garden.ts、GardenFlower、GardenApp | 状态扩展 | 旧 0–5 数据一次迁移；保存和家属补充不推进主阶段 |
| M6 | GardenActivities、GardenActivityIcon、garden-activities、activities/[activity] | 新增 | 模块未完成，明确 Coming soon；不伪造小游戏 |
| M7 | GardenApp | 修改标签 | 独立 For family 入口，不放进活动卡片 |
| M8 | GardenApp、garden-contact | 修改与新增 | 沉默停止追问；电话须主动点击，设备需有拨号能力 |
| M9 | 新增组件样式、现有输入/弹窗 | 增量调整 | 保留原有语音/文字交互，支持键盘、减少动效与英文标签 |

## 3. 逐条实现

### M1 — 进入页

复用 entrance-content、garden-primary。新增 entering 与清理用 transitions ref；点击后 750ms 轻淡出，再进入话题页。入口只保留 Memory Garden、温柔邀请和 Enter the garden。原收藏与设置移至进入后的原位置；没有删除功能。减少动效模式直接切换。

### M2 — 空花园

stage=0 命名为 empty，不渲染 GardenFlower。保留原空草地艺术，加轻薄雾感、土壤柔影和三点低亮度粒子；粒子以 9 秒循环缓慢浮动。旧个人花朵保留，首次不植入虚构示例。

### M3 — 三气泡与更换

新增 topicSet、selectedTopic；九个已有/新增邀请组成三组，每次只显示三个。Explore three other ideas 顺序轮换整组，不开启对话。入场每个间隔 400ms，淡入上浮 10px、持续 650ms。选择后其他两个在 450ms 内淡出；选中气泡呈现对应问题，650ms 后承接到既有 AI 气泡。未选中前只显示话题邀请，不朗读、不调用对话、不打开麦克风。已有未完成故事可继续；另选话题会先按原阶段保存已有讲述。

### M4 — 首答

复用 GardenFlower，仅增加状态判断。首次有效确认表达进入 seed：小种子与极淡光晕；第二个有效细节才进入 sprout。完整 PNG 仅用于 bloom。首次语音识别尚未确认时保持 empty。

### M5 — 渐进成长与保存

保留 stage 变量，增加 GROWTH_STAGES、growthVersion=2、sensoryDetails。每次确认的新有效表达最多加一级；重复与简短应答不会推进。基础文本归一化不是语义或事实判断。感官关键词为辅助侧枝，不推进额外主阶段；家属只增加独立小花苞，必须逐次同意。

finishMemory 只保存状态：stage<7 为 paused，stage=7 为 bloomed，不改 stage。收藏、主场景、故事详情均传入实际 stage。Continue this story 从原阶段继续，麦克风保持关闭。旧阶段 0/1/2/3/4/5 分别映射为 0/2/4/5/6/7，避免已开放花朵回退或重复迁移。

保留原生长动效 1.8 秒与绽放动效 3.5 秒，不增加积分或正确性反馈。

### M6 — 侧栏与三个入口

GardenActivities 默认收起。右边缘叶形把手，桌面 48×64px、手机 44×56px；不自动展开。展开动画 400ms；复用 GardenDialog 的原生焦点管理、Escape 和现有纸色。

三个原创 SVG 图标采用相同 48px 画布、1.6px 圆头线条和现有纸色/鼠尾草色：Picture Together 为叠放照片，Familiar Sounds 为扬声器与声波，Little Notes 为折角便笺与小叶子。SVG 为装饰，卡片文字提供可访问名称。

| 名称 | 路由 | 当前状态 |
|---|---|---|
| Picture Together | /activities/picture-together | 导航已接入，队友模块待接入 |
| Familiar Sounds | /activities/familiar-sounds | 导航已接入，队友模块待接入 |
| Little Notes | /activities/little-notes | 导航已接入，队友模块待接入 |

卡片包含名称、说明、人群标签与 Coming soon。子页面顶部及正文均有 Return to the garden；返回时恢复花园，已有讲述以暂停态保留。没有游戏大厅、积分或 AI 推销。切换模块前停止录音/朗读并暂停当前故事。

### M7 — 陪伴模式

原 companion-toggle、family-panel 与逐次授权流程保留。入口显示 For family，辅助名称 Family companion tips。活动侧栏中没有家属授权卡片。

### M8 — 停止、休息与联系人

保留原有 30 秒节奏：会话中无输入 30 秒改为真正暂停；文字编辑与识别文本更新会重置计时。话题选择页不计时、不追问。拒绝、困惑、不适也暂停，取消录音、朗读和待返回的 AI 响应。花朵及 stage 不消失、不回退，无红色警报或惩罚动画。

暂停页可休息或联系已保存的人；未设置时进入联系人表单。用户填写真实姓名和电话，保存于独立本机 key，不放入 AI 输入。Call {name} 仅在主动点击时打开 tel: 链接；不自动拨号或声称电话已接通。可编辑、移除联系人。不擅自读取设备通讯录。

### M9 — 文案与无障碍

网页仅英文，用户自己输入的原始讲述不自动翻译。没有测验措辞。保留语音优先、转写确认、文字替代、大按钮、原生模态焦点、键盘退出和减少动效。图标按钮都有英文可访问名称。抽屉和子页面沿用原配色/字体，正文 17–23px；不改变全局字体或色彩变量。

## 4. 生长状态机

```text
empty(0)
  -- 第一段有效且确认的表达 --> seed(1)
  -- 下一个有效细节 -------> sprout(2)
  -- 下一个有效细节 -------> stem(3)
  -- 下一个有效细节 -------> leaf(4)
  -- 下一个有效细节 -------> bud(5)
  -- 下一个有效细节 -------> petal(6)
  -- 下一个有效细节 -------> bloom(7)

感官细节：本次主阶段最多 +1，同时追加侧枝。
家属补充：主阶段 +0，独立小花苞；先获当次同意。
重复/简短应答/停顿/拒绝/不适/保存：主阶段 +0。
暂停与提前保存：保持 stage；继续只改变会话状态。
bloom 之后不再增加主阶段。
```

一个输入最多推进一次，不会因识别中间结果、保存、计时器或 AI 回复推进。首答最高为 seed，完整花朵须逐级到达 bloom。生长次数不超过被接受的有效细节数量；不要求用户完成所有阶段。

## 5. 组件清单

| 组件/文件 | 复用或新建 | 改动 |
|---|---|---|
| GardenApp | 复用 | 在原结构上增加状态与条件显示，保留输入、家属、故事与设置 |
| GardenFlower | 复用 | 八态、sensoryDetails；保留 kind/stage/familyBud |
| GardenDialog | 复用 | 只新增可选 className prop |
| garden.css | 复用 | 追加新状态和抽屉样式，原变量/字体不变 |
| garden.ts | 复用 | 状态与数据兼容、话题池 |
| GardenActivities | 新建 | 折叠抽屉与导航卡片 |
| GardenActivityIcon | 新建 | 三个配套 SVG 图标 |
| garden-activities.ts | 新建 | 三个队友模块入口配置 |
| activities/[activity]/page.tsx | 新建 | 诚实的待接入页面和返回花园 |
| garden-contact.ts | 新建 | 独立本机联系人保存与电话校验 |

## 6. 新增/修改微文案（英文界面 / 中文评审对照）

已存在且未改的语音、文字及家属授权文案不重复列出。下表覆盖本轮新增或替换的界面文案；{name}/{phone} 为用户提供的内容。

| English — displayed in app | 中文 — 仅评审对照 |
|---|---|
| Come as you are. There is time for your story. | 自在地来吧，我们有时间听你讲。 |
| A little place to begin. | 从一点点开始。 |
| Explore three other ideas | 换三个话题看看 |
| Choose only if something feels close to you. | 只选让你觉得亲近的话题。 |
| Take your time. A little thought is enough. | 慢慢来，一点印象就很好。 |
| Something delicious | 熟悉的美味 |
| A meal, a scent, a familiar kitchen | 一顿饭、一缕香气、一间熟悉的厨房 |
| What is a food you enjoy sharing with someone? | 可以聊聊你喜欢和别人一起吃的食物吗？ |
| A familiar song | 熟悉的歌 |
| A tune, a voice, a little melody | 一段曲调、一个声音、一点旋律 |
| What is a song you enjoy listening to? | 可以聊聊你喜欢听的一首歌吗？ |
| A little fresh air | 去外面坐坐 |
| A walk, a view, a peaceful place | 一段散步、一处风景、一个安静的地方 |
| What is an outdoor place you enjoy spending time in? | 可以聊聊你喜欢待的一处户外地方吗？ |
| Something you treasure | 珍爱的物件 |
| An object with a little story | 一件带着小故事的物件 |
| What is an object you would like to tell me about? | 你愿意跟我讲讲哪件物品呢？ |
| A favorite season | 喜欢的季节 |
| A time of year that feels special | 一年中让你觉得特别的一段时候 |
| What do you enjoy about a season you like? | 你喜欢的季节里，什么让你觉得舒服？ |
| A small pleasure | 生活里的小欢喜 |
| Something you like doing in your own time | 闲下来时，你喜欢做的一件小事 |
| What is something you enjoy doing in a quiet moment? | 安静的时候，你喜欢做些什么呢？ |
| Save for another day | 留着改天再聊 |
| Saved just as it is. You can return and continue whenever you like. | 就按现在的样子留下，想接着讲时再回来。 |
| Your flower is here, with the words you shared. | 你的花和你分享的话，都留在这里。 |
| Continue this story | 接着讲这段故事 |
| For family | 给家人 |
| Family companion tips | 家人陪伴提示 |
| Garden activities | 花园里的其他角落 |
| Other quiet corners | 其他安静的角落 |
| Something else to explore, whenever you choose. | 想换个方式坐一坐时，可以来这里看看。 |
| With a companion | 和陪伴者一起 |
| Families & friends | 家人与朋友 |
| Coming soon | 正在准备中 |
| Close these corners | 收起这些角落 |
| A QUIET CORNER · COMING SOON | 安静的角落 · 正在准备中 |
| This quiet corner is still being prepared. Your garden is here whenever you would like to return. | 这个角落还在准备，想回来时，花园一直在这里。 |
| Return to the garden | 回到花园 |
| Add someone to call | 添加一位可以联系的人 |
| Call {name} | 打给{name} |
| Opens your device’s calling app for {phone}. Review the number before calling. | 打开设备的拨号应用，号码是{phone}。拨打前可以先确认。 |
| Someone close to you. | 亲近的人。 |
| Add someone you would like to call when you want company. | 添加一位想有人陪伴时可以联系的人。 |
| Edit contact | 修改联系人 |
| Add a contact | 添加联系人 |
| Remove contact | 移除联系人 |
| Contact details stay on this device and are never included in AI conversations. Calls only begin when you choose to call. | 联系人只保存在这台设备，不会交给 AI。是否拨打由你决定。 |
| Someone you can call. | 一位可以联系的人。 |
| Choose a family member, friend, or someone you trust. We will never call them automatically. | 选择一位家人、朋友或信任的人。我们不会自动拨打。 |
| Contact name | 联系人姓名 |
| Phone number | 电话号码 |
| Include the country code when needed. This opens the calling app on your device; a calling app or phone service is required. | 需要时请填写国家区号。这会打开设备上的拨号应用，需要可用的拨号应用或电话服务。 |
| Save contact | 保存联系人 |
| Not now | 暂时不用 |
| Please add a name and a phone number with 7–15 digits. Include the country code when needed. | 请填写姓名和 7–15 位数字的电话号码，需要时加上国家区号。 |
| This contact could not be saved on this device. Please try again. | 暂时无法在这台设备保存联系人，可以再试一次。 |
| This contact could not be removed. Please try again. | 暂时无法移除联系人，可以再试一次。 |
| Picture Together | 一起看照片 |
| Share a picture and a little moment together. | 分享一张照片，一起度过一点时光。 |
| Familiar Sounds | 熟悉的声音 |
| Spend a little time with sounds that feel close to you. | 和让你觉得亲近的声音待一会儿。 |
| Little Notes | 小小便笺 |
| Leave a few kind words for someone close to you. | 给亲近的人留几句温柔的话。 |

## 7. 验收 checklist

- [x] M1：进入页仅标题、邀请和主按钮，无花、无其他入口；750ms 过渡，减少动效除外。
- [x] M2：首次进入植物数 0，不用已绽放花作背景。
- [x] M3：仅三个气泡，400ms 错峰；可换整组；选择后才进入对话。
- [x] M4：首答 seed，未确认语音不生长，首答不出现完整花。
- [x] M5：逐级推进，保存不跳级，原阶段可继续；家属不推进主阶段。
- [x] M6：默认收起、三个图标入口与子页面返回；队友真正游戏仍待接入。
- [x] M7：For family 与活动入口分离，逐次同意保留。
- [x] M8：无输入、拒绝和不适暂停；不回退；联系人电话链接由用户主动启动。
- [x] M9：网页全英文、键盘与减少动效，语音/文字原交互保留。

验证边界：自动化测试不验证临床效果；真实麦克风、真实 AI 内容与实际拨号未进行。电话链接已检查，但不会替用户发起电话。队友游戏尚未完成，此次只实现图标、入口、待接入页面与返回导航。

## 8. 需要确认的问题

实现不再依赖新的设计确认。当前只等用户查看本地预览后的反馈，再决定上传 GitHub。队友提供游戏代码或正式路由后，将三个占位页面接入对应模块；不把未完成游戏显示为可用。

## Entrance refinement after local review

The entrance-only additions are in `app/entrance.css`, imported after `garden.css`. The existing watercolor asset, palette variables, garden screens, and input interactions remain in use.

- Title: 63.8px desktop / 48.4px mobile (+10%), weight 600.
- Shared title/subtitle halo: wide white radial gradient, opacity 0.4.
- Content: 5vw left offset. The entrance image crop keeps the gate and path visible on the right.
- CTA: text only; rgba(60,90,60,0.8), 4px backdrop blur. Fine-pointer hover scales 1.05 with opacity 0.9 and a restrained white border glow.
- Click: centered, low-opacity 650ms ripple; supports keyboard activation.
- Background: nested motion wrapper scales 1 to 1.03 over 20 seconds, ease-in-out, alternate infinite. Keeping the breathing transform on a separate wrapper avoids conflicting with the entry zoom.
- Gate: decorative right-path hover region activates a faint 3.5-second breathing glow; it is not a separate navigation control.
- Entry: the outer background frame scales to 1.07 and fades out over 750ms as a central light expands. A separate `arriving` state keeps that light mounted after switching to the empty garden, then fades it for 550ms to avoid an abrupt cut.
- Reduced motion: disables decorative movement and skips the transition delay.

Production build and browser checks passed at 320, 390, 768, 1024, 1440, and 1920 CSS px. Checks included halo/typography, CTA hover and ripple, gate cue, breathing duration and scale, transition completion, no flowers, keyboard entry, and reduced motion. GitHub publication remains pending user approval.
