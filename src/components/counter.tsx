'use client'

import * as React from 'react'

export const Counter = () => {
  const [count, setCount] = React.useState(0)

  return <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
}
