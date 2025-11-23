# ByGolf Portal - Calendar View

A React-based calendar application for viewing golf bookings from the YourGolfBooking API.

## Features

- **Multiple View Modes**: View bookings by day, 3 days, week, or month
- **Date Range Selection**: Select custom date intervals
- **Bearer Token Authentication**: Input and use your bearer token for API access
- **Visual Calendar**: Time-based calendar view with color-coded booking statuses
- **Booking Details**: Hover over bookings to see details (user, bay, time, players)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

1. Enter your bearer token in the input field
2. Select a view mode (Day, 3 Days, Week, or Month)
3. Choose your start date (and end date if not in day view)
4. Click "Load Bookings" to fetch and display bookings

## Booking Status Colors

- **Green**: Attended bookings
- **Orange**: Confirmed bookings
- **Red**: Cancelled bookings
- **Gray**: Block bookings
- **Left border**: Green for paid, yellow for unpaid

