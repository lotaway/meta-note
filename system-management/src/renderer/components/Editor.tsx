import styled from "styled-components"
import { ShapeType } from "../../types/Editor"
import ToolBar from "./ToolBar"
import Viewport from "./Viewport"

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`

interface EditorProps {
    dragType: ShapeType | null
    setDragType: (v: ShapeType | null) => void
}

export default function Editor({ dragType, setDragType }: EditorProps) {
    return (
        <EditorContainer>
            <ToolBar setDragType={setDragType} />
            <Viewport dragType={dragType} setDragType={setDragType} />
        </EditorContainer>
    )
}
