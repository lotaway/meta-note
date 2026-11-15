import { useState } from 'react'
import styled from 'styled-components'
import { FactoryScene, Device, Alert, DeviceStatus, AlertPanel, DeviceChart, StatsCard, AudioMonitor, ScadaPanel, TraceabilityPanel } from '../components/digital-twin'
import { AlertRuleList } from '../components/digital-twin/alert-rule'
import { ToastContainer } from '../components/Toast'
import { useDigitalTwinData } from '../hooks/useDigitalTwinData'

const PageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  background: #0f172a;
  color: #e2e8f0;
`

const LeftPanel = styled.div`
  width: 320px;
  background: #1e293b;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const SceneContainer = styled.div`
  flex: 1;
  position: relative;
`

const RightPanel = styled.div`
  width: 360px;
  background: #1e293b;
  border-left: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const TabBar = styled.div`
  display: flex;
  background: #0f172a;
  border-bottom: 1px solid #334155;
`

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 12px;
  background: ${({ $active }) => $active ? '#1e293b' : '#0f172a'};
  border: none;
  color: ${({ $active }) => $active ? '#3b82f6' : '#94a3b8'};
  cursor: pointer;
  font-weight: ${({ $active }) => $active ? 'bold' : 'normal'};
  border-bottom: 2px solid ${({ $active }) => $active ? '#3b82f6' : 'transparent'};
  
  &:hover {
    background: #1e293b;
  }
`

const NotificationSettings = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`

const SettingsButton = styled.button<{ $active: boolean }>`
  padding: 4px 10px;
  background: ${({ $active }) => $active ? '#3b82f6' : '#334155'};
  border: none;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  
  &:hover {
    background: ${({ $active }) => $active ? '#2563eb' : '#475569'};
  }
`

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
`

const Header = styled.div`
  padding: 16px;
  background: #0f172a;
  border-bottom: 1px solid #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #3b82f6;
`

const ConnectionStatus = styled.span<{ $connected: boolean }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  background: ${({ $connected }) => $connected ? '#10b981' : '#ef4444'};
  color: white;
`

const Banner = styled.div<{ $variant: 'error' | 'warn' }>`
  margin: 8px 12px 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  background: ${({ $variant }) => ($variant === 'error' ? '#7f1d1d' : '#78350f')};
  color: ${({ $variant }) => ($variant === 'error' ? '#fecaca' : '#fde68a')};
`

const CloseButton = styled.button`
  padding: 8px 16px;
  background: #ef4444;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  
  &:hover {
    background: #dc2626;
  }
`

interface DigitalTwinPageProps {
  onClose?: () => void
}

