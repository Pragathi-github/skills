In postman :
for POST an event
http://localhost:3000/events

{
"title": "Meeting with Client",
"description": "Discuss the new project.",
"time": "2024-12-05T10:00:00Z"
}
this will give :
{
"success": true,
"message": "Event created successfully!",
"event": {
"id": 2,
"title": "Meeting with Client",
"description": "Discuss the new project.",
"time": "2024-12-05T10:00:00.000Z"
}
}
as a response.

websocket
ws://localhost:3000 will connect and it will notify 5 minutes before event started.

Completed events will be stored in log file
