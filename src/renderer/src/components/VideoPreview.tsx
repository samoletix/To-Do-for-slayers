import { useEffect, useState, type ReactNode } from 'react'
import { t } from '@shared/strings'
import { assetDataUrl, youtubeThumbnail } from '../lib'

interface Props {
  videoUrl: string
  previewPath: string
  alt: string
}

/** Превью строки: своя картинка, иначе обложка ролика YouTube.
 *  Внешние хосты закрыты CSP, поэтому всё грузится через main-процесс как data:URL. */
export default function VideoPreview({ videoUrl, previewPath, alt }: Props): ReactNode | null {
  const [src, setSrc] = useState<string | null>(null)
  const [broken, setBroken] = useState(false)

  const remote = previewPath ? null : youtubeThumbnail(videoUrl)

  useEffect(() => {
    let alive = true
    setBroken(false)
    setSrc(null)

    if (previewPath) {
      void assetDataUrl(previewPath).then((url) => {
        if (!alive) return
        if (url) setSrc(url)
        else setBroken(true)
      })
      return () => {
        alive = false
      }
    }

    if (!remote) return
    void window.api
      .fetchImage(remote)
      .then((url) => {
        if (alive) setSrc(url)
      })
      .catch(() => {
        if (alive) setBroken(true)
      })
    return () => {
      alive = false
    }
  }, [previewPath, remote])

  if (!previewPath && !remote) return null

  return (
    <span className="preview" title={t(broken ? 'Превью недоступно' : 'Превью видео')}>
      {src && !broken ? <img className="preview__img" src={src} alt={alt} draggable={false} /> : null}
      {broken ? <span className="preview__fallback">▶</span> : null}
    </span>
  )
}
