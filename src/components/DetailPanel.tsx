import { useState, useEffect } from 'react'
import { Avatar, Badge, Modal, message } from 'antd'
import {
  CloseOutlined,
  DownOutlined,
  RightOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  NodeIndexOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  RightCircleOutlined,
} from '@ant-design/icons'
import { useStore } from '../store'

const statusColor: Record<string, string> = {
  online: '#00B42A',
  busy: '#FF7D00',
  offline: '#C9CDD4',
}

const statusText: Record<string, string> = {
  online: '在线',
  busy: '执行中',
  offline: '离线',
}

interface ActivityItem {
  id: string
  action: string
  target: string
  time: string
  status: 'success' | 'running' | 'failed'
}

interface ActivityDetail {
  duration: string
  inputTokens: number
  outputTokens: number
  steps: string[]
  output?: string
  error?: string
}

const defaultActivities: (ActivityItem & { detail: ActivityDetail })[] = [
  {
    id: '1', action: '代码审查', target: 'src/components/ChatArea.tsx', time: '2 分钟前', status: 'success',
    detail: {
      duration: '18s', inputTokens: 4280, outputTokens: 1560, output: '发现 3 处建议：1) useEffect 缺少 cleanup；2) 内联样式可提取为常量；3) 建议 memo 包裹子组件减少重渲染。',
      steps: ['读取文件 ChatArea.tsx (230 行)', '解析 AST 提取组件结构', '检查 Hook 使用规范', '分析性能热点', '生成审查报告'],
    },
  },
  {
    id: '2', action: '重构执行', target: 'components/ 目录 · 42 个文件', time: '5 分钟前', status: 'success',
    detail: {
      duration: '2m 14s', inputTokens: 18700, outputTokens: 12300, output: '42 个组件按功能域拆分为 6 个子目录，新增 Barrel Export，更新 67 处 import 路径。所有类型检查和测试通过。',
      steps: ['扫描 components/ 目录结构', '分析组件依赖图谱', '制定拆分方案（UI / Layout / Form / Data / Nav / Shared）', '执行文件迁移（42 个文件）', '更新 import 路径（67 处）', '添加 index.ts Barrel Export（6 个）', '运行 tsc 类型检查', '运行单元测试验证'],
    },
  },
  {
    id: '3', action: '测试运行', target: '单元测试 128 例 · 集成测试 24 例', time: '6 分钟前', status: 'running',
    detail: {
      duration: '进行中 (42s)', inputTokens: 6100, outputTokens: 3200,
      steps: ['加载测试配置 jest.config.ts', '运行单元测试 (128/128 通过)', '运行集成测试 (18/24 进行中)', '等待 E2E 测试排队…'],
    },
  },
  {
    id: '4', action: 'Bug 修复', target: 'utils/parser.ts#L47 · TypeError', time: '12 分钟前', status: 'success',
    detail: {
      duration: '32s', inputTokens: 3400, outputTokens: 1800, output: '修复了 parseConfig() 在传入 null 时抛出 TypeError 的问题。添加了空值检查和默认值回退，补充了 3 个边界测试用例。',
      steps: ['定位错误堆栈 parser.ts:47', '复现 Bug（传入 null config）', '分析根因：缺少空值检查', '添加 nullish coalescing 守卫', '补充 3 个边界用例测试', '验证修复 · 测试全绿'],
    },
  },
  {
    id: '5', action: '依赖更新', target: 'package.json · lodash 4.17.20→21', time: '20 分钟前', status: 'failed',
    detail: {
      duration: '1m 05s', inputTokens: 2800, outputTokens: 900, error: 'peerDependency 冲突：react-scripts@5.0.1 要求 eslint@^8.0.0，但 eslint@9.0.0 已安装。建议先升级 react-scripts 或使用 --legacy-peer-deps。',
      steps: ['检测可用更新（3 个包）', '更新 lodash 4.17.20 → 4.17.21', '更新 axios 0.21.1 → 1.6.0', '运行 pnpm install', '发现 peerDependency 冲突 ✗', '回滚 package.json 变更'],
    },
  },
  {
    id: '6', action: '文档生成', target: 'API 文档 · 19 个接口', time: '35 分钟前', status: 'success',
    detail: {
      duration: '1m 48s', inputTokens: 14200, outputTokens: 9800, output: '为 /api/users、/api/agents、/api/workspaces 三个模块生成了 OpenAPI 3.0 规范文档，包含请求示例、响应 Schema 和错误码说明。',
      steps: ['扫描路由文件提取 API 列表', '解析 Controller 参数类型', '生成 OpenAPI 3.0 YAML', '添加请求/响应示例', '导出 Swagger HTML 文件', '部署到内部文档站点'],
    },
  },
  {
    id: '7', action: '性能分析', target: 'Lighthouse 评分 · 首页', time: '1 小时前', status: 'success',
    detail: {
      duration: '56s', inputTokens: 5300, outputTokens: 2100, output: 'Performance 92 → 97，LCP 从 2.4s 降至 1.1s。主要优化：图片懒加载、关键 CSS 内联、第三方脚本延迟加载。',
      steps: ['运行 Lighthouse CI 基准测试', '分析 Performance 瓶颈', '识别 LCP 阻塞资源', '实施图片懒加载优化', '内联关键 CSS (above-the-fold)', '延迟加载第三方脚本', '重新运行 Lighthouse 验证'],
    },
  },
  {
    id: '8', action: '安全扫描', target: '依赖审计 · 127 个包', time: '2 小时前', status: 'success',
    detail: {
      duration: '1m 22s', inputTokens: 8900, outputTokens: 3600, output: '扫描 127 个依赖包，发现 0 高危、2 中危（版本过旧）、5 低危（建议优化）。中危问题已提交自动修复 PR。',
      steps: ['执行 pnpm audit', '运行 Snyk 深度扫描', '交叉验证 GitHub Advisory', '分类漏洞等级', '为中危漏洞生成修复方案', '创建修复 PR #247'],
    },
  },
]

