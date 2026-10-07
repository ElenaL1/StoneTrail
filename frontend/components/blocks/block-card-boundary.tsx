"use client"

import { Component, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { failed: boolean }

export class BlockCardBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}
