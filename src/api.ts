import type { Booking } from './types'
import { getStartOfDay, getEndOfDay, addDays } from './utils/dateUtils'

const API_BASE_URL = 'https://api.yourgolfbooking.com'

export async function fetchBookings(
  bearerToken: string,
  startDate: Date,
  endDate: Date
): Promise<Booking[]> {
  // Use local date range
  const fetchStartDate = getStartOfDay(startDate)
  const fetchEndDate = getEndOfDay(endDate)

  // Format dates for API - use local date with timezone offset
  const formatDateForAPI = (date: Date, mode: 'start' | 'end'): string => {
    date.setHours(12)
    return mode === 'start' ? date.toISOString().split('T')[0] + 'T00:00:00' : date.toISOString().split('T')[0] + 'T23:59:59'
  }
  let current = new Date(fetchStartDate)
  const bookings: Booking[] = []

  while (current < fetchEndDate) {

    const startGte = encodeURIComponent(formatDateForAPI(current, 'start'))
    const startLte = encodeURIComponent(formatDateForAPI(current, 'end'))
    const url = `${API_BASE_URL}/venue/bygolf/bookings/public-admin?start_gte=${startGte}&start_lte=${startLte}`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`
      },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch bookings: ${response.statusText}`)
    }
    const data = await response.json()
    bookings.push(...data)
    current = addDays(current, 1)
  }

  return bookings
}

