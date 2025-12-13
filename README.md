# Predictive Maintenance Copilot

A comprehensive predictive maintenance application for industrial machinery using machine learning and real-time sensor data analysis.

## 📋 Project Overview

This application provides:
- Real-time monitoring of machine sensor data
- Predictive maintenance alerts using LSTM neural networks
- Historical data analysis and visualization
- Maintenance logging and tracking
- Machine health dashboard

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18+ recommended)
- **PostgreSQL** (v18+ recommended)
- **Git**
- **npm** or **yarn**

### Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Asah-Capstone-Predictive-Maintenance-Copilot.git
cd Asah-Capstone-Predictive-Maintenance-Copilot
```

#### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

#### 3. Set Up Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```env
# Gemini AI API Key
VITE_GEMINI_API_KEY=your-gemini-api-key

# Database Configuration
VITE_DB_HOST=localhost
VITE_DB_PORT=5433
VITE_DB_NAME=predictive_maintenance
VITE_DB_USER=postgres
VITE_DB_PASSWORD=your-postgres-password

# Node.js Database Configuration (for server-side operations)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=predictive_maintenance
DB_USER=postgres
DB_PASSWORD=your-postgres-password
```

#### 4. Set Up PostgreSQL Database

##### Option A: Automatic Setup (Recommended)

Run the database setup script:

```bash
npm run setup-db
```

This will:
1. Test PostgreSQL connection
2. Create the `predictive_maintenance` database if it doesn't exist
3. Apply the database schema

##### Option B: Manual Setup

If you prefer manual setup:

1. **Create the database:**
   ```bash
   psql -U postgres -h localhost -p 5433 -c "CREATE DATABASE predictive_maintenance;"
   ```

2. **Apply the schema:**
   ```bash
   psql -U postgres -h localhost -p 5433 -d predictive_maintenance -f database_schema.sql
   ```

#### 5. Import Sample Data (Optional)

To import sample data for testing:

```bash
npm run import-data
```

This will import the complete dataset from `complete_database_setup.sql` which includes:
- Machine sensor readings
- Historical failure data
- Maintenance logs

#### 6. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🛠️ Database Schema

The application uses a PostgreSQL database with the following schema:

### Main Table: `machine_sensor_data`

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `datetime` | TIMESTAMP | Timestamp of sensor reading |
| `machine_id` | INTEGER | Unique machine identifier |
| `volt` | DECIMAL(10,6) | Voltage sensor reading |
| `rotate` | DECIMAL(10,6) | Rotation speed sensor reading |
| `pressure` | DECIMAL(10,6) | Pressure sensor reading |
| `vibration` | DECIMAL(10,6) | Vibration sensor reading |
| `model` | VARCHAR(50) | Machine model type |
| `age` | INTEGER | Age of machine in years |
| `failure` | VARCHAR(50) | Failure type (none, comp1, comp2, comp3, comp4) |
| `error_id` | VARCHAR(50) | Error identifier |
| `component` | VARCHAR(50) | Component requiring maintenance |

### Indexes

The database includes optimized indexes for performance:
- `idx_machine_sensor_data_datetime` - For time-based queries
- `idx_machine_sensor_data_machine_id` - For machine-specific queries
- `idx_machine_sensor_data_failure` - For failure analysis
- `idx_machine_sensor_data_machine_datetime` - Composite index for common queries

## 🔧 Configuration

### Database Configuration

The application uses two sets of database configuration:

1. **Client-side (Vite)**: Prefixed with `VITE_DB_*` - used by the frontend
2. **Server-side**: Prefixed with `DB_*` - used by Node.js backend

### Machine Learning Model

The LSTM model for predictive maintenance is located in:
```
public/lstm_tfjs/
```

This includes:
- `model.json` - Model architecture
- `group1-shard1of1.bin` - Model weights

## 📂 Project Structure

```
.
├── public/                  # Static assets
│   ├── lstm_tfjs/           # LSTM model files
│   └── vite.svg             # Vite logo
├── src/                     # React source code
│   ├── components/          # React components
│   ├── App.jsx              # Main application
│   └── App.css              # Main styles
├── database_schema.sql      # Database schema definition
├── complete_database_setup.sql # Complete dataset with sample data
├── setup_db.cjs             # Database setup script
├── import_data.cjs          # Data import script
├── db.config.cjs            # Database configuration
├── .env                     # Environment variables
├── package.json             # Project dependencies
└── README.md                # This file
```

## 🎯 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run setup-db` | Set up PostgreSQL database |
| `npm run import-data` | Import sample data |

## 🔍 Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. **Verify PostgreSQL is running**:
   ```bash
   psql -U postgres -h localhost -p 5433 -c "SELECT version();"
   ```

2. **Check database exists**:
   ```bash
   psql -U postgres -h localhost -p 5433 -c "\l"
   ```

3. **Verify credentials**: Ensure `.env` file has correct database credentials

### Common Errors

**Error: database "predictive_maintenance" does not exist**
- Run `npm run setup-db` to create the database

**Error: connection refused**
- Ensure PostgreSQL is running on port 5433
- Check your PostgreSQL configuration

**Error: password authentication failed**
- Verify the password in `.env` matches your PostgreSQL user password

## 📊 Data Import Process

The `import_data.cjs` script:

1. Connects to the PostgreSQL database
2. Reads `complete_database_setup.sql`
3. Executes SQL statements in batches
4. Validates import with record count
5. Shows sample data preview

## 🔒 Security Notes

- **Never commit your `.env` file** with actual API keys or passwords
- Use environment variables for sensitive data
- The `.gitignore` file should include `.env`

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Create a pull request

## 📜 License

This project is licensed under the MIT License.

## 📞 Support

For issues or questions, please open a GitHub issue or contact the project maintainers.

---

**Happy coding!** 🚀 The Predictive Maintenance Copilot team.
