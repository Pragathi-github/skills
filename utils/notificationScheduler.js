const cron = require("node-cron");
const fs = require("fs");
const path = require("path");


const ensureLogFolderExists = () => {
  const logFolderPath = path.join(__dirname, "../logs");
  if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
    console.log("Logs folder created");
  }
};


const pad = (num) => (num < 10 ? "0" + num : num);

const scheduleNotifications = (events, broadcast) => {
 
  cron.getTasks().forEach((task) => task.stop());

  events.forEach((event) => {
    const eventTime = new Date(event.time);
    console.log(`Event scheduled for: ${event.title} at ${eventTime}`);


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


const logCompletedEvent = (event) => {
  ensureLogFolderExists(); 

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
