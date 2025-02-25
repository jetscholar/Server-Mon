const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const os = require("os");
const si = require("systeminformation");
const favicon = require('express-favicon');
const { exec } = require("child_process");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files (for frontend assets)
app.use(express.static("public"));
app.use(favicon('public/assets/favicon.ico'));

// Function to format uptime into DD:HH:MM:SS
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
};

// Function to retrieve GPU info using nvidia-smi
const getGpuInfo = () => {
    return new Promise((resolve) => {
        exec(
            "nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free --format=csv,noheader,nounits",
            (error, stdout) => {
                if (error) {
                    console.error(`GPU Error: ${error.message}`);
                    resolve({ name: "N/A", totalMemory: 0, usedMemory: 0, freeMemory: 0 });
                    return;
                }
                const [name, totalMem, usedMem, freeMem] = stdout.split(",").map(item => item.trim());
                resolve({
                    name,
                    totalMemory: parseInt(totalMem, 10),
                    usedMemory: parseInt(usedMem, 10),
                    freeMemory: parseInt(freeMem, 10)
                });
            }
        );
    });
};

// Function to fetch system stats including GPU data
const getSystemStats = async () => {
    return {
        uptime: formatUptime(os.uptime()),
        cpuLoad: await si.currentLoad(),
        memory: await si.mem(),
        disk: await si.fsSize(),
        network: await si.networkStats(),
        cpuTemp: await si.cpuTemperature(),
        gpu: await getGpuInfo()  // ✅ Added GPU Monitoring
    };
};

// Serve the dashboard page
app.get("/", async (req, res) => {
    const stats = await getSystemStats();
    res.render("index", { stats });
});

// WebSocket connection handling
io.on("connection", (socket) => {
    console.log("Client connected");

    // ✅ Store interval reference
    let statsInterval = setInterval(async () => {
        const stats = await getSystemStats();
        socket.emit("stats", stats);
    }, 1000);

    // ✅ Clear interval when the client disconnects
    socket.on("disconnect", () => {
        console.log("Client disconnected");
        clearInterval(statsInterval);
    });
});

// Start server
server.listen(3003, () => {
    console.log("🚀 Server running on http://localhost:3003");
});
