export enum FileIOResultStatus {
    Success,
    NoFile,
    ReadingError,
}

class FileIOResult {
    constructor(properties: {
                    status: FileIOResultStatus,
                    desc?: string,
                    data: any
                }
    ) {
    }

    static create(data: any) {
        return new FileIOResult({
            status: FileIOResultStatus.Success,
            desc: "file io result is success",
            data,
        })
    }

    static createError(status: FileIOResultStatus, other?: {
        desc?: string,
        data?: any,
    }) {
        return new FileIOResult({
            status,
            desc: other?.desc,
            data: other?.data,
        })
    }
}

export function readFile(inputElement: HTMLInputElement): Promise<FileIOResult> {
    let file = inputElement.files?.[0]
    if (!file)
        return Promise.reject(FileIOResult.createError(FileIOResultStatus.NoFile))
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    return new Promise((resolve, reject) => {
        reader.onloadend = e => {
            resolve(FileIOResult.create(Buffer.from(reader.result as string)))
        }
        reader.onerror = err => reject(FileIOResult.createError(FileIOResultStatus.ReadingError, {
            data: err
        }))
    })
}