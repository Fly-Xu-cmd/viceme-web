import type { Agent, Workspace, Message } from './types'

export const agents: Agent[] = [
  {
    id: 'a1',
    name: 'CodePilot',
    avatar: 'CP',
    description: '全栈开发助手，擅长代码编写、审查与重构',
    status: 'online',
    capabilities: ['代码生成', '代码审查', 'Bug 修复', '重构优化'],
    model: 'GPT-4o',
    lastUsed: '2 分钟前',
    totalRuns: 1284,
    activities: [],
  },
  {
    id: 'a2',
    name: 'DataBot',
    avatar: 'DB',
    description: '数据处理与分析专家，支持 SQL、Python 数据管道',
    status: 'busy',
    capabilities: ['SQL 查询', '数据清洗', '可视化', 'ETL 管道'],
    model: 'Claude 3.5',
    lastUsed: '执行中…',
    totalRuns: 567,
    activities: [],
  },
  {
    id: 'a3',
    name: 'DevOps Agent',
    avatar: 'DO',
    description: '运维部署助手，管理 CI/CD、容器与基础设施',
    status: 'online',
    capabilities: ['CI/CD 配置', 'Docker 管理', 'K8s 编排', '日志分析'],
    model: 'GPT-4o',
    lastUsed: '15 分钟前',
    totalRuns: 342,
    activities: [],
  },
  {
    id: 'a4',
    name: 'DocWriter',
    avatar: 'DW',
    description: '技术文档撰写助手，生成 API 文档与使用指南',
    status: 'offline',
    capabilities: ['API 文档', 'README 生成', '注释补全', '翻译'],
    model: 'Claude 3.5',
    lastUsed: '3 小时前',
    totalRuns: 89,
    activities: [],
  },
  {
    id: 'a5',
    name: 'TestRunner',
    avatar: 'TR',
    description: '自动化测试助手，编写和运行测试用例',
    status: 'online',
    capabilities: ['单元测试', 'E2E 测试', '覆盖率分析', '性能测试'],
    model: 'GPT-4o',
    lastUsed: '30 分钟前',
    totalRuns: 456,
    activities: [],
  },
  {
    id: 'a6',
    name: 'SecurityBot',
    avatar: 'SB',
    description: '安全审计助手，漏洞扫描与合规检查',
    status: 'offline',
    capabilities: ['漏洞扫描', '依赖审计', '合规检查', '安全加固'],
    model: 'Claude 3.5',
    lastUsed: '昨天',
    totalRuns: 78,
    activities: [],
  },
]

const messagesCodePilot: Message[] = [
  {
    id: 'm1',
    role: 'user',
    content: '帮我分析一下当前项目的目录结构，给出优化建议。',
    timestamp: '10:32',
  },
  {
    id: 'm2',
    role: 'agent',
    content: `已扫描项目目录，当前结构如下：

\`\`\`
src/
├── components/    # 42 个组件
├── pages/         # 12 个页面
├── hooks/         # 8 个自定义 Hook
├── utils/         # 15 个工具函数
├── services/      # API 调用层
└── types/         # 类型定义
\`\`\`

**优化建议：**

1. **组件拆分** — \`components/\` 下文件过多，建议按功能域分子目录
2. **引入 Barrel Exports** — 每个目录添加 \`index.ts\` 统一导出
3. **共享类型抽离** — \`types/\` 中存在与 \`services/\` 耦合的类型，建议按模块拆分`,
    timestamp: '10:32',
  },
  {
    id: 'm3',
    role: 'user',
    content: '第一点说得好，帮我把 components 按功能域拆分一下。',
    timestamp: '10:35',
  },
  {
    id: 'm4',
    role: 'agent',
    content: `已完成组件目录重构，变更摘要：

- 将 42 个组件按功能域归类到 6 个子目录
- 每个子目录添加了 \`index.ts\` Barrel Export
- 更新了所有相关 import 路径（共 67 处）

所有测试通过 ✓，无 breaking change。需要我继续处理第二点建议吗？`,
    timestamp: '10:36',
  },
]

export const workspaces: Workspace[] = [
  {
    id: 'w1',
    name: '项目重构讨论',
    agent: agents[0],
    messages: messagesCodePilot,
    updatedAt: '10:36',
  },
  {
    id: 'w2',
    name: '数据分析报表',
    agent: agents[1],
    messages: [
      { id: 'd1', role: 'user', content: '帮我查看一下近30天用户增长的数据趋势。', timestamp: '09:15' },
      { id: 'd2', role: 'agent', content: '已完成数据查询，近 30 天新增用户 12,847 人，日均 428，环比 +18.3%。', timestamp: '09:16' },
    ],
    updatedAt: '09:16',
  },
  {
    id: 'w3',
    name: '生产环境巡检',
    agent: agents[2],
    messages: [
      { id: 'o1', role: 'user', content: '检查一下生产环境的 K8s Pod 状态。', timestamp: '11:00' },
      { id: 'o2', role: 'agent', content: '生产环境 K8s 集群：24 Running / 0 Pending / 0 Failed，CPU 63%，内存 71%。所有服务正常 ✓', timestamp: '11:00' },
    ],
    updatedAt: '11:00',
  },
  {
    id: 'w4',
    name: 'API 文档更新',
    agent: agents[3],
    messages: [],
    updatedAt: '昨天',
  },
  {
    id: 'w5',
    name: '性能优化方案',
    agent: agents[0],
    messages: [
      { id: 'p1', role: 'user', content: '首页加载速度太慢，帮我分析瓶颈。', timestamp: '14:20' },
      { id: 'p2', role: 'agent', content: '首屏加载 3.2s，主要瓶颈：Bundle 体积 2.1MB、未做路由懒加载、图片未压缩。建议分三步优化。', timestamp: '14:21' },
    ],
    updatedAt: '14:21',
  },
  {
    id: 'w6',
    name: '安全漏洞修复',
    agent: agents[5],
    messages: [],
    updatedAt: '3天前',
  },
]
