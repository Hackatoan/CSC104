// ====== DOM ELEMENTS ======
const sidebarList = document.getElementById("sidebar-list");
const homeBtn = document.getElementById("home-link");
const addPlaylistBtn = document.getElementById("add-playlist-btn");
const accountBtn = document.getElementById("account-btn");
const accountMenu = document.getElementById("account-menu");
const signoutBtn = document.getElementById("signout-btn");
const sidebarToggle = document.getElementById("sidebar-toggle");
const playerBar = document.getElementById("player-bar");
const playerAudio = document.getElementById("player-audio");
const playerTitle = document.getElementById("player-title");
const playerTime = document.getElementById("player-time");
const playerPause = document.getElementById("player-pause");
const playerSeek = document.getElementById("player-seek");
const playlistModal = document.getElementById("playlist-modal");
const playlistList = document.getElementById("playlist-list");
const newPlaylistBtn = document.getElementById("new-playlist-btn");
const closeModalBtn = document.getElementById("close-modal");
const mainContent = document.getElementById("main-content");
const playerVolume = document.getElementById("player-volume");
const playerShuffle = document.getElementById("player-shuffle");
const playerLoop = document.getElementById("player-loop");
const playerPrev = document.getElementById("player-prev");
const playerNext = document.getElementById("player-next");

// ====== STATE ======
let allSongs = []; // Holds all songs parsed from the initial HTML
let currentPlaylistSong = null;
let playQueue = [];
let playIndex = 0;
let shuffleOn = false;
let loopMode = 0; // 0: off, 1: song, 2: queue
let shuffleBag = [];
let seeking = false;

// ====== LOCAL STORAGE HELPERS ======
function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists") || "[]");
}

function savePlaylists(playlists) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}

// ====== PLAYLIST MANAGEMENT ======
function addSongToPlaylist(playlistName, song) {
  let playlists = getPlaylists();
  let pl = playlists.find((p) => p.name === playlistName);
  if (!pl) {
    pl = { name: playlistName, songs: [] };
    playlists.push(pl);
  }
  if (!pl.songs.find((s) => s.url === song.url)) {
    pl.songs.push(song);
  }
  savePlaylists(playlists);
  renderSidebarPlaylists();
}

// ====== UI RENDERING ======
function renderSidebarPlaylists() {
  sidebarList.innerHTML = "";
  const playlists = getPlaylists();
  if (playlists.length === 0) {
    sidebarList.innerHTML = "<div><em>No playlists yet.</em></div>";
  } else {
    playlists.forEach((pl) => {
      const btn = document.createElement("button");
      btn.className = "playlist-link";
      btn.textContent = pl.name;
      btn.onclick = () => showPlaylistPage(pl.name);
      sidebarList.appendChild(btn);
    });
  }
}

function renderPlaylistContent(playlistName) {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.name === playlistName);
  const title = document.getElementById("playlist-title");
  const grid = document.getElementById("playlist-song-grid");

  title.textContent = playlistName;
  grid.innerHTML = "";

  if (playlist && playlist.songs.length > 0) {
    playlist.songs.forEach((song) => {
      const imgSrc = `https://picsum.photos/seed/${song.id}/200`;
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `
        <button class="song-plus-btn" title="Add to playlist" data-songid="${song.id}">+</button>
        <button class="play-btn" data-url="${song.url}" data-name="${song.name}">
          <img src="${imgSrc}" alt="cover" class="song-item-img">
          <div class="song-item-name">${song.name}</div>
        </button>
      `;
      grid.appendChild(div);
    });
    // Attach handlers specifically to the new content in the playlist grid
    attachSongEventHandlers(grid, playlist.songs);
  } else {
    grid.innerHTML = "<em>No songs in this playlist.</em>";
  }
}

// ====== VIEW SWITCHING ======
function showHomePage() {
  document.getElementById("home-section").style.display = "block";
  document.getElementById("playlist-section").style.display = "none";
}

function showPlaylistPage(playlistName) {
  document.getElementById("home-section").style.display = "none";
  document.getElementById("playlist-section").style.display = "block";
  renderPlaylistContent(playlistName);
}

