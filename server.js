const express = require("express");
const WebSocket = require("ws");
const fs = require("fs");
const { scheduleNotifications } = require("./utils/notificationScheduler");

const app = express();
const PORT = 3000;


app.use(express.json());


let events = [];


const wss = new WebSocket.Server({ noServer: true });
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("New WebSocket client connected.");
  clients.add(ws);
  ws.on("close", () => {
    console.log("WebSocket client disconnected.");
    clients.delete(ws);
  });
});


const broadcast = (message) => {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};


app.post("/events", (req, res) => {
  const { title, description, time } = req.body;


  if (!title || !time) {
    return res
      .status(400)
      .json({ success: false, message: "Title and time are required." });
  }

  const eventTime = new Date(time);
  if (eventTime <= new Date()) {
    return res
      .status(400)
      .json({ success: false, message: "Event time must be in the future." });
  }

 
  const overlappingEvent = events.find(
    (e) => Math.abs(new Date(e.time) - eventTime) < 5 * 60 * 1000
  );
  if (overlappingEvent) {
    broadcast({
      type: "overlap",
      message: `Event overlaps with: ${overlappingEvent.title}`,
    });
  }

  
  const newEvent = {
    id: events.length + 1,
    title,
    description,
    time: eventTime.toISOString(),
  };
  events.push(newEvent);
  events.sort((a, b) => new Date(a.time) - new Date(b.time));

  
  res.status(201).json({
    success: true,
    message: "Event created successfully!",
    event: newEvent,
  });

  scheduleNotifications(events, broadcast);
});


app.get("/events", (req, res) => {
  const upcomingEvents = events.filter((e) => new Date(e.time) > new Date());
  res.json(upcomingEvents);
});


const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
