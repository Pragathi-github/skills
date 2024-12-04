const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

// Ensure the logs directory exists
const ensureLogFolderExists = () => {
  const logFolderPath = path.join(__dirname, "../logs");
  if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
    console.log("Logs folder created");
  }
};

// Utility to pad single digits (e.g., 5 -> 05)
const pad = (num) => (num < 10 ? "0" + num : num);

// Schedule notifications and logging for events
const scheduleNotifications = (events, broadcast) => {
  // Clear existing cron tasks to avoid duplicate notifications
  cron.getTasks().forEach((task) => task.stop());

  events.forEach((event) => {
    const eventTime = new Date(event.time);
    console.log(`Event scheduled for: ${event.title} at ${eventTime}`);

    // Schedule a notification 5 minutes before the event
    const notifyTime = new Date(eventTime.getTime() - 5 * 60 * 1000);
    console.log(`Notification for event will be sent at: ${notifyTime}`);

    if (notifyTime > new Date()) {
      const notifyCronExpression = `${pad(notifyTime.getMinutes())} ${pad(
        notifyTime.getHours()
      )} ${pad(notifyTime.getDate())} ${pad(notifyTime.getMonth() + 1)} *`;

      console.log(
        `Notify cron expression for event: ${event.title}: ${notifyCronExpression}`
      );

      cron.schedule(
        notifyCronExpression,
        () => {
          console.log(`Notification sent for event: ${event.title}`);
          broadcast({
            type: "notification",
            message: `Event starting soon: ${event.title}`,
          });
        },
        { scheduled: true }
      );
    }

    // Schedule logging of the event as completed
    const eventCronExpression = `${pad(eventTime.getMinutes())} ${pad(
      eventTime.getHours()
    )} ${pad(eventTime.getDate())} ${pad(eventTime.getMonth() + 1)} *`;

    console.log(
      `Event cron expression for completion: ${event.title}: ${eventCronExpression}`
    );

    cron.schedule(
      eventCronExpression,
      () => {
        logCompletedEvent(event);
        broadcast({
          type: "completed",
          message: `Event completed: ${event.title}`,
        });
      },
      { scheduled: true }
    );
  });
};

// Log completed event to a file
const logCompletedEvent = (event) => {
  ensureLogFolderExists(); // Ensure logs directory exists

  const logPath = path.join(__dirname, "logs/completedEvents.log");
  const logEntry = `${new Date().toISOString()} - Event: ${
    event.title
  }, Description: ${event.description}\n`;

  fs.appendFile(logPath, logEntry, (err) => {
    if (err) {
      console.error("Error logging event:", err);
    } else {
      console.log(`Logged completed event: ${event.title}`);
    }
  });
};

module.exports = { scheduleNotifications };
