import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Sidebar from './components/Sidebar'
import TwinAgent from './components/TwinAgent'
import DetailPanel from './components/DetailPanel'

const theme = {
  token: {
    colorPrimary: '#4C8BF5',
    borderRadius: 8,
    fontFamily: `-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`,
    fontSize: 13,
    colorBgContainer: '#FFFFFF',
    colorBorder: '#F0F1F3',
    colorBgLayout: '#F7F8FA',
  },
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={theme}>
      <div className="flex h-screen w-screen overflow-hidden bg-bg-page" style={{ minWidth: 375 }}>
        <Sidebar />
        <TwinAgent />
        <DetailPanel />
      </div>
    </ConfigProvider>
  )
}
