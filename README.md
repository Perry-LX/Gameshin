# GAMESHIN GAME HUB

像素风格游戏导航中心 — 一个展示和链接多款游戏的入口网站。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建工具
- **React Router v7** 客户端路由
- 纯 CSS 像素风格主题设计
- Canvas 游戏渲染

## 特性

- **像素风格 UI** — 使用 Press Start 2P 像素字体，锐利边框，阶梯动画
- **蒸汽朋克配色** — 深蓝灰底色 + 琥珀橙主色，配合网格背景和渐变光晕
- **分类筛选** — 按游戏状态筛选：热玩中 / 试玩版 / 即将上线
- **响应式布局** — 适配桌面端、平板和手机
- **游戏卡片** — 每张卡片展示游戏图标、标题、描述、标签和状态
- **贪吃蛇游戏** — 内置经典 Snake Classic，Canvas 像素渲染，支持缩放调节（50%–200%），本地最高分持久化
- **俄罗斯方块** — 内置经典 Tetris，标准 22×10 棋盘，7-bag 随机生成器，旋转墙踢，平滑掉落动画，NEXT 预览
- **中国象棋** — 内置 Chinese Chess，复用传统棋盘与棋子资源，支持人机对弈、残局挑战、悔棋、重开与棋盘换肤
- **中国象棋Plus** — 基于 vschess 风格重构的增强版中国象棋界面，支持 AI 对弈、人人对战、残局挑战、右侧顶部走棋记录、下拉设置面板与换肤
- **Pixel Jumper** — 内置横向像素跳跃游戏，包含 18 个关卡、三类怪物、任务目标与分段地图区域切换

## 项目结构

```text
Gameshin/
├── public/
│   └── chess/
│       ├── audio/            # 中国象棋 / 中国象棋Plus 音效资源
│       ├── data/             # 开局库数据
│       └── img/              # 棋盘、棋子、皮肤资源
├── src/
│   ├── types/index.ts        # 类型定义
│   ├── data/games.ts         # 游戏数据配置
│   ├── games/
│   │   ├── chess/
│   │   │   ├── config.ts     # 中国象棋棋盘/棋子/皮肤配置
│   │   │   ├── engine.ts     # 中国象棋引擎与 AI 逻辑
│   │   │   ├── openings.ts   # 开局库加载
│   │   │   ├── presets.ts    # 残局挑战数据
│   │   │   └── types.ts      # 中国象棋类型定义
│   │   └── pixel-jumper/
│   │       ├── chunks.ts     # Pixel Jumper 分段区域与视口计算
│   │       ├── constants.ts  # Pixel Jumper 常量
│   │       ├── entities.ts   # 玩家、怪物、子弹更新逻辑
│   │       ├── gameState.ts  # 关卡运行时状态管理
│   │       ├── levels.ts     # Pixel Jumper 18 个关卡配置
│   │       ├── physics.ts    # 平台碰撞与踩踏判定
│   │       ├── renderer.ts   # Pixel Jumper Canvas 渲染
│   │       ├── tasks.ts      # 任务进度管理
│   │       └── types.ts      # Pixel Jumper 类型定义
│   ├── pages/
│   │   ├── SnakeGame.tsx     # 贪吃蛇游戏页面（支持缩放 50%–200%）
│   │   ├── SnakeGame.css     # 贪吃蛇游戏样式
│   │   ├── TetrisGame.tsx    # 俄罗斯方块游戏页面
│   │   ├── TetrisGame.css    # 俄罗斯方块游戏样式
│   │   ├── ChessGame.tsx     # 中国象棋游戏页面
│   │   ├── ChessGame.css     # 中国象棋游戏样式
│   │   ├── ChessPlusGame.tsx # 中国象棋Plus 游戏页面
│   │   ├── ChessPlusGame.css # 中国象棋Plus 游戏样式
│   │   ├── PixelJumperGame.tsx # 像素风格跳跃游戏页面
│   │   └── PixelJumperGame.css # 像素风格跳跃游戏样式
│   ├── components/
│   │   ├── Header.tsx        # 页头 + 导航
│   │   ├── GameCard.tsx      # 游戏卡片（支持内部路由与外部链接）
│   │   ├── GameList.tsx      # 卡片网格
│   │   └── Footer.tsx        # 页脚
│   ├── App.tsx               # 路由入口（首页 / 游戏页）
│   └── index.css             # 全局像素风格样式
├── index.html
├── package.json
└── vite.config.ts
```

## 快速开始

```bash
npm install
npm run dev
```

## 内置游戏

### Snake Classic
- 经典贪吃蛇
- 支持键盘控制
- 本地最高分记录
- 支持缩放 50%–200%

### Tetris Battle
- 标准 22×10 俄罗斯方块
- 7-bag 随机方块生成
- NEXT 预览
- 平滑掉落动画

### Chinese Chess
- 经典中国象棋棋盘与棋子贴图
- 支持人机对弈
- 支持残局挑战
- 支持悔棋、重开、棋盘换肤
- 使用 Canvas 渲染棋盘，AI 搜索逻辑来自迁移后的 `Chess-master`

### 中国象棋Plus
- 基于 vschess 风格重构的增强版界面
- 复用现有中国象棋 AI 与残局能力
- 支持人机对弈、人人对战、残局挑战三种模式
- 右侧顶部展示完整走棋记录
- 设置区改为下拉列表，可切换模式、难度、残局与皮肤
- 保留悔棋、重开、换肤与局面信息面板

### Pixel Jumper
- 横向像素平台跳跃玩法，共 18 个关卡
- 每关都包含普通巡逻怪、范围追击怪、间歇射击怪
- 玩家可通过从上方踩踏击杀怪物，侧碰或被子弹命中则失败
- 部分关卡包含收集或击杀任务，任务完成后终点才会解锁
- 关卡地图宽于当前视图，按玩家移动和视口宽度切换分段区域显示
- 支持连续推进、失败重试和全程最佳时间记录

## 添加新游戏

编辑 `src/data/games.ts`，添加新条目。内部游戏（`url` 以 `/` 开头）使用 SPA 路由，外部游戏使用新窗口打开：

```ts
{
  id: 'game-id',
  title: '游戏名称',
  description: '游戏描述',
  url: '/game/your-game',
  tags: ['标签1', '标签2'],
  icon: '🎮',
  status: 'active',
  color: '#ff6b1a',
}
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。