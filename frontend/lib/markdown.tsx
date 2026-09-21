import type { ReactNode } from "react"

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /(!?\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g
  let last = 0
  let match: RegExpExecArray | null
  let index = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }
    if (match[1].startsWith("![")) {
      nodes.push(
        <img
          key={`${keyPrefix}-img-${index}`}
          src={match[3]}
          alt={match[2]}
          className="my-4 max-h-[480px] w-full rounded-xl object-cover"
        />,
      )
    } else if (match[1].startsWith("[")) {
      nodes.push(
        <a
          key={`${keyPrefix}-a-${index}`}
          href={match[3]}
          className="text-primary underline-offset-4 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {match[2]}
        </a>,
      )
    } else if (match[4]) {
      nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{match[4]}</strong>)
    } else if (match[5]) {
      nodes.push(<em key={`${keyPrefix}-i-${index}`}>{match[5]}</em>)
    } else if (match[6]) {
      nodes.push(
        <code key={`${keyPrefix}-c-${index}`} className="rounded bg-muted px-1 py-0.5 text-sm">
          {match[6]}
        </code>,
      )
    }
    last = match.index + match[0].length
    index += 1
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function MarkdownContent({ value }: { value: string }) {
  const lines = value.replace(/\r\n/g, "\n").split("\n")
  const blocks: ReactNode[] = []
  let index = 0
  let listItems: string[] = []
  let listType: "ul" | "ol" | null = null

  const flushList = () => {
    if (!listType || listItems.length === 0) return
    const items = listItems.map((item, itemIndex) => (
      <li key={`li-${index}-${itemIndex}`}>{renderInline(item, `li-${index}-${itemIndex}`)}</li>
    ))
    blocks.push(
      listType === "ol" ? (
        <ol key={`ol-${index}`} className="my-4 list-decimal space-y-1 pl-6">{items}</ol>
      ) : (
        <ul key={`ul-${index}`} className="my-4 list-disc space-y-1 pl-6">{items}</ul>
      ),
    )
    listItems = []
    listType = null
  }

  for (const line of lines) {
    const heading = /^(#{2,3})\s+(.+)$/.exec(line)
    const quote = /^>\s?(.*)$/.exec(line)
    const ul = /^[-*]\s+(.+)$/.exec(line)
    const ol = /^\d+\.\s+(.+)$/.exec(line)
    if (ul || ol) {
      const nextType = ul ? "ul" : "ol"
      if (listType && listType !== nextType) flushList()
      listType = nextType
      listItems.push((ul?.[1] ?? ol?.[1] ?? "").trim())
      continue
    }
    flushList()
    if (!line.trim()) {
      continue
    }
    if (heading) {
      const title = heading[2]
      if (heading[1] === "##") {
        blocks.push(
          <h2 key={`h-${index}`} className="mt-8 mb-3 text-2xl font-bold text-foreground">
            {renderInline(title, `h2-${index}`)}
          </h2>,
        )
      } else {
        blocks.push(
          <h3 key={`h-${index}`} className="mt-6 mb-2 text-xl font-semibold text-foreground">
            {renderInline(title, `h3-${index}`)}
          </h3>,
        )
      }
    } else if (quote) {
      blocks.push(
        <blockquote
          key={`q-${index}`}
          className="my-4 border-l-4 border-primary bg-muted/50 px-4 py-3 text-muted-foreground italic"
        >
          {renderInline(quote[1], `q-${index}`)}
        </blockquote>,
      )
    } else {
      blocks.push(
        <p key={`p-${index}`} className="my-4 text-lg leading-relaxed text-muted-foreground">
          {renderInline(line, `p-${index}`)}
        </p>,
      )
    }
    index += 1
  }
  flushList()
  return <div className="max-w-none">{blocks}</div>
}
