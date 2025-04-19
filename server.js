const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data stores (for demo purposes)
let videos = [];
let liveSessions = [];
let scheduledStreams = [];
let inactiveSessions = [];

// Store Google Drive API key in memory
let gdriveApiKey = '';

// Helper to get CPU usage percentage
function getCpuUsage() {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      const percentageCpu = 100 - Math.floor(100 * idleDifference / totalDifference);
      resolve(percentageCpu);
    }, 100);
  });
}

function cpuAverage() {
  const cpus = os.cpus();
  let idleMs = 0;
  let totalMs = 0;
  cpus.forEach((core) => {
    for (type in core.times) {
      totalMs += core.times[type];
    }
    idleMs += core.times.idle;
  });
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

// Get memory usage percentage
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return Math.floor(((totalMem - freeMem) / totalMem) * 100);
}

// Get disk usage percentage (Linux only)
function getDiskUsage() {
  return new Promise((resolve) => {
    exec('df -h /', (error, stdout) => {
      if (error) {
        resolve('N/A');
        return;
      }
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) {
        resolve('N/A');
        return;
      }
      const parts = lines[1].split(/\s+/);
      resolve(parts[4]); // e.g. '45%'
    });
  });
}

// API endpoints placeholders

// Get status counts
app.get('/api/status', (req, res) => {
  res.json({
    live: liveSessions.length,
    scheduled: scheduledStreams.length,
    inactive: inactiveSessions.length
  });
});

// Get system stats
app.get('/api/system-stats', async (req, res) => {
  const cpu = await getCpuUsage();
  const memory = getMemoryUsage();
  const disk = await getDiskUsage();
  res.json({ cpu: `${cpu}%`, memory: `${memory}%`, disk });
});

// Get videos list
app.get('/api/videos', (req, res) => {
  res.json(videos);
});

// Set Google Drive API key
app.post('/api/settings/gdrive-api-key', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }
  gdriveApiKey = apiKey;
  res.json({ success: true });
});

// Add video (download and get real name from Google Drive API if possible)
app.post('/api/videos', async (req, res) => {
  const { id, url } = req.body;
  if (!id && !url) {
    return res.status(400).json({ error: 'Video ID or URL required' });
  }
  let videoId = id;
  if (!videoId && url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('drive.google.com')) {
        const params = urlObj.searchParams;
        if (params.has('id')) {
          videoId = params.get('id');
        } else {
          // Try to extract from path
          const parts = urlObj.pathname.split('/');
          videoId = parts[parts.length - 1];
        }
      } else {
        videoId = url;
      }
    } catch {
      videoId = url;
    }
  }
  let name = videoId;
  // If Google Drive API key is set and videoId looks like an ID, fetch real name
  if (gdriveApiKey && videoId && videoId.length > 10) {
    try {
      const apiUrl = `https://www.googleapis.com/drive/v3/files/${videoId}?fields=name&key=${gdriveApiKey}`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.name) {
          name = data.name;
        }
      }
    } catch (error) {
      // Ignore errors, fallback to videoId as name
    }
  }
  const video = { id: videoId, name };
  videos.push(video);
  res.json(video);
});

// Rename video
app.put('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const video = videos.find(v => v.id === id);
  if (!video) return res.status(404).json({ error: 'Video not found' });
  video.name = name;
  res.json(video);
});

// Delete video
app.delete('/api/videos/:id', (req, res) => {
  const { id } = req.params;
  videos = videos.filter(v => v.id !== id);
  res.json({ success: true });
});

// Start live session
app.post('/api/live/start', (req, res) => {
  const { sessionName, videoId, streamKey, platform } = req.body;
  if (!sessionName || !videoId || !streamKey || !platform) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const session = { id: `live-${Date.now()}`, sessionName, videoId, streamKey, platform, startedAt: new Date() };
  liveSessions.push(session);
  res.json(session);
});

// Stop live session
app.post('/api/live/stop', (req, res) => {
  const { sessionId } = req.body;
  liveSessions = liveSessions.filter(s => s.id !== sessionId);
  res.json({ success: true });
});

// Schedule live stream
app.post('/api/schedule', (req, res) => {
  const { sessionName, videoId, streamKey, platform, scheduleTime, duration } = req.body;
  if (!sessionName || !videoId || !streamKey || !platform || !scheduleTime || !duration) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  const schedule = { id: `schedule-${Date.now()}`, sessionName, videoId, streamKey, platform, scheduleTime, duration };
  scheduledStreams.push(schedule);
  res.json(schedule);
});

// Cancel scheduled stream
app.post('/api/schedule/cancel', (req, res) => {
  const { scheduleId } = req.body;
  scheduledStreams = scheduledStreams.filter(s => s.id !== scheduleId);
  res.json({ success: true });
});

// Get inactive sessions
app.get('/api/inactive', (req, res) => {
  res.json(inactiveSessions);
});

// Restart inactive session
app.post('/api/inactive/restart', (req, res) => {
  const { sessionId } = req.body;
  const session = inactiveSessions.find(s => s.id === sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  liveSessions.push(session);
  inactiveSessions = inactiveSessions.filter(s => s.id !== sessionId);
  res.json({ success: true });
});

// Delete inactive session
app.post('/api/inactive/delete', (req, res) => {
  const { sessionId } = req.body;
  inactiveSessions = inactiveSessions.filter(s => s.id !== sessionId);
  res.json({ success: true });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
</create_file>
