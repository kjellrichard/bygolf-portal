import { useState, useEffect } from 'react'
import type { BayOption, Booking, ViewMode } from './types'
import { fetchBayOptions, fetchBookings } from './api'
import { CalendarView } from './components/CalendarView'
import {
    getStartOfDay,
    getEndOfDay,
    addDays,
    getWeekStart,
} from './utils/dateUtils'
import './App.css'

const TOKEN_STORAGE_KEY = 'bygolf_bearer_token'

function App() {
    const [bearerToken, setBearerToken] = useState<string>(() => {
        return localStorage.getItem(TOKEN_STORAGE_KEY) || ''
    })
    const [showTokenPrompt, setShowTokenPrompt] = useState<boolean>(false)
    const [showSettings, setShowSettings] = useState<boolean>(false)
    const today = new Date()
    const [viewMode, setViewMode] = useState<ViewMode>('day')
    const [startDate, setStartDate] = useState<Date>(today)
    const [endDate, setEndDate] = useState<Date>(today)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const [bayOptions, setBayOptions] = useState<BayOption[]>([])

    const loadBayOptions = async () => {
        const data = await fetchBayOptions({ bearerToken })
        setBayOptions(data)
    }
    const loadBookings = async (silent = false) => {

        if (!bearerToken.trim()) {
            setError('Please enter a bearer token')
            return
        }

        if (bayOptions.length === 0) {
            await loadBayOptions()
        }

        if (!silent) {
            setLoading(true)
        }
        setError(null)

        try {
            let fetchStartDate: Date = getStartOfDay(startDate)
            let fetchEndDate: Date = getEndOfDay(startDate)

            switch (viewMode) {
                case 'day':
                    fetchStartDate = getStartOfDay(startDate)
                    fetchEndDate = getEndOfDay(startDate)
                    break
                case '3days':
                    fetchStartDate = getStartOfDay(startDate)
                    fetchEndDate = getEndOfDay(addDays(startDate, 2))
                    break
                case 'week':
                    fetchStartDate = getStartOfDay(getWeekStart(startDate))
                    fetchEndDate = getEndOfDay(addDays(getWeekStart(startDate), 6))
                    break
            }

            // Use custom endDate if it's explicitly set and different from calculated range
            if (viewMode !== 'day' && endDate && endDate > fetchEndDate) {
                fetchEndDate = getEndOfDay(endDate)
            }

            const data = await fetchBookings(
                bearerToken,
                fetchStartDate,
                fetchEndDate
            )
            setBookings(data)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Failed to load bookings'
            )
            setBookings([])
        } finally {
            if (!silent) {
                setLoading(false)
            }
        }
    }

    // Check if token is needed on mount
    useEffect(() => {
        if (!bearerToken.trim()) {
            setShowTokenPrompt(true)
        }
    }, [])

    // Save token to localStorage when it changes
    useEffect(() => {
        if (bearerToken.trim()) {
            localStorage.setItem(TOKEN_STORAGE_KEY, bearerToken)
            setShowTokenPrompt(false)
            // Load bookings if token was just set and we don't have bookings yet
            if (bookings.length === 0 && !loading) {
                loadBookings(false)
            }
        } else {
            localStorage.removeItem(TOKEN_STORAGE_KEY)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bearerToken])

    useEffect(() => {
        if (bearerToken.trim()) {
            loadBookings()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, startDate, endDate])

    // Auto-refresh every 30 seconds when tab is active
    useEffect(() => {
        if (!bearerToken.trim()) return

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadBookings(true) // Silent refresh
            }
        }

        const handleFocus = () => {
            loadBookings(true) // Silent refresh
        }

        // Refresh on visibility change (tab becomes visible)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Refresh when window gets focus
        window.addEventListener('focus', handleFocus)

        // Set up interval to refresh every 30 seconds
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadBookings(true) // Silent refresh
            }
        }, 30000)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
            clearInterval(interval)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bearerToken, viewMode, startDate, endDate])

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode)
        // Update endDate based on view mode
        if (mode === 'day') {
            setEndDate(new Date(startDate))
        } else if (mode === '3days') {
            setEndDate(addDays(startDate, 2))
        } else if (mode === 'week') {
            setEndDate(addDays(getWeekStart(startDate), 6))
        }
    }

    const handleStartDateChange = (date: string) => {
        // Parse date string as local date (YYYY-MM-DD)
        const [year, month, day] = date.split('-').map(Number)
        const newDate = new Date(year, month - 1, day)
        setStartDate(newDate)
        handleViewModeChange(viewMode)
    }


    const formatDateInput = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const handleTokenSubmit = (token: string) => {
        setBearerToken(token)
        setShowTokenPrompt(false)
        // Automatically load bookings when token is set
        setTimeout(() => {
            loadBookings(false)
        }, 100)
    }

    return (
        <div className="app">
            {showTokenPrompt && (
                <div className="token-prompt-overlay">
                    <div className="token-prompt-modal">
                        <h2>Bearer Token Required</h2>
                        <p>Please enter your bearer token to access the calendar:</p>
                        <input
                            type="text"
                            placeholder="Enter bearer token"
                            className="token-prompt-input"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const input = e.currentTarget as HTMLInputElement
                                    if (input.value.trim()) {
                                        handleTokenSubmit(input.value.trim())
                                    }
                                }
                            }}
                            autoFocus
                        />
                        <div className="token-prompt-buttons">
                            <button
                                onClick={() => {
                                    const input = document.querySelector('.token-prompt-input') as HTMLInputElement
                                    if (input?.value.trim()) {
                                        handleTokenSubmit(input.value.trim())
                                    }
                                }}
                            >
                                Save Token
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header className="app-header">
                <h1>BYGOLF - Calendar</h1>
                <button
                    onClick={() => setShowSettings(true)}
                    className="settings-btn"
                    title="Settings"
                >
                    ⚙️
                </button>
            </header>

            {showSettings && (
                <div className="settings-overlay" onClick={() => setShowSettings(false)}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-header">
                            <h2>Settings</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="close-settings-btn"
                                title="Close"
                            >
                                ×
                            </button>
                        </div>
                        <div className="settings-content">
                            <div className="settings-group">
                                <label htmlFor="bearer-token">Bearer Token:</label>
                                <input
                                    id="bearer-token"
                                    type="text"
                                    value={bearerToken}
                                    onChange={(e) => setBearerToken(e.target.value)}
                                    placeholder="Enter bearer token"
                                    className="settings-token-input"
                                />
                                {bearerToken && (
                                    <button
                                        onClick={() => {
                                            setBearerToken('')
                                            setShowTokenPrompt(true)
                                        }}
                                        className="clear-token-btn"
                                        title="Clear token"
                                    >
                                        Clear Token
                                    </button>
                                )}
                            </div>
                            <div className="settings-actions">
                                <button
                                    onClick={() => {
                                        loadBookings(false)
                                        setShowSettings(false)
                                    }}
                                    disabled={loading}
                                    className="settings-load-btn"
                                >
                                    {loading ? 'Loading...' : 'Load Bookings'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="app-controls">
                <div className="control-group">

                    <div className="view-mode-buttons">
                        <button
                            className={viewMode === 'day' ? 'active' : ''}
                            onClick={() => handleViewModeChange('day')}
                        >
                            Day
                        </button>
                        <button
                            className={viewMode === '3days' ? 'active' : ''}
                            onClick={() => handleViewModeChange('3days')}
                        >
                            3 Days
                        </button>
                        <button
                            className={viewMode === 'week' ? 'active' : ''}
                            onClick={() => handleViewModeChange('week')}
                        >
                            Week
                        </button>
                    </div>
                </div>

                <div className="control-group">
                    <button
                        onClick={() => {
                            const newDate = addDays(startDate, -1)
                            setStartDate(newDate)
                            handleViewModeChange(viewMode)
                        }}
                        title="Previous day"
                    >
                        ←
                    </button>

                    <input
                        id="start-date"
                        type="date"
                        value={formatDateInput(startDate)}
                        onChange={(e) => handleStartDateChange(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            const newDate = addDays(startDate, 1)
                            setStartDate(newDate)
                            handleViewModeChange(viewMode)
                        }}
                        title="Next day"
                    >
                        →
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="calendar-container">
                {loading ? (
                    <div className="loading">Loading bookings...</div>
                ) : (
                    <CalendarView
                        bookings={bookings}
                        bayOptions={bayOptions}
                        viewMode={viewMode}
                        startDate={startDate}
                        endDate={endDate}
                    />
                )}
            </div>
        </div>
    )
}

export default App;

