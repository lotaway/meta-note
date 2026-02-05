import React from 'react'
import styled from 'styled-components'
import { SubtitleStyle } from '../types/Subtitle'

const PanelContainer = styled.div`
    position: absolute;
    top: 60px;
    right: 20px;
    background: rgba(40, 40, 40, 0.9);
    padding: 15px;
    border-radius: 8px;
    color: white;
    width: 200px;
    z-index: 10000;
    pointer-events: auto;
`

const FormGroup = styled.div`
    margin-bottom: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`

const Label = styled.label`
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
`

interface SubtitleSettingsPanelProps {
    style: SubtitleStyle
    onStyleChange: (newStyle: Partial<SubtitleStyle>) => void
}

const SubtitleSettingsPanel: React.FC<SubtitleSettingsPanelProps> = ({ style, onStyleChange }) => {
    return (
        <PanelContainer onClick={(e) => e.stopPropagation()}>
            <FormGroup>
                <Label>
                    Color: 
                    <input 
                        type="color" 
                        value={style.color} 
                        onChange={e => onStyleChange({ color: e.target.value })} 
                    />
                </Label>
            </FormGroup>
            <FormGroup>
                <Label>
                    Size: 
                    <input 
                        type="number" 
                        value={style.fontSize} 
                        onChange={e => onStyleChange({ fontSize: Number(e.target.value) })} 
                    />
                </Label>
            </FormGroup>
            <FormGroup>
                <Label>
                    Outline Color: 
                    <input 
                        type="color" 
                        value={style.strokeColor} 
                        onChange={e => onStyleChange({ strokeColor: e.target.value })} 
                    />
                </Label>
            </FormGroup>
            <FormGroup>
                <Label>
                    Outline Width: 
                    <input 
                        type="number" 
                        value={style.strokeWidth} 
                        onChange={e => onStyleChange({ strokeWidth: Number(e.target.value) })} 
                    />
                </Label>
            </FormGroup>
        </PanelContainer>
    )
}

export default SubtitleSettingsPanel
