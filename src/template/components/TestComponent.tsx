import React from 'react'

export const TestComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log(`TestComponent rendered!`)
  return <div style={{ border: `2px solid red`, padding: `10px` }}>TEST: {children}</div>
}