interface TriggerItem {
  id: string
  name: string
  schedule: string
  enabled: boolean
}

const defaultTriggers: TriggerItem[] = [
  { id: '1', name: '定时巡检', schedule: '每日 08:00', enabled: true },
  { id: '2', name: 'PR 代码审查', schedule: 'Git Push 触发', enabled: true },
  { id: '3', name: '错误告警响应', schedule: 'Sentry 错误 > 10/min', enabled: false },
]

const defaultPlan = [
  { step: 1, title: '分析项目结构', status: 'done' as const },
  { step: 2, title: '识别重构目标', status: 'done' as const },
  { step: 3, title: '拆分组件目录', status: 'done' as const },
  { step: 4, title: '更新引用路径', status: 'current' as const },
  { step: 5, title: '运行测试验证', status: 'pending' as const },
  { step: 6, title: '生成变更报告', status: 'pending' as const },
]

const defaultRoutes = [
  { from: '用户指令', to: '任务解析', type: 'input' },
  { from: '任务解析', to: '上下文收集', type: 'process' },
  { from: '上下文收集', to: '方案生成', type: 'process' },
  { from: '方案生成', to: '代码执行', type: 'process' },
  { from: '代码执行', to: '结果验证', type: 'process' },
  { from: '结果验证', to: '用户反馈', type: 'output' },
]

interface CheckItem {
  id: string
  label: string
  checked: boolean
}

const defaultChecklist: CheckItem[] = [
  { id: '1', label: '代码风格检查', checked: true },
  { id: '2', label: '单元测试通过', checked: true },
  { id: '3', label: '类型安全验证', checked: true },
  { id: '4', label: 'E2E 测试覆盖', checked: false },
  { id: '5', label: '性能基准对比', checked: false },
  { id: '6', label: '安全漏洞扫描', checked: false },
]

type SectionKey = 'activities' | 'triggers' | 'plan' | 'routes' | 'checklist'
const statusColorMap = { success: '#00B42A', running: '#4C8BF5', failed: '#F53F3F' }
const statusLabelMap = { success: '完成', running: '进行中', failed: '失败' }
const planStatusColor = { done: '#00B42A', current: '#4C8BF5', pending: '#C9CDD4' }

