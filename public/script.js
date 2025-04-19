document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const countLive = document.getElementById('count-live');
  const countScheduled = document.getElementById('count-scheduled');
  const countInactive = document.getElementById('count-inactive');

  const gdriveUrlInput = document.getElementById('gdrive-url');
  const btnDownload = document.getElementById('btn-download');
  const downloadStatus = document.getElementById('download-status');

  const videoSelect = document.getElementById('video-select');
  const videoCount = document.getElementById('video-count');
  const btnRename = document.getElementById('btn-rename');
  const btnDelete = document.getElementById('btn-delete');

  const liveSessionName = document.getElementById('live-session-name');
  const liveVideoSelect = document.getElementById('live-video-select');
  const liveStreamKey = document.getElementById('live-stream-key');
  const livePlatform = document.getElementById('live-platform');
  const btnStartLive = document.getElementById('btn-start-live');

  const activeSessionSelect = document.getElementById('active-session-select');
  const btnStopLive = document.getElementById('btn-stop-live');
  const activeLiveCount = document.getElementById('active-live-count');

  const currentDateSpan = document.getElementById('current-date');
  const scheduleSessionName = document.getElementById('schedule-session-name');
  const scheduleVideoSelect = document.getElementById('schedule-video-select');
  const scheduleStreamKey = document.getElementById('schedule-stream-key');
  const schedulePlatform = document.getElementById('schedule-platform');
  const scheduleDate = document.getElementById('schedule-date');
  const scheduleDuration = document.getElementById('schedule-duration');
  const btnSchedule = document.getElementById('btn-schedule');

  const scheduleListSelect = document.getElementById('schedule-list-select');
  const btnCancelSchedule = document.getElementById('btn-cancel-schedule');
  const scheduleCount = document.getElementById('schedule-count');

  const inactiveSessionSelect = document.getElementById('inactive-session-select');
  const btnRestartInactive = document.getElementById('btn-restart-inactive');
  const btnDeleteInactive = document.getElementById('btn-delete-inactive');
  const inactiveCount = document.getElementById('inactive-count');

  // Utility functions
  function fetchStatus() {
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        countLive.textContent = data.live;
        countScheduled.textContent = data.scheduled;
        countInactive.textContent = data.inactive;
        activeLiveCount.textContent = `Jumlah Live: ${data.live}`;
        scheduleCount.textContent = `Jumlah Jadwal: ${data.scheduled}`;
        inactiveCount.textContent = `Jumlah Tidak Aktif: ${data.inactive}`;
      });
  }

  function fetchVideos() {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        videoSelect.innerHTML = '<option value="">-- Pilih Video --</option>';
        liveVideoSelect.innerHTML = '<option value="">-- Pilih Video --</option>';
        scheduleVideoSelect.innerHTML = '<option value="">-- Pilih Video --</option>';
        data.forEach(video => {
          const option = document.createElement('option');
          option.value = video.id;
          option.textContent = video.name;
          videoSelect.appendChild(option.cloneNode(true));
          liveVideoSelect.appendChild(option.cloneNode(true));
          scheduleVideoSelect.appendChild(option.cloneNode(true));
        });
        videoCount.textContent = `Jumlah Video: ${data.length}`;
      });
  }

  function fetchLiveSessions() {
    fetch('/api/live')
      .then(res => res.json())
      .then(data => {
        activeSessionSelect.innerHTML = '<option value="">-- Pilih Sesi --</option>';
        data.forEach(session => {
          const option = document.createElement('option');
          option.value = session.id;
          option.textContent = session.sessionName;
          activeSessionSelect.appendChild(option);
        });
      });
  }

  function fetchScheduledStreams() {
    fetch('/api/schedule/list')
      .then(res => res.json())
      .then(data => {
        scheduleListSelect.innerHTML = '<option value="">-- Pilih Jadwal --</option>';
        data.forEach(schedule => {
          const option = document.createElement('option');
          option.value = schedule.id;
          option.textContent = `${schedule.sessionName} (${new Date(schedule.scheduleTime).toLocaleString()})`;
          scheduleListSelect.appendChild(option);
        });
      });
  }

  function fetchInactiveSessions() {
    fetch('/api/inactive')
      .then(res => res.json())
      .then(data => {
        inactiveSessionSelect.innerHTML = '<option value="">-- Pilih Sesi --</option>';
        data.forEach(session => {
          const option = document.createElement('option');
          option.value = session.id;
          option.textContent = session.sessionName;
          inactiveSessionSelect.appendChild(option);
        });
      });
  }

  // Initial fetches
  fetchStatus();
  fetchVideos();
  fetchLiveSessions();
  fetchScheduledStreams();
  fetchInactiveSessions();

  // Update current date display
  function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentDateSpan.textContent = now.toLocaleDateString('id-ID', options);
  }
  updateCurrentDate();
  setInterval(updateCurrentDate, 1000);

  // Event listeners

  // Download video from GDrive (simulate)
  btnDownload.addEventListener('click', () => {
    const url = gdriveUrlInput.value.trim();
    if (!url) {
      alert('Masukkan Video ID/URL');
      return;
    }
    downloadStatus.style.backgroundColor = '#2563eb'; // blue
    downloadStatus.style.width = '0%';
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      downloadStatus.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        downloadStatus.style.backgroundColor = '#16a34a'; // green
        // Add video to backend
        fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        })
          .then(res => res.json())
          .then(() => {
            fetchVideos();
            downloadStatus.style.width = '0%';
            gdriveUrlInput.value = '';
          });
      }
    }, 200);
  });

  // Rename video
  btnRename.addEventListener('click', () => {
    const selectedId = videoSelect.value;
    if (!selectedId) {
      alert('Pilih video untuk rename');
      return;
    }
    const newName = prompt('Masukkan nama baru:');
    if (!newName) return;
    fetch(`/api/videos/${selectedId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })
      .then(res => res.json())
      .then(() => fetchVideos());
  });

  // Delete video
  btnDelete.addEventListener('click', () => {
    const selectedId = videoSelect.value;
    if (!selectedId) {
      alert('Pilih video untuk dihapus');
      return;
    }
    if (!confirm('Yakin ingin menghapus video ini?')) return;
    fetch(`/api/videos/${selectedId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => fetchVideos());
  });

  // Start live session
  btnStartLive.addEventListener('click', () => {
    const sessionName = liveSessionName.value.trim();
    const videoId = liveVideoSelect.value;
    const streamKey = liveStreamKey.value.trim();
    const platform = livePlatform.value;
    if (!sessionName || !videoId || !streamKey) {
      alert('Lengkapi semua data untuk mulai live');
      return;
    }
    fetch('/api/live/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName, videoId, streamKey, platform })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchLiveSessions();
        liveSessionName.value = '';
        liveStreamKey.value = '';
        liveVideoSelect.value = '';
      });
  });

  // Stop live session
  btnStopLive.addEventListener('click', () => {
    const sessionId = activeSessionSelect.value;
    if (!sessionId) {
      alert('Pilih sesi live untuk dihentikan');
      return;
    }
    fetch('/api/live/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchLiveSessions();
      });
  });

  // Schedule live stream
  btnSchedule.addEventListener('click', () => {
    const sessionName = scheduleSessionName.value.trim();
    const videoId = scheduleVideoSelect.value;
    const streamKey = scheduleStreamKey.value.trim();
    const platform = schedulePlatform.value;
    const scheduleTime = scheduleDate.value;
    const duration = scheduleDuration.value;
    if (!sessionName || !videoId || !streamKey || !scheduleTime || !duration) {
      alert('Lengkapi semua data untuk menjadwalkan live');
      return;
    }
    fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionName, videoId, streamKey, platform, scheduleTime, duration })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchScheduledStreams();
        scheduleSessionName.value = '';
        scheduleStreamKey.value = '';
        scheduleVideoSelect.value = '';
        scheduleDate.value = '';
        scheduleDuration.value = '';
      });
  });

  // Cancel scheduled stream
  btnCancelSchedule.addEventListener('click', () => {
    const scheduleId = scheduleListSelect.value;
    if (!scheduleId) {
      alert('Pilih jadwal untuk dibatalkan');
      return;
    }
    fetch('/api/schedule/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduleId })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchScheduledStreams();
      });
  });

  // Restart inactive session
  btnRestartInactive.addEventListener('click', () => {
    const sessionId = inactiveSessionSelect.value;
    if (!sessionId) {
      alert('Pilih sesi tidak aktif untuk di-live-kan lagi');
      return;
    }
    fetch('/api/inactive/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchInactiveSessions();
        fetchLiveSessions();
      });
  });

  // Delete inactive session
  btnDeleteInactive.addEventListener('click', () => {
    const sessionId = inactiveSessionSelect.value;
    if (!sessionId) {
      alert('Pilih sesi tidak aktif untuk dihapus');
      return;
    }
    if (!confirm('Yakin ingin menghapus sesi ini?')) return;
    fetch('/api/inactive/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    })
      .then(res => res.json())
      .then(() => {
        fetchStatus();
        fetchInactiveSessions();
      });
  });

  // Periodic refresh
  setInterval(() => {
    fetchStatus();
    fetchVideos();
    fetchLiveSessions();
    fetchScheduledStreams();
    fetchInactiveSessions();
  }, 30000); // every 30 seconds
});
