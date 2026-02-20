'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/layout/page-loading'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Video, MapPin } from 'lucide-react'
import { listAppointments } from '@/lib/actions/services'
import type { ServiceAppointmentDto } from '@/lib/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function SchedulePage() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState<ServiceAppointmentDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await listAppointments()
        setAppointments(data.filter(a => a.status?.toLowerCase() !== 'cancelled'))
      } catch (err) {
        console.error('Failed to load appointments:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate)

  const getAppointmentsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return appointments.filter(a => {
      if (!a.scheduledAt) return false
      const appointmentDate = new Date(a.scheduledAt)
      return (
        appointmentDate.getFullYear() === date.getFullYear() &&
        appointmentDate.getMonth() === date.getMonth() &&
        appointmentDate.getDate() === date.getDate()
      )
    })
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    setSelectedDate(null)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    )
  }

  const selectedDateAppointments = selectedDate
    ? appointments.filter(a => {
        if (!a.scheduledAt) return false
        const appointmentDate = new Date(a.scheduledAt)
        return (
          appointmentDate.getFullYear() === selectedDate.getFullYear() &&
          appointmentDate.getMonth() === selectedDate.getMonth() &&
          appointmentDate.getDate() === selectedDate.getDate()
        )
      })
    : []

  if (loading) {
    return <PageLoading message="Loading schedule..." />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
        <p className="text-muted-foreground">
          View your appointments calendar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first of the month */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayAppointments = getAppointmentsForDate(day)
                const hasAppointments = dayAppointments.length > 0
                const isSelected = selectedDate?.getDate() === day && 
                  selectedDate?.getMonth() === currentDate.getMonth() &&
                  selectedDate?.getFullYear() === currentDate.getFullYear()

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                    className={`
                      aspect-square p-1 rounded-lg text-sm font-medium transition-colors relative
                      ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                      ${isSelected && !isToday(day) ? 'bg-primary/20 ring-2 ring-primary' : ''}
                      ${!isToday(day) && !isSelected ? 'hover:bg-muted' : ''}
                    `}
                  >
                    {day}
                    {hasAppointments && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {selectedDate 
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a date'}
            </CardTitle>
            <CardDescription>
              {selectedDate 
                ? `${selectedDateAppointments.length} appointment(s)`
                : 'Click on a date to view appointments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Select a date on the calendar to view appointments
              </p>
            ) : selectedDateAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No appointments scheduled for this date
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.appointmentId}
                    className="p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{appointment.serviceName}</p>
                      <Badge variant="outline" className="text-xs">
                        {appointment.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {appointment.scheduledAt 
                          ? new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Time TBD'}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {appointment.customerName || 'Customer'}
                      </div>
                      {appointment.deliveryMethod && (
                        <div className="flex items-center gap-1">
                          {appointment.deliveryMethod === 'PHYSICAL' ? (
                            <MapPin className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          <span className="capitalize">
                            {appointment.deliveryMethod.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
