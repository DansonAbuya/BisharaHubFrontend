'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Clock, Save, Plus, Trash2 } from 'lucide-react'

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
]

interface TimeSlot {
  start: string
  end: string
}

interface DayAvailability {
  enabled: boolean
  slots: TimeSlot[]
}

type WeekAvailability = Record<string, DayAvailability>

const DEFAULT_AVAILABILITY: WeekAvailability = {
  monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  friday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
  saturday: { enabled: false, slots: [] },
  sunday: { enabled: false, slots: [] },
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const [availability, setAvailability] = useState<WeekAvailability>(DEFAULT_AVAILABILITY)
  const [saving, setSaving] = useState(false)

  const toggleDay = (dayId: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        enabled: !prev[dayId].enabled,
        slots: !prev[dayId].enabled ? [{ start: '09:00', end: '17:00' }] : prev[dayId].slots,
      },
    }))
  }

  const updateSlot = (dayId: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: prev[dayId].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }))
  }

  const addSlot = (dayId: string) => {
    setAvailability(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: [...prev[dayId].slots, { start: '09:00', end: '17:00' }],
      },
    }))
  }

  const removeSlot = (dayId: string, slotIndex: number) => {
    setAvailability(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: prev[dayId].slots.filter((_, i) => i !== slotIndex),
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Save availability to backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Availability saved successfully!')
    } catch (err) {
      console.error('Failed to save availability:', err)
      alert('Failed to save availability. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Availability</h1>
          <p className="text-muted-foreground">
            Set your working hours so customers know when they can book appointments
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Weekly Schedule
          </CardTitle>
          <CardDescription>
            Configure your availability for each day of the week. You can add multiple time slots per day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map((day) => {
              const dayAvail = availability[day.id]
              return (
                <div
                  key={day.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    dayAvail.enabled ? 'border-border bg-background' : 'border-muted bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={dayAvail.enabled}
                        onCheckedChange={() => toggleDay(day.id)}
                      />
                      <span className={`font-medium ${!dayAvail.enabled ? 'text-muted-foreground' : ''}`}>
                        {day.label}
                      </span>
                    </div>
                    {dayAvail.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSlot(day.id)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add slot
                      </Button>
                    )}
                  </div>

                  {dayAvail.enabled && (
                    <div className="space-y-2 ml-11">
                      {dayAvail.slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No time slots set. Click "Add slot" to add availability.
                        </p>
                      ) : (
                        dayAvail.slots.map((slot, slotIndex) => (
                          <div key={slotIndex} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(day.id, slotIndex, 'start', e.target.value)}
                              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                            />
                            <span className="text-muted-foreground">to</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(day.id, slotIndex, 'end', e.target.value)}
                              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                            />
                            {dayAvail.slots.length > 1 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-destructive hover:text-destructive"
                                onClick={() => removeSlot(day.id, slotIndex)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {!dayAvail.enabled && (
                    <p className="text-sm text-muted-foreground ml-11">
                      Unavailable
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>
            Configure how customers can book appointments with you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Minimum notice</p>
              <p className="text-sm text-muted-foreground">
                How much advance notice do you need for bookings?
              </p>
            </div>
            <select className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="0">No minimum</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="24">1 day</option>
              <option value="48">2 days</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Booking window</p>
              <p className="text-sm text-muted-foreground">
                How far in advance can customers book?
              </p>
            </div>
            <select className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="7">1 week</option>
              <option value="14">2 weeks</option>
              <option value="30">1 month</option>
              <option value="60">2 months</option>
              <option value="90">3 months</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Buffer time</p>
              <p className="text-sm text-muted-foreground">
                Time between appointments for preparation
              </p>
            </div>
            <select className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="0">No buffer</option>
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
