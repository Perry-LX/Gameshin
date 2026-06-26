# GAMESHIN GAME HUB

像素风格游戏导航中心 — 一个集成多款小游戏的入口网站。

## 技术栈

- **React 19** + **TypeScript 6**
- **Vite 8** 构建工具
- **React Router v7** 客户端路由（HashRouter）
- 纯 CSS 像素风格主题设计
- Canvas 游戏渲染

## 特性

- **像素风格 UI** — 使用 Press Start 2P 像素字体，锐利边框，阶梯动画
- **蒸汽朋克配色** — 深蓝灰底色 + 琥珀橙主色，配合网格背景和渐变光晕
- **分类筛选** — 按游戏状态筛选：热玩中 / 试玩版 / 即将上线
- **响应式布局** — 适配桌面端、平板和手机
- **游戏卡片** — 每张卡片展示游戏图标、标题、描述、标签和状态
- **6 款内置游戏** — 贪吃蛇、俄罗斯方块、中国象棋、五子棋、国际象棋、像素跳跃

## 内置游戏

### Snake Classic
- 经典贪吃蛇玩法
- 键盘 WASD / 方向键控制
- 本地最高分持久化存储
- 支持缩放 50%–200%

### Tetris Battle
- 标准 22×10 俄罗斯方块
- 7-bag 随机方块生成器
- NEXT 预览窗格
- 旋转墙踢 + 平滑掉落动画

### Chinese Chess
- 经典中国象棋 Canvas 渲染
- 人机对弈（支持菜鸟 / 中级 / 高手三档难度）
- 残局挑战（多套预设残局）
- 悔棋、重开、棋盘换肤（3 套皮肤）
- AI 搜索基于 Alpha-Beta 剪枝

### Chinese Chess Plus
- 增强版中国象棋界面，复用现有 AI 引擎
- 支持人机对弈、人人对战、残局挑战三种模式
- 右侧走棋记录面板 + 下拉设置区
- 模式、难度、残局、皮肤一体化切换
- 悔棋、重开、顺切皮肤

### Gomoku
- 五子棋本地双人对战
- 支持开始、重开、悔棋、认输
- 白棋先手切换与手数编号显示

### International Chess
- 标准 8×8 国际象棋棋盘
- 手动点击走子 + 吃子高亮
- 白方 / 黑方可单独开启 AI 自动走子
- 1 / 2 / 4 APS 走子速度切换
- 白方 / 黑方视角切换

### Pixel Jumper
- 横向像素平台跳跃玩法，共 18 个关卡
- 普通巡逻怪、范围追击怪、间歇射击怪三种敌人
- 踩踏击杀 / 侧碰或子弹命中则失败
- 部分关卡含收集或击杀任务，完成后终点解锁
- 分段地图区域切换
- 全程最佳时间记录

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```text
Gameshin/
├── public/
│   ├── favicon.svg
│   └── chess/
│       ├── audio/            # 中国象棋 / 中国象棋Plus 音效资源
│       ├── data/             # 开局库数据 (gambit.js)
│       └── img/              # 棋盘、棋子、皮肤资源 (stype_1/2/3)
├── src/
│   ├── types/index.ts        # 全局类型定义
│   ├── data/games.ts         # 游戏数据配置
│   ├── games/                # 各游戏核心逻辑
│   │   ├── chess/            # 中国象棋引擎、AI、开局库、残局
│   │   ├── gobang/           # 五子棋本地双人规则与组件
│   │   ├── international-chess/  # 国际象棋规则与 AI
│   │   └── pixel-jumper/     # 像素跳跃物理、关卡、渲染
│   ├── pages/                # 各游戏页面组件与样式
│   │   ├── SnakeGame.tsx/css
│   │   ├── TetrisGame.tsx/css
│   │   ├── ChessGame.tsx/css
│   │   ├── ChessPlusGame.tsx/css
│   │   ├── GomokuGame.tsx/css
│   │   ├── InternationalChessGame.tsx/css
│   │   └── PixelJumperGame.tsx/css
│   ├── components/           # 通用 UI 组件
│   │   ├── Header.tsx        # 页头 + 分类导航
│   │   ├── GameCard.tsx      # 游戏卡片（内部路由 / 外部链接）
│   │   ├── GameList.tsx      # 卡片网格列表
│   │   └── Footer.tsx        # 页脚
│   ├── App.tsx               # 路由入口
│   ├── main.tsx              # 应用入口（HashRouter）
│   └── index.css             # 全局像素风格样式
├── index.html
├── vite.config.ts            # Vite 构建配置
├── tsconfig.json             # TypeScript 项目引用
├── tsconfig.app.json         # 应用 TS 配置
├── tsconfig.node.json        # Node 端 TS 配置
├── package.json
└── README.md
```

## 构建与部署

### 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录，包含：

```
dist/
├── index.html
├── favicon.svg
├── assets/
│   ├── index-*.css           # 全局样式
│   ├── index-*.js            # 应用代码
│   ├── vendor-*.js           # React / React Router 依赖
│   └── bg-*.jpg              # 五子棋棋盘图
└── chess/                    # 棋类静态资源（自动从 public/ 复制）
```

### 本地预览

```bash
npm run preview
```

Vite 预览服务器自带 SPA 降级，所有路由均可正常访问。

### 部署到子目录

如部署到 `https://example.com/games/`，需修改 `vite.config.ts`：

```ts
export default defineConfig({
  base: '/games/',  // 改为实际子路径
  // ...
})
```

`base` 变更后，所有资源路径（JS/CSS/图片/音频/开局库）会自动适配。

### 部署到静态服务器

本项目使用 **HashRouter**，无需服务器端 SPA 降级配置，可直接部署到任意静态文件服务器（nginx、Apache、GitHub Pages、Vercel、Netlify 等）。

## 添加新游戏

编辑 `src/data/games.ts`，添加新条目：

```ts
{
  id: 'game-id',
  title: '游戏名称',
  description: '游戏描述',
  url: '/game/your-game',     // 以 / 开头为内部路由
  tags: ['标签1', '标签2'],
  icon: '🎮',
  status: 'active',           // active | beta | coming-soon
  color: '#ff6b1a',
}
```

内部游戏还需在 `src/App.tsx` 中注册对应路由：

```tsx
<Route path="/game/your-game" element={<YourGame />} />
```

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | TypeScript 检查 + Vite 生产构建 |
| `npm run preview` | 本地预览构建产物 |
| `npm run lint` | ESLint 代码检查 |
