# Family Card / 家庭创意储蓄卡

[中文说明 / Chinese](#zh-readme) · [English Version](#en-readme)

---

<a id="zh-readme"></a>

## 家庭创意储蓄卡（Family Card）

一个为家庭、尤其是为孩子设计的「创意储蓄卡」系统。  
我们希望：孩子不只是学会怎么花钱，更在一次次记录中，学会储蓄、学会等待回报，也学会为自己的好念头和好行动自豪。

当孩子：

- 发明了一个新的玩法、作品或小工具  
- 写完一篇认真投入的作文或日记  
- 主动帮忙做家务、关心家人、提出温暖的点子  

家长都可以在这张「家庭卡」里，为孩子记上一笔「收入」——  
这笔收入不只是钱，更是对他/她的创造力、责任感和温柔心意的认真回应。

Family Card 就是这样一张，被数字化、可视化、可以贴在 NFC 卡、手环或手机里的「家庭创意钱包」。

---

### 项目理念

- **用「记录」代替「说教」**：与其反复提醒「要省钱」「要努力」，不如把每一次认真付出、每一次自我克制，都记录成一笔可以被看见的成长资产。  
- **把「创造」也变成可累计的财富**：在这里，发明一个东西、写一篇文章、主动做好事，都可以像零用钱一样被记账、被积累。  
- **从小练习延迟满足与自我管理**：孩子通过查看自己的「卡片余额」和「交易历史」，慢慢学会规划、取舍，而不只是被动接受奖励。  
- **让家庭有一套自己的价值体系**：每个家庭可以用自己的方式，为不同行为设定「价值」，共同约定什么值得被奖励和记住。

---

### 功能一览

- **家庭成员与卡片管理**
  - 管理员登录控制台 `/admin`，创建家庭成员（如「妈妈」「爸爸」「宝宝」）  
  - 为每个成员创建一张或多张主题卡片（零用钱卡、创作奖励卡、家务积分卡等）

- **孩子视角的钱包界面**
  - 通过 `http://localhost:5173/u/:slug`（例如 `/u/baby`）进入孩子的钱包  
  - 手机端友好界面，可记录收入/支出，查看余额与近期记录  
  - 支持用「发明」「创造」「文章」「家务」等分类，鼓励把创造与行动当成一种「可积累的资产」

- **可爱的卡面与卡包样式**
  - 通过 `Family Card Design` 文件夹中的图片，为卡片选择不同的卡面  
  - 通过 `Family Wallet Design` 文件夹中的图片，为钱包整体换肤  
  - 适合后续与实体卡片、贴纸、NFC 标签等结合，做出独一无二的「家庭钱包」

- **安全的管理员后台**
  - 管理员密码登录（环境变量配置）  
  - 增删改成员与卡片，调整余额、修改卡面样式  
  - 自动记录每一次余额变动的历史，避免「记不清」的争议

---

### 技术栈

- 前端：React 18、Vite、Tailwind CSS  
- 后端：Node.js（Express）、better-sqlite3（嵌入式 SQLite 数据库）  
- 认证与安全：JSON Web Token（JWT）用于管理员登录  
- 构建与开发：Vite 开发服务器与打包，npm 脚本一键启动前后端

---

### 环境配置

在项目根目录创建 `.env` 文件（注意不要提交到公共仓库），示例：

```bash
ADMIN_PASSWORD=your_admin_password
ADMIN_JWT_SECRET=some-long-random-secret
NFC_TOKEN_SECRET=another-long-random-secret
PORT=3001
```

- 本地开发时，**至少需要配置 `ADMIN_PASSWORD`** 才能登录后台  
- `ADMIN_JWT_SECRET` 与 `NFC_TOKEN_SECRET` 未配置时会使用安全性较弱的默认值，建议在实际部署时显式设置  
- `PORT` 默认为 `3001`，作为后端 API 端口

---

### 本地运行与快速上手

前提条件：

- Node.js ≥ 18  
- npm 或兼容的包管理器

1. 安装依赖

   ```bash
   npm install
   ```

2. 启动开发环境（前后端一起）

   ```bash
   npm run dev
   ```

   - 前端开发地址：`http://localhost:5173`  
   - 管理员控制台：`http://localhost:5173/admin`  
   - 后端 API 服务：`http://localhost:3001`

3. 典型使用流程

   - 打开 `http://localhost:5173/admin`，使用在 `.env` 中设置的 `ADMIN_PASSWORD` 登录  
   - 创建家庭成员（为每个成员设定唯一的 `slug`，如 `baby`、`mom`）  
   - 为孩子创建一张或多张卡片，选择卡面、设置初始余额  
   - 在控制台中复制孩子的「钱包链接」（形如 `http://localhost:5173/u/baby`），在手机上打开  
   - 从此以后，当孩子有新的创作、好习惯或积极行动时，家长和孩子一起打开钱包，为这一次表现记上一笔「收入」，让成长可以被看见、被保存。

---

<a id="en-readme"></a>

## Family Card – A Wallet for Kids’ Savings & Creativity

Family Card is a small open-source project born from a simple belief:

> Every kind act, every brave attempt, every piece of writing and every tiny invention from a child  
> deserves to be seen, remembered, and gently rewarded.

Instead of only tracking pocket money, Family Card treats **creativity, effort and responsibility** as things that can also be “saved” and “grown”.

When a child:

- builds something new or invents a little game  
- finishes a story, an essay, or a thoughtful diary  
- helps with housework proactively, or shows care to family members  

parents can record it as a new “income” on the child’s card.  
The balance becomes not just numbers, but a timeline of visible growth.

---

### Vision

- **Replace lectures with shared records**: Rather than saying “you should save” or “you should try harder” over and over, we give families a space to record each real effort and each good decision.  
- **Turn creativity into a form of wealth**: Earning is not only “money from adults” but also “points from creating, writing, helping, inventing”.  
- **Practice delayed gratification and self-management**: Kids can see their own balance and history, and learn to plan and choose, instead of just waiting to be rewarded.  
- **Let each family define its own values**: You decide what behaviors are meaningful and how they should be rewarded. The system is only the notebook; the values come from you.

---

### Features

- **Family members & cards**
  - Admin console at `/admin` for managing family members  
  - Multiple themed cards per person (pocket money card, creativity reward card, chores card, etc.)

- **Kid-friendly wallet view**
  - Mobile-friendly UI at `http://localhost:5173/u/:slug` (e.g. `/u/baby`)  
  - Record incomes/expenses, see balance and recent history  
  - Categories like “Invention”, “Creation”, “Writing”, “Chores” encourage seeing effort as something that accumulates

- **Cute card faces & wallet styles**
  - Card faces loaded from the `Family Card Design` folder  
  - Wallet background styles loaded from `Family Wallet Design`  
  - Designed to work nicely with physical cards, NFC tags or stickers later on

- **Secure admin console**
  - Password-based admin login (configurable via environment variables)  
  - Create, edit and delete users and cards, adjust balances, change styles  
  - All balance changes are written into transaction history for traceability

---

### Tech Stack

- Frontend: React 18, Vite, Tailwind CSS  
- Backend: Node.js (Express) with better-sqlite3 (embedded SQLite)  
- Auth & security: JSON Web Token (JWT) for admin login  
- Tooling: Vite dev server & build pipeline, npm scripts to run both client and server

---

### Configuration

Create a `.env` file in the project root:

```bash
ADMIN_PASSWORD=your_admin_password
ADMIN_JWT_SECRET=some-long-random-secret
NFC_TOKEN_SECRET=another-long-random-secret
PORT=3001
```

- At minimum, set `ADMIN_PASSWORD` for local usage  
- For any real deployment, replace the secrets with strong random values and avoid committing `.env` to version control

---

### Getting Started

Prerequisites:

- Node.js ≥ 18  
- npm or a compatible package manager

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development environment (API server + frontend):

   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`  
   - Admin console: `http://localhost:5173/admin`  
   - API server: `http://localhost:3001`

3. Typical family workflow:

   - Log in to the admin console with the `ADMIN_PASSWORD` you set  
   - Create family members and give each a unique `slug` (e.g. `baby`, `mom`)  
   - Create one or more cards for each child, choose a card face, and optionally set an initial balance  
   - Use the generated wallet link (like `http://localhost:5173/u/baby`) on a phone, or encode it into an NFC tag  
   - Whenever the child creates, helps, writes, or simply tries their best, open the wallet together and record a new “income” — let their growth accumulate, one entry at a time.

---

愿这张小小的家庭卡，  
能陪着孩子，一点点学会  
既看见当下的快乐，也看见长期的收获。  

May this small wallet grow with your child,  
helping them see both today’s joy  
and the quiet, long-term value of every good idea.