export default function DigitalTwinPage({ onClose }: DigitalTwinPageProps) {
  const [activeTab, setActiveTab] = useState<'devices' | 'alerts' | 'charts' | 'rules' | 'scada' | 'trace'>('devices')
  const [showRules, setShowRules] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notifEnabled, setNotifEnabled] = useState(true)
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const {
    devices,
    alerts,
    stats,
    chartData,
    utilizationChartData,
    isConnected,
    apiAvailable,
    loadError,
    acknowledgeAlert,
    resolveAlert,
  } = useDigitalTwinData()

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device)
  }

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId)
    } catch (e) {
      console.error('[DigitalTwin] acknowledge failed:', e)
    }
  }

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId)
    } catch (e) {
      console.error('[DigitalTwin] resolve failed:', e)
    }
  }

  const runningCount = devices.filter((d) => d.status === 'running').length
  const onlineCount = devices.filter((d) => d.status !== 'offline').length
  const efficiency = stats?.averageEfficiency ?? 0

  return (
    <PageContainer>
      <ToastContainer />
      <LeftPanel>
        <Header>
          <Title>设备列表</Title>
          <ConnectionStatus $connected={isConnected && apiAvailable === true}>
            {apiAvailable === false
              ? '服务离线'
              : isConnected
                ? '实时已连接'
                : '事件同步'}
          </ConnectionStatus>
        </Header>
        {loadError && (
          <Banner $variant="error">
            {loadError}（请确认 gateway:10081 与 factory-service 已启动，且 .env 中已配置有效的 GATEWAY_TOKEN）
          </Banner>
        )}
        <PanelContent>
          {devices.length === 0 && apiAvailable !== false ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
              暂无设备数据
            </div>
          ) : (
            <DeviceStatus devices={devices} onDeviceSelect={handleDeviceClick} />
          )}
        </PanelContent>
      </LeftPanel>

      <MainArea>
        <Header>
          <Title>🏭 数字孪生工厂</Title>
          <CloseButton onClick={onClose}>退出</CloseButton>
        </Header>
        <SceneContainer>
          <FactoryScene
            devices={devices}
            onDeviceClick={handleDeviceClick}
            selectedDeviceId={selectedDevice?.id}
          />
        </SceneContainer>
      </MainArea>

      <RightPanel>
        <TabBar>
          <Tab $active={activeTab === 'devices'} onClick={() => setActiveTab('devices')}>
            设备详情
          </Tab>
          <Tab $active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
            告警 {alerts.filter((a) => a.status === 'triggered').length}
          </Tab>
          <Tab $active={activeTab === 'charts'} onClick={() => setActiveTab('charts')}>
            图表
          </Tab>
          <Tab $active={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>
            规则配置
          </Tab>
          <Tab $active={activeTab === 'scada'} onClick={() => setActiveTab('scada')}>
            SCADA
          </Tab>
          <Tab $active={activeTab === 'trace'} onClick={() => setActiveTab('trace')}>
            追溯
          </Tab>
        </TabBar>

        <PanelContent>
          {activeTab === 'devices' && (
            <div>
              {selectedDevice ? (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#3b82f6' }}>{selectedDevice.name}</h3>
                  <StatsRow>
                    <StatsCard
                      title="状态"
                      value={
                        selectedDevice.status === 'running'
                          ? '运行中'
                          : selectedDevice.status === 'idle'
                            ? '空闲'
                            : selectedDevice.status
                      }
                      color={selectedDevice.status === 'running' ? '#10b981' : '#f59e0b'}
                    />
                    <StatsCard title="类型" value={selectedDevice.type} color="#3b82f6" />
                  </StatsRow>
                  <StatsRow>
                    <StatsCard
                      title="X"
                      value={selectedDevice.position[0].toFixed(1)}
                      unit="m"
                      color="#8b5cf6"
                    />
                    <StatsCard
                      title="Z"
                      value={selectedDevice.position[2].toFixed(1)}
                      unit="m"
                      color="#8b5cf6"
                    />
                  </StatsRow>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                      实时产量
                    </div>
                    <DeviceChart
                      title="设备产量趋势"
                      data={chartData}
                      unit="件"
                      color="#10b981"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <AudioMonitor />
                </div>
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <AlertPanel
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onResolve={handleResolveAlert}
            />
          )}

          {activeTab === 'charts' && (
            <div>
              <NotificationSettings>
                <SettingsButton $active={soundEnabled} onClick={() => setSoundEnabled(!soundEnabled)}>
                  🔊 声音 {soundEnabled ? '开' : '关'}
                </SettingsButton>
                <SettingsButton $active={notifEnabled} onClick={() => setNotifEnabled(!notifEnabled)}>
                  🔔 通知 {notifEnabled ? '开' : '关'}
                </SettingsButton>
              </NotificationSettings>
              <StatsRow>
                <StatsCard title="在线设备" value={onlineCount} color="#10b981" />
                <StatsCard title="运行中" value={runningCount} color="#3b82f6" />
              </StatsRow>
              <StatsRow>
                <StatsCard
                  title="告警"
                  value={stats?.activeAlertCount ?? alerts.filter((a) => a.status === 'triggered').length}
                  color="#ef4444"
                />
                <StatsCard
                  title="效率"
                  value={efficiency.toFixed(1)}
                  unit="%"
                  color="#f59e0b"
                />
              </StatsRow>
              <DeviceChart title="今日产量" data={chartData} unit="件" color="#3b82f6" />
              <div style={{ height: '16px' }} />
              <DeviceChart
                title="设备利用率"
                data={utilizationChartData}
                unit="%"
                color="#8b5cf6"
              />
            </div>
          )}

          {activeTab === 'rules' && (
            <AlertRuleList />
          )}

          {activeTab === 'scada' && (
            <ScadaPanel
              equipmentCode={selectedDevice?.code}
              equipmentName={selectedDevice?.name}
            />
          )}

          {activeTab === 'trace' && (
            <TraceabilityPanel />
          )}
        </PanelContent>
      </RightPanel>
    </PageContainer>
  )
}
