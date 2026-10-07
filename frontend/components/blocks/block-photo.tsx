import Image from "next/image"

type BlockPhotoProps = {
  src?: string | null
  alt: string
  className?: string
}

export function BlockPhoto({ src, alt, className }: BlockPhotoProps) {
  if (!src?.trim()) return null
  return <Image src={src} alt={alt} fill className={className} unoptimized />
}
