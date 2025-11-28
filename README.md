# Emerald Yield Simulator

A comprehensive net yield and rental return simulator for property investment analysis. This application provides both static calculations and data-driven predictions based on historical property data.

## 🚀 Features

- **Static Estimation**: Calculate net monthly income and ROI over 3 years based on user inputs
- **Data-Driven Predictions**: Enhanced predictions using historical property data with price-based segmentation
- **Admin Dashboard**: Back-office interface to view and manage all simulations
- **Responsive Design**: Fully responsive UI based on Emerald Stay's visual identity
- **Form Validation**: Comprehensive client-side and server-side validation
- **Rate Limiting**: Protection against abuse with configurable rate limits

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **Docker**: Latest version with Docker Compose
- **MongoDB**: Included in Docker Compose (or external MongoDB instance)

## 🛠️ Installation

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emerald-yield-simulator
   ```

2. **Start the application**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Main application: http://localhost:3000
   - Admin panel: http://localhost:3000/admin/simulations
   - MongoDB: localhost:27017 (if connecting externally)

### Manual Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/emerald
   ```

3. **Start MongoDB** (if not using Docker)
   ```bash
   mongod
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

## 📖 Usage

### Running a Simulation

1. Navigate to http://localhost:3000
2. Fill in the form:
   - **Purchase Price**: Property purchase price (€)
   - **Monthly Rent**: Expected monthly rental income (€)
   - **Annual Fee**: Annual expenses (insurance, taxes, etc.) (€)
   - **Email**: Your email address
3. Click "Calculate Simulation"
4. View results showing:
   - Static estimation for 3 years
   - Data-driven predictions (if dataset available)
   - Comparison between both approaches

### Admin Panel

Access the admin panel at `/admin/simulations` to:
- View all simulations
- Filter by email
- Sort by various columns
- View detailed simulation information

## 🏗️ Project Structure

```
emerald-yield-simulator/
├── src/
│   ├── config/          # Configuration constants
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Route definitions
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── views/           # EJS templates
│   ├── public/          # Static assets (CSS, fonts)
│   ├── app.js           # Express app configuration
│   └── index.js         # Application entry point
├── data/                # Dataset storage (auto-downloaded)
├── docker-compose.yml   # Docker Compose configuration
├── Dockerfile           # Docker image definition
└── package.json         # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string

### Constants

Configuration constants are defined in `src/config/constants.js`:

- **Commission Rates**: 30% (Year 1), 25% (Year 2), 20% (Year 3+)
- **Prediction Config**: Average days per month (30.42), Price margin (±15%)
- **Dataset Config**: Google Drive file ID, cache duration (24 hours)

## 📊 Data-Driven Predictions

The application automatically downloads and caches a historical property dataset from Google Drive. The dataset is used to:

1. **Segment Properties**: Find properties with similar daily prices (±15% range)
2. **Calculate Segmented AOR**: Average Occupancy Rate for similar properties
3. **Adjust Predictions**: Apply segmented AOR to user's monthly rent

### Dataset Information

- **Source**: Google Drive (public link)
- **Format**: CSV with columns: date, property_id, surface_m2, bedrooms, location_score, listing_price, is_booked
- **Auto-download**: On first run and every 24 hours
- **Location**: `data/dataset.csv`

## 🧪 Development

### Available Scripts

```bash
npm start      # Start with nodemon (development)
npm run dev    # Alias for start
npm run lint   # Run ESLint
```

### Code Quality

The project follows these practices:
- Centralized error handling with `asyncHandler`
- Structured logging with custom logger
- Rate limiting for API protection
- Input validation with `express-validator`
- MVC architecture pattern

## 🐳 Docker

### Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### MongoDB Access

- **From Host**: `mongodb://localhost:27018/emerald`
- **From Container**: `mongodb://mongo:27017/emerald`

## 🔒 Security Features

- **Rate Limiting**: 
  - Simulation endpoint: 10 requests per 15 minutes
  - General API: 100 requests per 15 minutes
- **Input Validation**: Server-side validation with `express-validator`
- **Error Handling**: Centralized error handling middleware
- **MongoDB Injection Protection**: Mongoose schema validation

## 📝 API Endpoints

### Public Routes

- `GET /` - Main simulation form
- `POST /simulate` - Process simulation
- `GET /results/:id` - View simulation results

### Admin Routes

- `GET /admin/simulations` - List all simulations (with pagination, filtering, sorting)
- `GET /admin/simulations/:id` - View simulation details

## 🎨 UI/UX

- **Design**: Based on Emerald Stay's visual identity
- **Framework**: Bootstrap 5 with custom theme variables
- **Typography**: 
  - Headers/Buttons/Nav: Louize, Times, serif
  - Body: Acumin, Arial, sans-serif
- **Colors**: Custom green (#00a062) for primary actions
- **Responsive**: Fully responsive on mobile devices

## 🐛 Troubleshooting

### Dataset Not Loading

- Check network connectivity
- Verify Google Drive file is accessible
- Check `data/` directory permissions
- Review application logs for download errors

### MongoDB Connection Issues

- Verify MongoDB container is running: `docker-compose ps`
- Check MongoDB port mapping (default: 27018)
- Verify `MONGO_URI` in environment variables

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## 📄 License

ISC

## 👤 Contact

For questions or issues, please contact: gregory@eterniti.com