export default function DetailPanel() {
  const { agents, selectedAgentId, detailVisible, toggleDetail, pendingActivityModal, setPendingActivityModal } = useStore()
  const agent = agents.find((a) => a.id === selectedAgentId)

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    activities: true,
    triggers: false,
    plan: false,
    routes: false,
    checklist: false,
  })
  const [modalData, setModalData] = useState<{ title: string; content: React.ReactNode } | null>(null)
  const [triggers, setTriggers] = useState(defaultTriggers)
  const [checklist, setChecklist] = useState(defaultChecklist)

  const toggle = (key: SectionKey) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    if (!pendingActivityModal || !agent) return
    if (pendingActivityModal.agentId !== agent.id) return
    const act = agent.activities.find(a => a.id === pendingActivityModal.activityId)
    if (!act) return
    setExpanded(prev => ({ ...prev, activities: true }))
    setModalData({
      title: act.action,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="flex items-center gap-3">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColorMap[act.status] }} />
            <span className="text-[15px] font-medium">{act.action}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
              <div className="text-[11px] text-text-tertiary">耗时</div>
              <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.duration || '-'}</div>
            </div>
            <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
              <div className="text-[11px] text-text-tertiary">状态</div>
              <div className="text-[14px] font-semibold mt-0.5" style={{ color: statusColorMap[act.status] }}>{statusLabelMap[act.status]}</div>
            </div>
            <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
              <div className="text-[11px] text-text-tertiary">时间</div>
              <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.time}</div>
            </div>
          </div>
          {act.steps && act.steps.length > 0 && (
            <div>
              <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 8 }}>执行步骤</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {act.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5" style={{ padding: '5px 0' }}>
                    <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 3 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B42A' }} />
                      {i < act.steps!.length - 1 && <div style={{ width: 1, height: 16, background: '#E5E6EB', marginTop: 2 }} />}
                    </div>
                    <span className="text-[12px] text-text-secondary" style={{ lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {act.result && (
            <div>
              <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 6 }}>执行结果</div>
              <div className="rounded-lg bg-[#F7F8FA] text-[12px] text-text-secondary" style={{ padding: '12px 14px', lineHeight: 1.7 }}>
                {act.result}
              </div>
            </div>
          )}
        </div>
      ),
    })
    setPendingActivityModal(null)
  }, [pendingActivityModal, agent, setPendingActivityModal])

  const toggleTrigger = (id: string) => {
    setTriggers((prev) => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t))
    message.success('触发器状态已更新')
  }

  const toggleCheckItem = (id: string) => {
    setChecklist((prev) => prev.map((c) => c.id === id ? { ...c, checked: !c.checked } : c))
  }

  if (!detailVisible || !agent) return null

  const checkedCount = checklist.filter((c) => c.checked).length

  const sections: { key: SectionKey; label: string; icon: React.ReactNode; count?: string | number; content: React.ReactNode }[] = [
    {
      key: 'activities',
      label: '活动历史',
      icon: <HistoryOutlined style={{ fontSize: 14 }} />,
      count: agent.activities.length,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {agent.activities.length === 0 ? (
            <div className="text-center" style={{ padding: '16px 10px' }}>
              <span className="text-[11px] text-text-tertiary">暂无活动记录</span>
            </div>
          ) : (
            agent.activities.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="rounded-[8px] hover:bg-[#F7F8FA] cursor-pointer transition-colors"
                style={{ padding: '10px 10px' }}
                onClick={() => setModalData({
                  title: act.action,
                  content: (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="flex items-center gap-3">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColorMap[act.status] }} />
                        <span className="text-[15px] font-medium">{act.action}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
                          <div className="text-[11px] text-text-tertiary">耗时</div>
                          <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.duration || '-'}</div>
                        </div>
                        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
                          <div className="text-[11px] text-text-tertiary">状态</div>
                          <div className="text-[14px] font-semibold mt-0.5" style={{ color: statusColorMap[act.status] }}>{statusLabelMap[act.status]}</div>
                        </div>
                        <div className="rounded-lg bg-[#F7F8FA] text-center" style={{ padding: '10px 8px' }}>
                          <div className="text-[11px] text-text-tertiary">时间</div>
                          <div className="text-[14px] font-semibold text-text-primary mt-0.5">{act.time}</div>
                        </div>
                      </div>
                      {act.steps && act.steps.length > 0 && (
                        <div>
                          <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 8 }}>执行步骤</div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {act.steps.map((step, i) => (
                              <div key={i} className="flex items-start gap-2.5" style={{ padding: '5px 0' }}>
                                <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 3 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B42A' }} />
                                  {i < act.steps!.length - 1 && <div style={{ width: 1, height: 16, background: '#E5E6EB', marginTop: 2 }} />}
                                </div>
                                <span className="text-[12px] text-text-secondary" style={{ lineHeight: 1.5 }}>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {act.result && (
                        <div>
                          <div className="text-[13px] font-medium text-text-primary" style={{ marginBottom: 6 }}>执行结果</div>
                          <div className="rounded-lg bg-[#F7F8FA] text-[12px] text-text-secondary" style={{ padding: '12px 14px', lineHeight: 1.7 }}>
                            {act.result}
                          </div>
                        </div>
                      )}
                    </div>
                  ),
                })}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {act.status === 'running' ? (
                      <span className="exec-step-running w-[6px] h-[6px] rounded-full border border-[#4C8BF5] shrink-0" />
                    ) : (
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColorMap[act.status], flexShrink: 0 }} />
                    )}
                    <span className={`text-[12px] truncate ${act.status === 'running' ? 'font-medium text-brand' : 'font-medium text-text-primary'}`}>{act.action}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {act.duration && <span className="text-[10px] text-text-tertiary">{act.duration}</span>}
                    <span className="text-[11px] text-text-tertiary">{act.time}</span>
                  </div>
                </div>
                <div className="text-[11px] text-text-tertiary truncate" style={{ marginTop: 3, paddingLeft: 13 }}>{act.target}</div>
              </div>
            ))
          )}
        </div>
      ),
    },
    {
      key: 'triggers',
      label: '触发器',
      icon: <ThunderboltOutlined style={{ fontSize: 14 }} />,
      count: triggers.filter((t) => t.enabled).length,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="flex items-center justify-between rounded-[6px] hover:bg-[#F7F8FA] transition-colors"
              style={{ padding: '8px 10px' }}
            >
              <div className="flex items-center gap-2 min-w-0 cursor-pointer" onClick={() => setModalData({
                title: trigger.name,
                content: <div><p><strong>名称：</strong>{trigger.name}</p><p style={{ marginTop: 8 }}><strong>规则：</strong>{trigger.schedule}</p><p style={{ marginTop: 8 }}><strong>状态：</strong>{trigger.enabled ? '已启用' : '已停用'}</p></div>,
              })}>
                <ClockCircleOutlined style={{ fontSize: 12, color: trigger.enabled ? '#4C8BF5' : '#C9CDD4' }} />
                <span className="text-[12px] text-text-primary truncate">{trigger.name}</span>
              </div>
              <button
                onClick={() => toggleTrigger(trigger.id)}
                className="text-[11px] shrink-0 ml-2 px-1.5 py-0.5 rounded"
                style={{ color: trigger.enabled ? '#4C8BF5' : '#86909C', background: trigger.enabled ? '#EFF5FF' : '#F7F8FA' }}
              >
                {trigger.enabled ? '启用' : '停用'}
              </button>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'plan',
      label: '规划',
      icon: <ApartmentOutlined style={{ fontSize: 14 }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {defaultPlan.map((step, i) => (
            <div key={step.step} className="flex items-start gap-3" style={{ padding: '6px 10px' }}>
              <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: planStatusColor[step.status], border: step.status === 'current' ? '2px solid #4C8BF5' : 'none', boxSizing: 'content-box' }} />
                {i < defaultPlan.length - 1 && <div style={{ width: 1, height: 20, background: '#E5E6EB', marginTop: 2 }} />}
              </div>
              <span className={`text-[12px] ${step.status === 'current' ? 'text-brand font-medium' : step.status === 'done' ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                Step {step.step}. {step.title}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'routes',
      label: '路线',
      icon: <NodeIndexOutlined style={{ fontSize: 14 }} />,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {defaultRoutes.map((route, i) => (
            <div key={i} className="flex items-center gap-2" style={{ padding: '5px 10px' }}>
              <span className={`text-[12px] ${route.type === 'input' ? 'text-brand' : route.type === 'output' ? 'text-online' : 'text-text-primary'}`}>{route.from}</span>
              <RightCircleOutlined style={{ fontSize: 10, color: '#C9CDD4' }} />
              <span className={`text-[12px] ${route.type === 'output' ? 'text-online' : 'text-text-primary'}`}>{route.to}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'checklist',
      label: '检查清单',
      icon: <CheckSquareOutlined style={{ fontSize: 14 }} />,
      count: `${checkedCount}/${checklist.length}`,
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {checklist.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-[#F7F8FA] rounded-[4px] transition-colors"
              style={{ padding: '6px 10px' }}
              onClick={() => toggleCheckItem(item.id)}
            >
              <span style={{ width: 14, height: 14, borderRadius: 3, border: item.checked ? 'none' : '1.5px solid #C9CDD4', background: item.checked ? '#4C8BF5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
              </span>
              <span className={`text-[12px] ${item.checked ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{item.label}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="detail-panel-responsive flex flex-col w-[320px] bg-bg-white border-l border-border shrink-0 overflow-hidden">
        <div className="flex items-center justify-between shrink-0 border-b border-border" style={{ height: 52, padding: '0 20px' }}>
          <span className="text-[14px] font-semibold text-text-primary truncate">{agent.name}</span>
          <button onClick={toggleDetail} className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[#F2F3F5] transition-colors text-text-tertiary">
            <CloseOutlined style={{ fontSize: 11 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Agent Profile Card */}
          <div className="flex flex-col items-center" style={{ padding: '22px 20px 14px' }}>
            <Badge dot color={statusColor[agent.status]} offset={[-4, 48]}>
              <Avatar size={52} style={{ backgroundColor: '#4C8BF5', color: '#fff', fontSize: 18, fontWeight: 700 }}>{agent.avatar}</Avatar>
            </Badge>
            <h4 className="text-[15px] font-semibold text-text-primary" style={{ marginTop: 10 }}>{agent.name}</h4>
            <p className="text-[12px] text-text-secondary text-center" style={{ marginTop: 4, lineHeight: 1.6, maxWidth: 220 }}>{agent.description}</p>
            <div className="flex items-center" style={{ gap: 6, marginTop: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[agent.status] }} />
              <span className="text-[12px] text-text-secondary">{statusText[agent.status]}</span>
              {agent.totalRuns > 0 && <span className="text-[11px] text-text-tertiary" style={{ marginLeft: 8 }}>执行 {agent.totalRuns} 次</span>}
            </div>
            {agent.currentTask && agent.status === 'busy' && (
              <div className="text-[11px] text-brand bg-brand-light rounded-md text-center truncate" style={{ marginTop: 8, padding: '4px 12px', maxWidth: 240 }}>
                正在执行：{agent.currentTask}
              </div>
            )}
          </div>

          {/* Collapsible Sections */}
          {sections.map((section) => (
            <div key={section.key} style={{ borderTop: '1px solid #F0F1F3' }}>
              <button onClick={() => toggle(section.key)} className="flex items-center justify-between w-full hover:bg-[#F7F8FA] transition-colors" style={{ padding: '12px 20px' }}>
                <div className="flex items-center gap-2">
                  <span className="text-text-tertiary">{section.icon}</span>
                  <span className="text-[13px] font-medium text-text-primary">{section.label}</span>
                  {section.count !== undefined && <span className="text-[11px] text-text-tertiary">{section.count}</span>}
                </div>
                {expanded[section.key] ? <DownOutlined style={{ fontSize: 10, color: '#86909C' }} /> : <RightOutlined style={{ fontSize: 10, color: '#86909C' }} />}
              </button>
              {expanded[section.key] && <div style={{ padding: '0 10px 12px' }}>{section.content}</div>}
            </div>
          ))}
        </div>
      </div>

      <Modal title={modalData?.title} open={!!modalData} onCancel={() => setModalData(null)} footer={null} width={520} centered>
        {modalData?.content}
      </Modal>
    </>
  )
}
