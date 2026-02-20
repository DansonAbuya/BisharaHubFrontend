'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/layout/page-loading'
import { CalendarCheck, Clock, User, MapPin, Video, Phone, MessageCircle, Mail } from 'lucide-react'
import { listAppointments } from '@/lib/actions/services'
import type { ServiceAppointmentDto } from '@/lib/api'

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<ServiceAppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await listAppointments()
        setAppointments(data)
      } catch (err) {
        console.error('Failed to load appointments:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(a => a.status?.toLowerCase() === filter)

  const getStatusVariant = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'default'
      case 'completed': return 'secondary'
      case 'cancelled': return 'destructive'
      default: return 'outline'
    }
  }

  const getDeliveryIcon = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'VIDEO_CALL': return <Video className="w-4 h-4" />
      case 'PHONE_CALL': return <Phone className="w-4 h-4" />
      case 'WHATSAPP': return <MessageCircle className="w-4 h-4" />
      case 'EMAIL': return <Mail className="w-4 h-4" />
      case 'PHYSICAL': return <MapPin className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return <PageLoading message="Loading appointments..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
        <p className="text-muted-foreground">
          Manage your customer appointments and bookings
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground">No appointments yet</h3>
            <p className="text-muted-foreground mt-1">
              {filter === 'all' 
                ? "When customers book your services, their appointments will appear here."
                : `No ${filter} appointments found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment.appointmentId} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {appointment.serviceName || 'Service Appointment'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      {appointment.customerName || 'Customer'}
                      {appointment.customerPhone && (
                        <span className="text-xs">• {appointment.customerPhone}</span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusVariant(appointment.status)}>
                    {appointment.status || 'Pending'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {appointment.scheduledAt 
                        ? new Date(appointment.scheduledAt).toLocaleString()
                        : 'Time not set'}
                    </span>
                  </div>
                  {appointment.deliveryMethod && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getDeliveryIcon(appointment.deliveryMethod)}
                      <span className="capitalize">
                        {appointment.deliveryMethod.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {appointment.customerLocation && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <MapPin className="w-4 h-4" />
                      <span>{appointment.customerLocation}</span>
                    </div>
                  )}
                </div>
                {appointment.notes && (
                  <p className="mt-3 text-sm text-muted-foreground border-t pt-3">
                    {appointment.notes}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  {appointment.status?.toLowerCase() === 'pending' && (
                    <>
                      <Button size="sm">Confirm</Button>
                      <Button size="sm" variant="outline">Reschedule</Button>
                      <Button size="sm" variant="destructive">Cancel</Button>
                    </>
                  )}
                  {appointment.status?.toLowerCase() === 'confirmed' && (
                    <>
                      <Button size="sm">Mark Complete</Button>
                      <Button size="sm" variant="outline">Reschedule</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
