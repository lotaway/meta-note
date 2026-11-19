import { t } from '../i18n'
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
          <Title>{t('digitalTwin.deviceList')}</Title>
          <ConnectionStatus $connected={isConnected && apiAvailable === true}>
            {apiAvailable === false
              ? t('digitalTwin.serviceOffline')
              : isConnected
                ? t('digitalTwin.realtimeConnected')
                : t('digitalTwin.eventSync')}
          </ConnectionStatus>
        </Header>
        {loadError && (
          <Banner $variant="error">
            {loadError} {t('digitalTwin.loadErrorHint')}
          </Banner>
        )}
        <PanelContent>
          {devices.length === 0 && apiAvailable !== false ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>{t('digitalTwin.noDevices')}</div>
          ) : (
            <DeviceStatus devices={devices} onDeviceSelect={handleDeviceClick} />
          )}
        </PanelContent>
      </LeftPanel>

      <MainArea>
        <Header>
          <Title>{t('digitalTwin.pageTitle')}</Title>
          <CloseButton onClick={onClose}>{t('digitalTwin.exit')}</CloseButton>
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
          <Tab $active={activeTab === 'devices'} onClick={() => setActiveTab('devices')}>{t('digitalTwin.tab.device')}</Tab>
          <Tab $active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')}>
            {t('digitalTwin.alertCount', { count: alerts.filter((a) => a.status === 'triggered').length })}          </Tab>
          <Tab $active={activeTab === 'charts'} onClick={() => setActiveTab('charts')}>{t('digitalTwin.tab.chart')}</Tab>
          <Tab $active={activeTab === 'rules'} onClick={() => setActiveTab('rules')}>{t('digitalTwin.tab.rule')}</Tab>
          <Tab $active={activeTab === 'scada'} onClick={() => setActiveTab('scada')}>
            SCADA
          </Tab>
          <Tab $active={activeTab === 'trace'} onClick={() => setActiveTab('trace')}>{t('digitalTwin.tab.trace')}</Tab>
        </TabBar>

        <PanelContent>
          {activeTab === 'devices' && (
            <div>
              {selectedDevice ? (
                <div>
                  <h3 style={{ margin: '0 0 16px 0', color: '#3b82f6' }}>{selectedDevice.name}</h3>
                  <StatsRow>
                    <StatsCard
                      title={t('alertRule.column.status')}
                      value={
                        selectedDevice.status === 'running'
                          ? t('device.status.running')
                          : selectedDevice.status === 'idle'
                            ? t('device.status.idle')
                            : selectedDevice.status
                      }
                      color={selectedDevice.status === 'running' ? '#10b981' : '#f59e0b'}
                    />
                    <StatsCard title={t('digitalTwin.typeTitle')} value={selectedDevice.type} color="#3b82f6" />
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
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{t('digitalTwin.realtimeOutput')}</div>
                    <DeviceChart
                      title={t('digitalTwin.outputTrend')}
                      data={chartData}
                      unit={t('digitalTwin.unitPiece')}
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
                  {t('digitalTwin.sound')} {soundEnabled ? t('common.on') : t('common.off')}
                </SettingsButton>
                <SettingsButton $active={notifEnabled} onClick={() => setNotifEnabled(!notifEnabled)}>
                  {t('digitalTwin.notification')} {notifEnabled ? t('common.on') : t('common.off')}
                </SettingsButton>
              </NotificationSettings>
              <StatsRow>
                <StatsCard title={t('digitalTwin.onlineDevices')} value={onlineCount} color="#10b981" />
                <StatsCard title={t('device.status.running')} value={runningCount} color="#3b82f6" />
              </StatsRow>
              <StatsRow>
                <StatsCard
                  title={t('device.status.warning')}
                  value={stats?.activeAlertCount ?? alerts.filter((a) => a.status === 'triggered').length}
                  color="#ef4444"
                />
                <StatsCard
                  title={t('digitalTwin.efficiency')}
                  value={efficiency.toFixed(1)}
                  unit="%"
                  color="#f59e0b"
                />
              </StatsRow>
              <DeviceChart title={t('digitalTwin.todayOutput')} data={chartData} unit={t('digitalTwin.unitPiece')} color="#3b82f6" />
              <div style={{ height: '16px' }} />
              <DeviceChart
                title={t('digitalTwin.deviceUtilization')}
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
