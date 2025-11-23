import { useMemo, useState, useEffect } from 'react'
import type { BayOption, Booking, ViewMode } from '../types'
import {
  getStartOfDay,
  getEndOfDay,
  getDaysInRange,
  addDays,
  getWeekStart,
  formatDate,
  formatTime,
} from '../utils/dateUtils'
import './CalendarView.css'

interface CalendarViewProps {
  bookings: Booking[]
  bayOptions: BayOption[]
  viewMode: ViewMode
  startDate: Date
  endDate: Date
}

export function CalendarView({
  bookings,
  bayOptions,
  viewMode,
  startDate,
  endDate,
}: CalendarViewProps) {
  const daysToShow = useMemo(() => {
    let rangeStart: Date
    let rangeEnd: Date

    switch (viewMode) {
      case 'day':
        rangeStart = getStartOfDay(startDate)
        rangeEnd = getEndOfDay(startDate)
        break
      case '3days':
        rangeStart = getStartOfDay(startDate)
        rangeEnd = getEndOfDay(addDays(startDate, 2))
        break
      case 'week':
        rangeStart = getStartOfDay(getWeekStart(startDate))
        rangeEnd = getEndOfDay(addDays(getWeekStart(startDate), 6))
        break
    }

    return getDaysInRange(rangeStart, rangeEnd)
  }, [viewMode, startDate, endDate])

  const bookingsByDayAndBay = useMemo(() => {
    const map = new Map<string, Map<string, Booking[]>>()

    daysToShow.forEach((day) => {
      const dayKey = formatDate(day)
      const bayMap = new Map<string, Booking[]>()
      bayMap.set('1', [])
      bayMap.set('2', [])
      map.set(dayKey, bayMap)
    })

    bookings.forEach((booking) => {
      const bookingStart = new Date(booking.start)
      const bookingEnd = new Date(booking.end)
      const bayRef = booking.bayRef || '1'

      daysToShow.forEach((day) => {
        const dayStart = getStartOfDay(day)
        const dayEnd = getEndOfDay(day)

        // Check if booking overlaps with this day
        if (bookingStart <= dayEnd && bookingEnd >= dayStart) {
          const dayKey = formatDate(day)
          const bayMap = map.get(dayKey)
          if (bayMap) {
            const bayBookings = bayMap.get(bayRef) || []
            bayBookings.push(booking)
            bayMap.set(bayRef, bayBookings)
          }
        }
      })
    })

    return map
  }, [bookings, daysToShow])

  // Calculate booking stats per day
  const dayStats = useMemo(() => {
    const stats = new Map<string, { count: number; totalHours: number }>()

    daysToShow.forEach((day) => {
      const dayKey = formatDate(day)
      const dayStart = getStartOfDay(day)
      const dayEnd = getEndOfDay(day)

      const dayBookings = bookings.filter((booking) => {
        const bookingStart = new Date(booking.start)
        const bookingEnd = new Date(booking.end)
        return bookingStart <= dayEnd && bookingEnd >= dayStart
      })

      let totalHours = 0
      dayBookings.forEach((booking) => {
        const bookingStart = new Date(booking.start)
        const bookingEnd = new Date(booking.end)

        // Calculate overlap with the day
        const overlapStart = bookingStart < dayStart ? dayStart : bookingStart
        const overlapEnd = bookingEnd > dayEnd ? dayEnd : bookingEnd
        const hours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60)
        totalHours += hours
      })

      stats.set(dayKey, {
        count: dayBookings.length,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      })
    })

    return stats
  }, [bookings, daysToShow])

  const hours = Array.from({ length: 18 }, (_, i) => i + 6)

  const bays = ['1', '2']

  // Force re-render every 30 seconds to update current time marker
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setTick((prev) => prev + 1)
      }
    }, 1000 * 60 * 1) // 1 minute

    const handleFocus = () => {
      setTick((prev) => prev + 1)
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Calculate current time position for today
  const now = new Date()
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  const getCurrentTimePosition = (day: Date) => {
    if (!isToday(day)) return null

    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Only show if current time is within the displayed hours (6-23)
    if (currentHour < 6 || currentHour > 23) return null

    // Calculate position as percentage within the hour
    const hourIndex = currentHour - 6
    const positionInHour = (currentMinute / 60) * 100
    const topPosition = (hourIndex * 40) + (positionInHour / 100 * 40)

    return topPosition
  }

  return (
    <div className="calendar-view">
      <div className="calendar-scroll-container">
        <div className="calendar-header">
          <div className="time-column-header"></div>
          {daysToShow.map((day) => {
            const dayKey = formatDate(day)
            const stats = dayStats.get(dayKey) || { count: 0, totalHours: 0 }
            return (
              <div key={dayKey} className="calendar-day-group">
                <div className="calendar-day-header">
                  <div className="day-header-left">

                    <div className="day-date">{day.toLocaleDateString('en-US', { weekday: 'short' })} {dayKey}</div>
                  </div>
                  <div className="day-header-right">
                    <div className="day-stats">
                      {stats.count} {stats.count === 1 ? 'booking' : 'bookings'} • {stats.totalHours}h
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="calendar-body">
          <div className="time-column">
            {hours.map((hour) => (
              <div key={hour} className="time-slot">
                {String(hour).padStart(2, '0')}:00
              </div>
            ))}
            {daysToShow.some(day => isToday(day)) && (() => {
              const today = daysToShow.find(day => isToday(day))
              if (!today) return null
              const currentTimePosition = getCurrentTimePosition(today)
              return currentTimePosition !== null ? (
                <div
                  className="current-time-marker-time-column"
                  style={{ top: `${currentTimePosition}px` }}
                />
              ) : null
            })()}
          </div>

          {daysToShow.map((day) => {
            const dayKey = formatDate(day)
            const bayMap = bookingsByDayAndBay.get(dayKey) || new Map() as Map<string, Booking[]>

            return (
              <div key={dayKey} className="calendar-day-group-column">
                {bays.map((bay) => {
                  const bayBookings = bayMap.get(bay) || []

                  const currentTimePosition = getCurrentTimePosition(day)

                  return (
                    <div key={`${dayKey}-${bay}`} className="calendar-bay-column">
                      {currentTimePosition !== null && (
                        <div
                          className="current-time-marker"
                          style={{ top: `${currentTimePosition}px` }}
                        />
                      )}
                      {hours.map((hour) => {
                        const hourStart = new Date(day)
                        hourStart.setHours(hour, 0, 0, 0)
                        const hourEnd = new Date(day)
                        hourEnd.setHours(hour + 1, 0, 0, 0)

                        const hourBookings = bayBookings.filter((booking) => {
                          const bookingStart = new Date(booking.start)
                          const bookingEnd = new Date(booking.end)
                          return bookingStart < hourEnd && bookingEnd > hourStart
                        })

                        return (
                          <div key={hour} className="time-cell">
                            {hourBookings.map((booking) => {
                              const bookingStart = new Date(booking.start)
                              const bookingEnd = new Date(booking.end)
                              const startMinutes =
                                bookingStart.getHours() * 60 +
                                bookingStart.getMinutes()
                              const endMinutes =
                                bookingEnd.getHours() * 60 + bookingEnd.getMinutes()
                              const duration = endMinutes - startMinutes
                              const topOffset =
                                ((startMinutes % 60) / 60) * 100
                              const height = (duration / 60) * 100
                              const bayOption = bayOptions.find(option => option.id === booking.bayOptionId)
                              // Only render if this hour contains the booking start
                              if (
                                bookingStart >= hourStart &&
                                bookingStart < hourEnd
                              ) {
                                return (
                                  <div
                                    key={booking.id}
                                    className={`booking-block ${booking.status} ${booking.paymentStatus}`}
                                    style={{
                                      top: `${topOffset}%`,
                                      height: `${Math.max(height, 5)}%`,
                                    }}
                                    title={`${booking.user.name} - ${bayOption?.name} - ${formatTime(bookingStart)}-${formatTime(bookingEnd)}`}
                                  >
                                    <div className="booking-user">
                                      {booking.user.name} - {bayOption?.name}
                                    </div>
                                    <div className="booking-time">
                                      {booking.players} {booking.players === 1 ? 'player' : 'players'} | {formatTime(bookingStart)} - {formatTime(bookingEnd)}
                                    </div>

                                    {booking.notes && (
                                      <div className="booking-notes">{booking.notes}</div>
                                    )}

                                  </div>
                                )
                              }
                              return null
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

