import { ContentRequestError } from "@/lib/content-request"

export function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (uploadUrl.startsWith("memory://")) {
    onProgress?.(100)
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(key, value)
    }
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      onProgress?.(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve()
        return
      }
      reject(new ContentRequestError(xhr.status, "network", "Не удалось отправить файл в хранилище."))
    }
    xhr.onerror = () => {
      reject(new ContentRequestError(0, "network", "Не удалось отправить файл в хранилище."))
    }
    xhr.send(file)
  })
}
