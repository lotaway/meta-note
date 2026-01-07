import styled from 'styled-components'

export const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
`

export const SettingsToggle = styled.button<{ $active: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2000;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${({ $active }: { $active: boolean }) => ($active ? '#e74c3c' : '#3498db')};
  color: white;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
`

export const OverlayLayer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 1050;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
`

export const OverlayBody = styled.div`
  width: 80%;
  max-width: 800px;
  padding: 20px;
`