// ====== MODAL LOGIC ======
function openPlaylistModal() {
  renderPlaylistList();
  playlistModal.style.display = "flex";
}
function closePlaylistModal() {
  playlistModal.style.display = "none";
  currentPlaylistSong = null;
}

function renderPlaylistList() {
  const playlists = getPlaylists();
  playlistList.innerHTML = "";
  if (playlists.length === 0) {
    playlistList.innerHTML = "<em>No playlists yet. Create one!</em>";
    return;
  }
  playlists.forEach((pl) => {
    const btn = document.createElement("button");
    btn.textContent = pl.name;
    btn.onclick = function () {
      if (currentPlaylistSong) {
        addSongToPlaylist(pl.name, currentPlaylistSong);
        closePlaylistModal();
      }
    };
    playlistList.appendChild(btn);
  });
}

// ====== PLAYER & QUEUE LOGIC ======
function setPlayQueue(songs, startIdx = 0) {
  playQueue = [...songs];
  playIndex = startIdx;
  if (shuffleOn) resetShuffleBag();
}
function resetShuffleBag() {
  shuffleBag = [];
  for (let i = 0; i < playQueue.length; i++) {
    if (i !== playIndex) shuffleBag.push(i);
  }
}

function getNextShuffleIndex() {
  if (shuffleBag.length === 0) resetShuffleBag();
  const randIdx = Math.floor(Math.random() * shuffleBag.length);
  const nextIdx = shuffleBag[randIdx];
  shuffleBag.splice(randIdx, 1);
  return nextIdx;
}

function playSongAt(idx) {
  playIndex = idx;
  const song = playQueue[playIndex];
  if (song) showPlayerBar(song.url, song.name);
}
function playNext() {
  if (shuffleOn) {
    playIndex = getNextShuffleIndex();
  } else {
    playIndex = (playIndex + 1) % playQueue.length;
  }
  playSongAt(playIndex);
}
function playPrev() {
  if (shuffleOn) {
    playIndex = getNextShuffleIndex();
  } else {
    playIndex = (playIndex - 1 + playQueue.length) % playQueue.length;
  }
  playSongAt(playIndex);
}
function showPlayerBar(url, name) {
  playerAudio.pause();
  playerAudio.currentTime = 0;
  playerAudio.src = url;
  playerTitle.textContent = name;
  playerBar.style.display = "flex";
  document.body.classList.add("player-visible");
  playerAudio.play();
  playerPause.textContent = "⏸️";
}

// ====== PLAYER BUTTONS & UI STATE ======
function updateShuffleButton() {
  if (shuffleOn) {
    playerShuffle.classList.add("shuffle-on");
    playerShuffle.title = "Shuffle On";
  } else {
    playerShuffle.classList.remove("shuffle-on");
    playerShuffle.title = "Shuffle Off";
  }
}
function updateLoopButton() {
  playerLoop.classList.remove("active", "loop-song", "loop-all");
  if (loopMode === 0) {
    playerLoop.title = "Loop Off";
    playerLoop.textContent = "🔁";
  } else if (loopMode === 1) {
    playerLoop.title = "Loop Song";
    playerLoop.textContent = "🔂";
    playerLoop.classList.add("active", "loop-song");
  } else {
    playerLoop.title = "Loop All";
    playerLoop.textContent = "🔁";
    playerLoop.classList.add("active", "loop-all");
  }
}

// ====== EVENT HANDLERS ======
playerPause.onclick = function () {
  if (playerAudio.paused) {
    playerAudio.play();
    playerPause.textContent = "⏸️";
  } else {
    playerAudio.pause();
    playerPause.textContent = "▶️";
  }
};
playerAudio.addEventListener("play", () => {
  playerPause.textContent = "⏸️";
});
playerAudio.addEventListener("pause", () => {
  playerPause.textContent = "▶️";
});

playerSeek.addEventListener("input", () => {
  seeking = true;
});
playerSeek.addEventListener("change", () => {
  if (!isNaN(playerAudio.duration)) {
    playerAudio.currentTime = (playerSeek.value / 100) * playerAudio.duration;
  }
  seeking = false;
});

