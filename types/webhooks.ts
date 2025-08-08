export interface ServiceCreatedPayload {
  serviceId: string
  name: string
  providerId: string
  createdAt: string
  description?: string
  category?: string
  price?: number
  currency?: string
}

export interface BookingCreatedPayload {
  bookingId: string
  serviceId: string
  userId: string
  bookingDate: string
  status: string
  amount?: number
  currency?: string
  notes?: string
}

export interface TrackingUpdatedPayload {
  trackingId: string
  status: string
  location?: string
  updatedAt: string
  bookingId?: string
  serviceId?: string
  estimatedDelivery?: string
  notes?: string
}

export interface PaymentSucceededPayload {
  paymentId: string
  amount: number
  currency: string
  userId: string
  serviceId?: string
  bookingId?: string
  paymentDate: string
  paymentMethod?: string
  transactionId?: string
}

export type WebhookType = 'serviceCreation' | 'bookingCreated' | 'trackingUpdated' | 'paymentSucceeded'

export interface WebhookLog {
  id: string
  type: WebhookType
  payload: any
  error?: string
  attempts: number
  createdAt: string
} 