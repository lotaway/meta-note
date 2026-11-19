import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useMousePosition, useScroll } from '../utils/hooks'
import Files2video from '../features/Files2video'
import { APP_DISPLAY_NAME } from '../../brand'
import { currentLanguage, setLanguage, type AppLanguage } from '../i18n'

enum Status {
    NoInit,
    Loading,
    Loaded,
    End,
    Error
}

interface States {
    welcomeTitle: string
    status: Status
}

const SettingsContainer = styled.div`
  padding: 20px;
`

const MainTitle = styled.h1`
  margin-top: 0;
`

const SubTitle = styled.span`
  color: #666;
  font-size: 1.1em;
`

const ContentSection = styled.div`
  margin-top: 20px;
`

const ActionButtonContainer = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`

const PremiumButton = styled.button<{ $bgColor: string }>`
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  background-color: ${props => props.$bgColor};
  box-shadow: 0 2px 10px ${props => props.$bgColor}4D; // 30% opacity
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px ${props => props.$bgColor}66; // 40% opacity
  }

  &:active {
    transform: translateY(0);
  }
`

const TooltipText = styled.div`
  color: #666;
  font-size: 12px;
  margin-bottom: 20px;
`

const InfoRow = styled.div`
  margin-bottom: 10px;
  display: flex;
  gap: 15px;
`

const InfoItem = styled.span`
  background: #2a2a2a;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  color: #44aa88;
`

const LanguageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`

const LanguageButton = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border: 1px solid ${props => props.$active ? '#10a37f' : '#555'};
  border-radius: 5px;
  background: ${props => props.$active ? '#10a37f' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#ccc'};
  cursor: pointer;
  font-weight: ${props => props.$active ? 'bold' : 'normal'};

  &:hover {
    border-color: #10a37f;
  }
`

const LanguageSwitcher = () => {
    const active = currentLanguage()
    return (
        <LanguageRow>
            <LanguageButton $active={active === 'zh-CN'} onClick={() => setLanguage('zh-CN' as AppLanguage)}>简体中文</LanguageButton>
            <LanguageButton $active={active === 'en'} onClick={() => setLanguage('en' as AppLanguage)}>English</LanguageButton>
        </LanguageRow>
    )
}

const invokeIpc = (action: () => Promise<void>, label: string): void => {
    void action().catch(err => console.error(`[Settings] ${label} failed:`, err))
}

const ActionButtons = () => (
    <ActionButtonContainer>
        <PremiumButton
            $bgColor="#10a37f"
            onClick={() => invokeIpc(() => window.desktop.openMonitor('chatgpt'), 'openMonitor chatgpt')}
        >
            Open ChatGPT Monitor (In-app)
        </PremiumButton>
        <PremiumButton
            $bgColor="#4285f4"
            onClick={() => invokeIpc(() => window.desktop.openExternalLogin('chatgpt'), 'openExternalLogin chatgpt')}
        >
            ChatGPT Login (System Browser)
        </PremiumButton>
        <PremiumButton
            $bgColor="#10b981"
            onClick={() => invokeIpc(() => window.desktop.openMonitor('deepseek'), 'openMonitor deepseek')}
        >
            Open DeepSeek Monitor (In-app)
        </PremiumButton>
        <PremiumButton
            $bgColor="#6366f1"
            onClick={() => invokeIpc(() => window.desktop.openExternalLogin('deepseek'), 'openExternalLogin deepseek')}
        >
            DeepSeek Login (System Browser)
        </PremiumButton>
    </ActionButtonContainer>
)

const InfoDisplay = () => {
    const scrollInfo = useScroll()
    const mousePosition = useMousePosition()

    return (
        <>
            <InfoRow>
                <InfoItem>Scroll - T: {scrollInfo.top}, L: {scrollInfo.left}</InfoItem>
                <InfoItem>Mouse - X: {mousePosition.x}, Y: {mousePosition.y}</InfoItem>
            </InfoRow>
        </>
    )
}

export default function Settings() {
    const [name] = useState<string>(APP_DISPLAY_NAME)
    const [commonData, setCommonData] = useState<States>({
        welcomeTitle: `welcome to use ${APP_DISPLAY_NAME}`,
        status: Status.NoInit
    })

    useEffect(() => {
        setCommonData(prev => ({ ...prev, status: Status.Loaded }))
    }, [])

    return (
        <SettingsContainer>
            <MainTitle>{name}</MainTitle>
            <SubTitle>{commonData.welcomeTitle}</SubTitle>
            <ContentSection>
                <LanguageSwitcher />
                <InfoDisplay />
                <ActionButtons />
                <TooltipText>
                    * If Google login fails in Electron, use the button above to login in your system browser.
                </TooltipText>
                <Files2video />
            </ContentSection>
        </SettingsContainer>
    )
}
