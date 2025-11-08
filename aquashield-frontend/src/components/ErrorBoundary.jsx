import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('Component error:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <pre style={{ padding: 16, background: '#2b2b2b', color: '#ffb4b4', whiteSpace: 'pre-wrap' }}>
          {String(this.state.error)}
        </pre>
      )
    }
    return this.props.children
  }
}