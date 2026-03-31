const { generateWeeklyReport } = require('./index');

// Mock context for testing
const mockContext = {};

console.log("Starting local test of generateWeeklyReport...");

// Execute the scheduled function handler manually
generateWeeklyReport.run(mockContext)
    .then(() => {
        console.log("Local test finished successfully.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Local test failed:", err);
        process.exit(1);
    });
