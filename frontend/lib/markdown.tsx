import type { ReactNode } from "react"

type ColumnAlign = "left" | "center" | "right"

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

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith("|") && trimmed.endsWith("|") && trimmed.length > 1
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function isSeparatorRow(line: string): boolean {
  if (!isTableRow(line)) return false
  const cells = splitCells(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function columnAlignments(line: string): ColumnAlign[] {
  return splitCells(line).map((cell) => {
    const left = cell.startsWith(":")
    const right = cell.endsWith(":")
    if (left && right) return "center"
    if (right) return "right"
    return "left"
  })
}

function alignClass(align: ColumnAlign | undefined): string {
  if (align === "center") return "text-center"
  if (align === "right") return "text-right"
  return "text-left"
}

function renderTable(header: string[], align: ColumnAlign[], rows: string[][], index: number): ReactNode {
  return (
    <div key={`table-${index}`} className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-base">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {header.map((cell, cellIndex) => (
              <th
                key={`th-${index}-${cellIndex}`}
                scope="col"
                className={`px-4 py-3 font-semibold text-foreground ${alignClass(align[cellIndex])}`}
              >
                {renderInline(cell, `th-${index}-${cellIndex}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`tr-${index}-${rowIndex}`} className="border-b border-border last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={`td-${index}-${rowIndex}-${cellIndex}`}
                  className={`px-4 py-3 text-muted-foreground ${alignClass(align[cellIndex])}`}
                >
                  {renderInline(cell, `td-${index}-${rowIndex}-${cellIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
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

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]
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
    if (isTableRow(line) && lineIndex + 1 < lines.length && isSeparatorRow(lines[lineIndex + 1])) {
      const header = splitCells(line)
      const align = columnAlignments(lines[lineIndex + 1])
      const rows: string[][] = []
      lineIndex += 2
      while (lineIndex < lines.length && isTableRow(lines[lineIndex]) && !isSeparatorRow(lines[lineIndex])) {
        rows.push(splitCells(lines[lineIndex]))
        lineIndex += 1
      }
      lineIndex -= 1
      blocks.push(renderTable(header, align, rows, index))
      index += 1
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
