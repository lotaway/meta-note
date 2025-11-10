import { useState, useEffect, useMemo } from 'react'
import { ipcRenderer } from 'electron'
import DirectorySelector from '../components/DirectorySelector'

interface SelectorVal {
  title: string
  desc: string
  placeholder?: string
  directoryPath: string
}

interface Files2videoProps {
  buttonTitle?: string
}

export default function Files2video({ buttonTitle = "Select" }: Files2videoProps) {
  const [selectors, setSelectors] = useState<SelectorVal[]>([
    {
      title: "General Folder:",
      desc: "the files in General will be used in all videos(Intro, Closer...)",
      directoryPath: ""
    },
    {
      title: "Widgets Folder:",
      desc: "a folder with files related to a platform",
      directoryPath: ""
    },
    {
      title: "Platform Folder:",
      desc: "a folder with sub-folders, each of them related to a different widget.",
      directoryPath: ""
    }
  ])
  const [videoPaths, setVideoPaths] = useState<string[]>([])

  const hasSelected = useMemo(() => 
    selectors.filter(selector => selector.directoryPath).length === selectors.length,
    [selectors]
  )

  async function pathChangeHandler(index: number, directoryPath: string) {
    const newSelectors = [...selectors]
    newSelectors[index].directoryPath = directoryPath
    setSelectors(newSelectors)
    
    const result: { names: string[], paths: string[] } = await ipcRenderer.invoke("readFileInDirectory", directoryPath)
    setVideoPaths(result.paths.filter(path => path.match(/.(mp4|flv)$/) !== null))
  }

  async function generateVideo() {
    if (videoPaths.length === 0) {
      return Promise.reject("没有视频")
    }
    
    const updatedSelectors = selectors.map(selector => ({
      ...selector,
      title: 'Please ' + selector.title.toLowerCase()
    }))
    setSelectors(updatedSelectors)
    
    return await ipcRenderer.invoke("mergeVideo", videoPaths.map(item => String(item)))
  }

  useEffect(() => {
    const defaultDirectory = localStorage.getItem("Files2video:Directory")
    if (!defaultDirectory) return
  }, [])

  return (
    <div className="file2video">
      <ul className="list list-select">
        {selectors.map((s, sIndex) => (
          <li key={s.title} className="item item-select">
            <DirectorySelector 
              title={s.title}
              buttonTitle={buttonTitle}
              placeholder={s.placeholder}
              onPathChange={(filePaths) => pathChangeHandler(sIndex, filePaths)}
            />
          </li>
        ))}
      </ul>
      <button 
        className={`btn btn-generate ${hasSelected ? 'active' : 'no-active'}`}
        onClick={generateVideo}
      >
        GENERATE
      </button>
    </div>
  )
}
