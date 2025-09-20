import winston from 'winston';

// Create a simple logger with console output
const logger = winston.createLogger({
  level: process.env.NODE_ENV == 'development' ? 'debug' : 'error',  // Default level is 'info'
  format: winston.format.combine(
    winston.format.colorize(),  // Colorize the logs for better readability
    winston.format.simple()     // Simple text format (no JSON)
  ),
  transports: [
    new winston.transports.Console(),  // Logs will go to the console
  ],
});

// Optionally, you can add different log levels like 'debug', 'warn', 'error' if needed
export default logger;