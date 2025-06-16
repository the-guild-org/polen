import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Form, useActionData } from 'react-router'

// Minimal action - just log and return
const action = async ({ request }: { request: Request }) => {
  console.log('TEST ACTION CALLED - SERVER CHECK')
  console.log('typeof window:', typeof window)
  
  const formData = await request.formData()
  const message = formData.get('message')
  
  return { 
    received: message,
    timestamp: new Date().toISOString(),
    environment: typeof window === 'undefined' ? 'server' : 'client'
  }
}

// Minimal component with form
const Component = () => {
  const actionData = useActionData() as any
  
  return (
    <div>
      <h1>Test Action Route</h1>
      
      <Form method="post" action="/test-action">
        <input type="text" name="message" defaultValue="Hello" />
        <button type="submit">Submit</button>
      </Form>
      
      {actionData && (
        <div>
          <h2>Action Response:</h2>
          <pre>{JSON.stringify(actionData, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export const testAction = createRoute({
  path: 'test-action',
  Component,
  action,
})