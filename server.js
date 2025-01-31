const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { exec } = require("child_process");
const os = require("os");
const si = require("systeminformation");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files (for frontend assets)
app.use(express.static("public"));

// Serve static files (for frontend)
app.use(express.static(__dirname + "/public"));

// Function to fetch system stats
const getSystemStats = async () => {
    return {
        uptime: os.uptime(),
        cpuLoad: await si.currentLoad(),
        memory: await si.mem(),
        disk: await si.fsSize(),
        network: await si.networkStats(),
    };
};

// Serve the dashboard page
app.get("/", async (req, res) => {
    const stats = await getSystemStats();
    res.render("index", { stats });
});

// Send stats to the client every second
io.on("connection", (socket) => {
    console.log("Client connected");
    setInterval(async () => {
        const stats = await getSystemStats();
        socket.emit("stats", stats);
    }, 1000);
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
