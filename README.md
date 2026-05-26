# GAMESHIN GAME HUB

像素风格游戏导航中心 — 一个展示和链接多款游戏的入口网站。

## 技术栈

- **React 19** + **TypeScript**
- **Vite** 构建工具
- **React Router v7** 客户端路由
- 纯 CSS 像素风格主题设计

## 特性

- **像素风格 UI** — 使用 Press Start 2P 像素字体，锐利边框，阶梯动画
- **蒸汽朋克配色** — 深蓝灰底色 + 琥珀橙主色，配合网格背景和渐变光晕
- **分类筛选** — 按游戏状态筛选：热玩中 / 试玩版 / 即将上线
- **响应式布局** — 适配桌面端、平板和手机
- **游戏卡片** — 每张卡片展示游戏图标、标题、描述、标签和状态
- **贪吃蛇游戏** — 内置经典 Snake Classic，Canvas 像素渲染，支持缩放调节（50%–200%），本地最高分持久化
- **俄罗斯方块** — 内置经典 Tetris，标准 22×10 棋盘，7-bag 随机生成器，旋转墙踢，平滑掉落动画，NEXT 预览

## 项目结构

```
Gameshin/
├── src/
│   ├── types/index.ts        # 类型定义
│   ├── data/games.ts         # 游戏数据配置
│   ├── pages/
│   │   ├── SnakeGame.tsx     # 贪吃蛇游戏页面（支持缩放 50%–200%）
│   │   ├── SnakeGame.css     # 贪吃蛇游戏样式
│   │   ├── TetrisGame.tsx    # 俄罗斯方块游戏页面
│   │   └── TetrisGame.css    # 俄罗斯方块游戏样式
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

## 添加新游戏

编辑 `src/data/games.ts`，添加新条目。内部游戏（`url` 以 `/` 开头）使用 SPA 路由，外部游戏使用新窗口打开：

```ts
{
  id: 'game-id',           // 唯一标识
  title: '游戏名称',
  description: '游戏描述',
  url: 'https://...',      // 游戏链接（外部 URL 或内部路由如 '/game/snake'）
  tags: ['标签1', '标签2'],
  icon: '🎮',              // 图标 emoji
  status: 'active',        // active | beta | coming-soon
  color: '#ff6b1a',        // 卡片主题色
}
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist/` 目录。