import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Sidebar from './components/Sidebar'
import TwinAgent from './components/TwinAgent'
import DetailPanel from './components/DetailPanel'
import SettingsPage from './components/SettingsPage'
import AgentHistoryPage from './components/AgentHistoryPage'
import { useStore } from './store'

const theme = {
  token: {
    colorPrimary: '#4C8BF5',
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`,
    fontSize: 14,
    colorBgContainer: '#FFFFFF',
    colorBorder: '#F0F1F3',
    colorBgLayout: '#F7F8FA',
  },
}

export default function App() {
  const settingsOpen = useStore((s) => s.settingsOpen)
  const agentHistoryOpen = useStore((s) => s.agentHistoryOpen)
  const middleCollapsed = useStore((s) => s.middleCollapsed)
  const detailVisible = useStore((s) => s.detailVisible)

  if (settingsOpen) {
    return (
      <ConfigProvider locale={zhCN} theme={theme}>
        <div className="h-screen w-screen overflow-hidden bg-white" style={{ minWidth: 375 }}>
          <SettingsPage />
        </div>
      </ConfigProvider>
    )
  }

  const showMiddleCollapsed = middleCollapsed && detailVisible

  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <div
        className="flex h-screen w-screen overflow-hidden bg-bg-page"
        style={{ minWidth: 375 }}
      >
        <Sidebar />
        {agentHistoryOpen ? (
          <AgentHistoryPage />
        ) : (
          <>
            {!showMiddleCollapsed && <TwinAgent />}
            <DetailPanel />
          </>
        )}
      </div>
    </ConfigProvider>
  )
}
