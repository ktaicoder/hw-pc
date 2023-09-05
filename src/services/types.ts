export type FileDownloadStateKey =
  | 'none'
  | 'versionChecking'
  | 'preparing'
  | 'downloading'
  | 'saving'
  | 'completed'
  | 'error'

export const FileDownloadState: Record<FileDownloadStateKey, string> = {
  none: 'None',
  versionChecking: '버전 체크 중',
  preparing: '준비 중',
  downloading: '다운로드 중',
  saving: '저장 중',
  completed: '완료',
  error: '에러',
}

export type FileDownloadStatus =
  | { state: 'none' }
  | {
      state: 'versionChecking'
    }
  | {
      state: 'preparing'
      url: string
    }
  | {
      state: 'downloading'
      url: string
      contentLength: number
      downloadedBytes: number
    }
  | {
      state: 'downloaded'
      url: string
      contentLength: number
    }
  | {
      state: 'saving'
      contentLength: number
    }
  | {
      state: 'completed'
      url: string
      contentLength: number
    }
  | {
      state: 'error'
      url?: string
      error?: Error
    }