function updateTimeAndSeek() {
  const cur = formatTime(playerAudio.currentTime);
  const dur = formatTime(playerAudio.duration);
  playerTime.textContent = `${cur} / ${dur}`;
  if (!seeking && !isNaN(playerAudio.duration)) {
    playerSeek.value = (playerAudio.currentTime / playerAudio.duration) * 100;
  }
}

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// Auto-advance to next song
playerAudio.addEventListener("ended", function () {
  if (loopMode === 1) {
    // Loop current song
    playerAudio.currentTime = 0;
    playerAudio.play();
  } else if (loopMode === 2) {
    playNext();
  } else if (playIndex < playQueue.length - 1) {
    playNext();
  }
});

/**
 * Attaches click handlers to song items within a given container.
 * @param {HTMLElement} container The element containing the song items.
 * @param {Array} songsForQueue The array of song objects for the current view.
 */
function attachSongEventHandlers(container, songsForQueue) {
  container.querySelectorAll(".play-btn").forEach((btn, idx) => {
    btn.onclick = () => {
      setPlayQueue(songsForQueue, idx);
      playSongAt(idx);
    };
  });

  container.querySelectorAll(".song-plus-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const songId = btn.dataset.songid;
      currentPlaylistSong = allSongs.find((s) => s.id === songId);
      openPlaylistModal();
    };
  });
}

/**
 * Parses song data from the static HTML on initial load.
 */
function parseInitialSongs() {
  const songElements = document.querySelectorAll("#home-section .play-btn");
  allSongs = Array.from(songElements).map((btn) => ({
    url: btn.dataset.url,
    name: btn.dataset.name,
    id: btn.parentElement.querySelector(".song-plus-btn").dataset.songid,
  }));
}

// ====== APP INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  parseInitialSongs();

  // Attach handlers to global controls
  homeBtn.onclick = showHomePage;
  sidebarToggle.onclick = () => sidebar.classList.toggle("collapsed");
  addPlaylistBtn.onclick = () => {
    const name = prompt("Enter new playlist name:");
    if (!name) return;
    if (getPlaylists().some((pl) => pl.name === name)) {
      alert("Playlist already exists!");
      return;
    }
    addSongToPlaylist(name, null); // Create empty playlist
  };

  // Modal event handlers
  closeModalBtn.onclick = closePlaylistModal;
  newPlaylistBtn.onclick = () => {
    const name = prompt("Enter new playlist name:");
    if (!name || !currentPlaylistSong) return;
    addSongToPlaylist(name, currentPlaylistSong);
    closePlaylistModal();
  };
  window.onclick = (e) => {
    if (e.target === playlistModal) closePlaylistModal();
  };

  // Player event handlers
  playerAudio.addEventListener("timeupdate", updateTimeAndSeek);
  playerAudio.addEventListener("loadedmetadata", updateTimeAndSeek);
  playerVolume.oninput = () => (playerAudio.volume = playerVolume.value);
  playerShuffle.onclick = () => {
    shuffleOn = !shuffleOn;
    updateShuffleButton();
    if (shuffleOn) resetShuffleBag();
  };
  playerLoop.onclick = () => {
    loopMode = (loopMode + 1) % 3;
    updateLoopButton();
  };
  playerNext.onclick = () => playQueue.length > 0 && playNext();
  playerPrev.onclick = () => playQueue.length > 0 && playPrev();

  // Account menu handlers
  accountBtn.onclick = (e) => {
    e.stopPropagation();
    accountMenu.style.display =
      accountMenu.style.display === "block" ? "none" : "block";
  };
  document.addEventListener("click", (e) => {
    if (
      accountMenu.style.display === "block" &&
      !accountMenu.contains(e.target) &&
      e.target !== accountBtn
    ) {
      accountMenu.style.display = "none";
    }
  });
  signoutBtn.onclick = () => {
    if (confirm("This will clear all your playlists. Are you sure?")) {
      localStorage.clear();
      location.reload();
    }
  };

  // Attach handlers to the initial song grid
  attachSongEventHandlers(document.getElementById("song-grid"), allSongs);

  // Initial UI setup
  renderSidebarPlaylists();
  updateShuffleButton();
  updateLoopButton();
  playerAudio.volume = playerVolume.value;
});
