import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { useActionData } from 'react-router'

// Test action
const action = async ({ request }: { request: Request }) => {
  console.log('NATIVE FORM ACTION CALLED - SERVER CHECK')
  console.log('typeof window:', typeof window)
  
  const formData = await request.formData()
  const message = formData.get('message')
  
  return { 
    received: message,
    timestamp: new Date().toISOString(),
    environment: typeof window === 'undefined' ? 'server' : 'client'
  }
}

// Component with native HTML form
const Component = () => {
  const actionData = useActionData() as any
  
  return (
    <div>
      <h1>Test Native Form</h1>
      
      {/* Use native HTML form, not React Router Form */}
      <form method="post" action="/test-native-form">
        <input type="text" name="message" defaultValue="Hello Native" />
        <button type="submit">Submit Native</button>
      </form>
      
      {actionData && (
        <div>
          <h2>Action Response:</h2>
          <pre>{JSON.stringify(actionData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export const testNativeForm = createRoute({
  path: 'test-native-form',
  Component,
  action,
})