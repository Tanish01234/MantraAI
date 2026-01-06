import postgres from 'postgres'

// Direct database connection for server-side operations
// Use this for migrations, complex queries, or direct SQL operations
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('DATABASE_URL not configured. Direct database connection unavailable.')
}

// Create postgres client only if DATABASE_URL is configured
const sql = connectionString ? postgres(connectionString, {
  max: 1, // Limit connections for serverless environments
  idle_timeout: 20,
  connect_timeout: 10,
}) : null

export default sql

// Helper function to check if database is connected
export const isDatabaseConnected = () => {
  return sql !== null
}
