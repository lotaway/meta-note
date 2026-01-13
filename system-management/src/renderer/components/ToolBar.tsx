import styled from "styled-components";
import { ShapeType } from "../../types/Editor";

const ToolbarContainer = styled.div`
  width: 120px;
  border-right: 1px solid #333;
  padding: 12px;
  background-color: #1e1e1e;
`

const ToolbarLabel = styled.div`
  margin-bottom: 12px;
  color: #888;
  font-size: 0.8em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const StyledToolItem = styled.div`
  padding: 12px;
  border: 1px solid #444;
  margin-bottom: 8px;
  border-radius: 4px;
  cursor: grab;
  background-color: #2a2a2a;
  color: #eee;
  text-align: center;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: #333;
    border-color: #555;
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(0);
  }
`

interface ToolBarProps {
    setDragType: (v: ShapeType) => void
}

const ToolItem = ({ type, setDragType }: { type: ShapeType; setDragType: (v: ShapeType) => void }) => (
    <StyledToolItem
        draggable
        onDragStart={() => setDragType(type)}
    >
        {type.charAt(0).toUpperCase() + type.slice(1)}
    </StyledToolItem>
)

export default function ToolBar({ setDragType }: ToolBarProps) {
    return (
        <ToolbarContainer>
            <ToolbarLabel>Draggables</ToolbarLabel>
            <ToolItem type="box" setDragType={setDragType} />
            <ToolItem type="sphere" setDragType={setDragType} />
            <ToolItem type="cone" setDragType={setDragType} />
        </ToolbarContainer>
    )
}
