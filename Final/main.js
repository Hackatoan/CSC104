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
const aboutBtn = document.getElementById("about-link");
const playerNext = document.getElementById("player-next"); // Moved for consistency, no functional change
const contactBtn = document.getElementById("contact-link");
const searchInput = document.getElementById("search-input");

// ====== STATE ======
let allSongs = [];
let currentPlaylistSong = null;
let seeking = false;
let playQueue = [];
let playIndex = 0;
let shuffleOn = false;
let loopMode = 0; // 0: off, 1: song, 2: queue
let currentPlaylistView = null; // null for home, or array of songs for playlist
let shuffleBag = [];

// ====== PLAYLIST STORAGE ======
function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists") || "[]");
}
function savePlaylists(playlists) {
  localStorage.setItem("playlists", JSON.stringify(playlists));
}
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

// ====== SIDEBAR ======
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
      btn.style.width = "100%";
      btn.onclick = () => renderPlaylistContent(pl.name);
      sidebarList.appendChild(btn);
    });
  }
}
homeBtn.onclick = () => {
  currentPlaylistView = null;
  searchInput.value = "";
  renderDefaultContent();
};
contactBtn.onclick = () => {
  searchInput.value = "";
  renderContactContent();
};
aboutBtn.onclick = () => {
  searchInput.value = "";
  mainContent.innerHTML = `
    <section id="about-section" style="padding: 20px; max-width: 800px; margin: auto;">
      <h2>About This Project</h2>
      <p>This application is a final project assignment for the <strong>CSC104</strong> course.</p>
      <p>It functions as a simple music player</p>
      <p>All songs featured in this application are sourced from <a href="https://ncs.io/" target="_blank" style="color: #1db954; text-decoration: none;">NCS.io</a> (NoCopyrightSounds), providing royalty-free music for creators.</p>
      <p>Album cover images are dynamically generated and provided by <a href="https://picsum.photos/" target="_blank" style="color: #1db954; text-decoration: none;">Picsum.photos</a>.</p>
    </section>
  `;
};
addPlaylistBtn.onclick = () => {
  const name = prompt("Enter new playlist name:");
  if (!name) return;
  const playlists = getPlaylists();
  if (playlists.some((pl) => pl.name === name)) {
    alert("Playlist already exists!");
    return;
  }
  playlists.push({ name, songs: [] });
  savePlaylists(playlists);
  renderSidebarPlaylists();
};
sidebarToggle.onclick = () => {
  document.getElementById("sidebar").classList.toggle("collapsed");
};

