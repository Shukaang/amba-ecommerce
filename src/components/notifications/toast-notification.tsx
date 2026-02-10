import { Toaster } from 'sonner'

export function ToastNotifications() {
  return (
    <Toaster
      position="top-right"
      richColors
      theme="light"
      closeButton
    />
  )
}

// Usage examples:
/*
import { toast } from 'sonner'

// Success notification
toast.success('Item added to cart!', {
  description: 'Your item has been added successfully.',
})

// Error notification
toast.error('Failed to add to cart', {
  description: 'Please try again later.',
})

// Loading notification
toast.loading('Processing your order...', {
  id: 'order-processing',
})

// Update loading notification
setTimeout(() => {
  toast.success('Order placed successfully!', {
    id: 'order-processing',
  })
}, 2000)

// Info notification
toast('New message', {
  description: 'You have a new notification',
})
*/
