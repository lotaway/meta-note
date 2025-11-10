import { useState, useMemo } from 'react'
import { dialog } from '@electron/remote'

interface DirectorySelectorProps {
  title?: string
  buttonTitle?: string
  dialogTitle?: string
  placeholder?: string
  value?: string
  onButtonClick?: () => void
  onPathChange?: (path: string) => void
}

export default function DirectorySelector({
  title = "",
  buttonTitle = "选择",
  dialogTitle = "请选择文件夹",
  placeholder = "",
  value = "",
  onButtonClick,
  onPathChange
}: DirectorySelectorProps) {
  const [directory, setDirectory] = useState(value)

  const inputTip = useMemo(() => 
    directory ? `You're selected ${directory}` : `Please select a directory for ${title}`,
    [directory, title]
  )

  async function handleButtonClick() {
    onButtonClick?.()
    const openResult = await dialog.showOpenDialog({
      title: dialogTitle,
      defaultPath: directory,
      properties: ["openDirectory"]
    })
    if (openResult.canceled) return
    const newPath = openResult.filePaths[0]
    setDirectory(newPath)
    onPathChange?.(newPath)
  }

  return (
    <>
      <label htmlFor={title}>{title}</label>
      <input
        type="text"
        readOnly
        value={directory}
        id={title}
        placeholder={placeholder}
        title={inputTip}
      />
      <button type="button" onClick={handleButtonClick}>
        {buttonTitle}
      </button>
    </>
  )
}