// ====== SONG GRID & PLAYLIST VIEW ======
function renderSongs(songs) {
  const grid = document.getElementById("song-grid");
  grid.innerHTML = "";
  songs.forEach((song, idx) => {
    const imgSrc = `https://picsum.photos/seed/${song.id}/200`;
    const div = document.createElement("div");
    div.className = "song-item";
    div.innerHTML = `
      <button class="song-plus-btn" title="Add to playlist" data-songid="${song.id}">+</button>
      <button class="play-btn" data-url="${song.url}" data-name="${song.name}" data-idx="${idx}">
        <img src="${imgSrc}" alt="cover" class="song-item-img">
        <span class="song-item-name">
          ${song.name}
        </span>
      </button>
    `;
    grid.appendChild(div);
  });
  grid.querySelectorAll(".play-btn").forEach((btn) => {
    btn.onclick = () => {
      currentPlaylistView = null;
      setPlayQueue(allSongs, allSongs[btn.dataset.idx].id);
      playSongAt(playIndex);
    };
  });
  grid.querySelectorAll(".song-plus-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const songId = btn.getAttribute("data-songid");
      currentPlaylistSong = allSongs.find((s) => s.id == songId);
      openPlaylistModal();
    };
  });
}
function renderDefaultContent() {
  mainContent.innerHTML = `<section>
    <h2>All songs</h2>
    <div id="song-grid" class="song-grid"></div>
  </section>`;
  renderSongs(allSongs);
}
function renderPlaylistContent(playlistName) {
  searchInput.value = "";
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.name === playlistName);
  if (!playlist) {
    mainContent.innerHTML = "<h2>Playlist not found.</h2>";
    return;
  }
  let html = `
    <h2 style="display:flex;align-items:center;gap:1em;">
      ${playlist.name}
      <button id="delete-playlist-btn" title="Delete Playlist" style="color:#fff;background:#b00;border:none;border-radius:50%;width:1.8em;height:1.8em;cursor:pointer;font-size:1em;display:inline-flex;align-items:center;justify-content:center;margin-left:0.5em;">
        &#128465;
      </button>
    </h2>
  `;
  if (playlist.songs.length === 0) {
    html += "<p>No songs in this playlist.</p>";
  } else {
    html += `<div class="song-grid" id="playlist-song-grid"></div>`;
  }
  mainContent.innerHTML = html;
  if (playlist.songs.length > 0) {
    currentPlaylistView = playlist.songs;
    const grid = document.getElementById("playlist-song-grid");
    playlist.songs.forEach((song, idx) => {
      const imgSrc = `https://picsum.photos/seed/${song.id}/200`;
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `
        <button class="song-plus-btn" title="Add to playlist" data-songid="${song.id}">+</button>
        <button class="play-btn" data-url="${song.url}" data-name="${song.name}" data-idx="${idx}">
          <img src="${imgSrc}" alt="cover" class="song-item-img">
          <div class="song-item-name">
            ${song.name}
          </div>
        </button>
      `;
      grid.appendChild(div);
    });
    grid.querySelectorAll(".play-btn").forEach((btn) => {
      btn.onclick = () => {
        setPlayQueue(playlist.songs, playlist.songs[btn.dataset.idx].id);
        playSongAt(playIndex);
      };
    });
    grid.querySelectorAll(".song-plus-btn").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const songId = btn.getAttribute("data-songid");
        currentPlaylistSong =
          allSongs.find((s) => s.id == songId) ||
          playlist.songs.find((s) => s.id == songId);
        openPlaylistModal();
      };
    });
  } else {
    currentPlaylistView = playlist.songs;
  }
  // Delete playlist button
  const deleteBtn = document.getElementById("delete-playlist-btn");
  if (deleteBtn) {
    deleteBtn.onclick = function () {
      if (confirm(`Delete playlist "${playlist.name}"?`)) {
        let newPlaylists = getPlaylists().filter(
          (pl) => pl.name !== playlist.name
        );
        savePlaylists(newPlaylists);
        renderSidebarPlaylists();
        renderDefaultContent();
      }
    };
  }
}

