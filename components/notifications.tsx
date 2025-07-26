import { useEffect, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase'
import type { Notification } from '../lib/notification-types'

export default function Notifications() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const supabase = getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const supabase = getSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      const supabase = getSupabaseClient()
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('read', false)
        .order('created_at', { ascending: false })
        .then(({ data }) => setNotifications(
          (data || []).map(n => ({
            ...n,
            id: n.id.toString(), // Convert number to string
            type: n.type || 'notification', // Provide default value for null type
            message: n.message || '', // Provide default value for null message
            created_at: n.created_at || new Date().toISOString(), // Provide default value for null created_at
            is_read: n.is_read ?? false, // Provide default value for null is_read
            read: n.read ?? false,
          }))
        ))
    }
  }, [user])

  const markAsRead = async (id: string) => {
    const supabase = getSupabaseClient()
    await supabase.from('notifications').update({ read: true }).eq('id', parseInt(id))
    setNotifications(notifications.filter(n => n.id !== id))
  }

  if (!user) return null
  return (
    <div>
      <h3>Notifications</h3>
      <ul>
        {notifications.map(n => (
          <li key={n.id}>
            {n.message}
            <button onClick={() => markAsRead(n.id)} style={{ marginLeft: 8 }}>Mark as read</button>
          </li>
        ))}
        {notifications.length === 0 && <li>No new notifications.</li>}
      </ul>
    </div>
  )
}