// ====== SEARCH ======
function handleSearch() {
  // The search should only affect the "All Songs" view.
  // The `currentPlaylistView` state variable is null only on the "All Songs" view.
  if (currentPlaylistView !== null) {
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();
  const filteredSongs = allSongs.filter((song) =>
    song.name.toLowerCase().includes(searchTerm)
  );
  renderSongs(filteredSongs);
}

searchInput.addEventListener("input", handleSearch);

// ====== CONTACT PAGE ======
function renderContactContent() {
  mainContent.innerHTML = `
    <section id="contact-section">
      <h2>Submit a Support Request</h2>
      <form id="support-form">
        <p>
          Please fill out the form below to submit a support request.
        </p>
        <div class="form-group">
          <label for="name">Your Name:</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div class="form-group">
          <label for="email">Your Email:</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="subject">Subject:</label>
          <input type="text" id="subject" name="subject" required>
        </div>
        <div class="form-group">
          <label for="message">Message:</label>
          <textarea id="message" name="message" rows="6" required></textarea>
        </div>
        <button type="submit">Submit Request</button>
      </form>
    </section>
  `;

  const supportForm = document.getElementById("support-form");
  if (supportForm) {
    supportForm.addEventListener("submit", (e) => {
      e.preventDefault(); // Prevent actual form submission
      alert("Support request submitted! (This is a dummy form)");
      supportForm.reset(); // Clear the form after submission
    });
  }
}

// ====== PLAYLIST MODAL ======
function openPlaylistModal() {
  renderPlaylistList();
  playlistModal.style.display = "flex";
}
function closePlaylistModal() {
  playlistModal.style.display = "none";
  currentPlaylistSong = null;
}
closeModalBtn.onclick = closePlaylistModal;
window.onclick = function (event) {
  if (event.target === playlistModal) closePlaylistModal();
};
function renderPlaylistList() {
  const playlists = getPlaylists();
  playlistList.innerHTML = "";
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
newPlaylistBtn.onclick = function () {
  const name = prompt("Enter new playlist name:");
  if (!name) return;
  if (getPlaylists().some((pl) => pl.name === name)) {
    alert("Playlist already exists!");
    return;
  }
  addSongToPlaylist(name, currentPlaylistSong);
  closePlaylistModal();
};

// ====== PLAYER BAR & QUEUE LOGIC ======
function setPlayQueue(songs, startId = null) {
  playQueue = [...songs];
  playIndex = 0;
  if (startId !== null) {
    const idx = playQueue.findIndex((s) => s.id == startId);
    if (idx !== -1) playIndex = idx;
  }
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
  showPlayerBar(song.url, song.name, song.id, false);
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

function showPlayerBar(url, name, songId = null, setQueue = false) {
  playerAudio.pause();
  playerAudio.currentTime = 0;
  playerAudio.src = url;
  playerTitle.textContent = name;
  playerBar.style.display = "flex";
  document.body.classList.add("player-visible"); // Add this line
  playerAudio.play();
  playerPause.textContent = "⏸️";
}

// ====== BUTTON VISUAL STATE HELPERS ======
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

// ====== PLAYER BAR EVENTS ======
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
playerAudio.addEventListener("timeupdate", updateTimeAndSeek);
playerAudio.addEventListener("loadedmetadata", updateTimeAndSeek);
playerSeek && playerSeek.addEventListener("input", () => (seeking = true));
playerSeek &&
  playerSeek.addEventListener("change", function () {
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

// Volume slider logic
playerVolume.oninput = function () {
  playerAudio.volume = parseFloat(this.value);
};
playerAudio.volume = playerVolume.value;

// Shuffle, Loop, Skip Buttons
playerShuffle.onclick = function () {
  shuffleOn = !shuffleOn;
  updateShuffleButton();
  if (shuffleOn) {
    resetShuffleBag();
  }
};
playerLoop.onclick = function () {
  loopMode = (loopMode + 1) % 3;
  updateLoopButton();
};
playerNext.onclick = function () {
  if (playQueue.length > 0) playNext();
};
playerPrev.onclick = function () {
  if (playQueue.length > 0) playPrev();
};

// Auto-advance logic
playerAudio.addEventListener("ended", function () {
  if (loopMode === 1) {
    // Loop song
    playerAudio.currentTime = 0;
    playerAudio.play();
  } else if (loopMode === 2) {
    // Loop all
    playNext();
  } else if (playIndex < playQueue.length - 1) {
    playNext();
  }
});

// ====== ACCOUNT MENU ======
accountBtn.onclick = function (e) {
  e.stopPropagation();
  accountMenu.style.display =
    accountMenu.style.display === "none" ? "block" : "none";
};
document.addEventListener("click", function (e) {
  if (
    accountMenu.style.display === "block" &&
    !accountMenu.contains(e.target) &&
    e.target !== accountBtn
  ) {
    accountMenu.style.display = "none";
  }
});
signoutBtn.onclick = function () {
  localStorage.clear();
  location.reload();
};

// ====== INITIAL LOAD ======
fetch("../../music/songs.json")
  .then((res) => res.json())
  .then((songs) => {
    allSongs = songs.map((song) => {
      const fileName = song.url.substring(song.url.lastIndexOf("/") + 1);
      return {
        ...song,
        url: `../../music/${fileName}`,
      };
    });
    renderSidebarPlaylists();
    renderDefaultContent();
    updateShuffleButton();
    updateLoopButton();
  });
