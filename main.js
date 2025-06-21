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

// ====== STATE ======
let allSongs = [];
let currentPlaylistSong = null;
let seeking = false;

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
    sidebarList.innerHTML = "<li><em>No playlists yet.</em></li>";
  } else {
    playlists.forEach((pl) => {
      const li = document.createElement("li");
      li.innerHTML = `<button class="playlist-link" data-name="${pl.name}" style="width:100%;">${pl.name}</button>`;
      sidebarList.appendChild(li);
    });
  }
  sidebarList.querySelectorAll(".playlist-link").forEach((btn) => {
    btn.onclick = () => renderPlaylistContent(btn.getAttribute("data-name"));
  });
}
homeBtn.onclick = renderDefaultContent;
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
  songs.forEach((song) => {
    const imgSrc = `https://picsum.photos/seed/${song.id}/200`;
    const div = document.createElement("div");
    div.className = "song-item";
    div.innerHTML = `
      <button class="song-plus-btn" title="Add to playlist" data-songid="${song.id}">+</button>
      <button class="play-btn" data-url="${song.url}" data-name="${song.name}" style="padding:0;border:none;background:none;cursor:pointer;width:100%;">
        <img src="${imgSrc}" alt="cover" style="width:100%;border-radius:8px 8px 0 0;display:block;">
        <div style="width:100%;box-sizing:border-box;text-align:left;padding:0.5em 0;background:#222;color:#fff;border-radius:0 0 8px 8px;">
          ${song.name}
        </div>
      </button>
    `;
    grid.appendChild(div);
  });
  grid.querySelectorAll(".play-btn").forEach((btn) => {
    btn.onclick = () => showPlayerBar(btn.dataset.url, btn.dataset.name);
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
    <h2>Your Top Songs</h2>
    <div id="song-grid" class="song-grid"></div>
  </section>`;
  renderSongs(allSongs);
}
function renderPlaylistContent(playlistName) {
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
    const grid = document.getElementById("playlist-song-grid");
    playlist.songs.forEach((song) => {
      const imgSrc = `https://picsum.photos/seed/${song.id}/200`;
      const div = document.createElement("div");
      div.className = "song-item";
      div.innerHTML = `
        <button class="song-plus-btn" title="Add to playlist" data-songid="${song.id}">+</button>
        <button class="play-btn" data-url="${song.url}" data-name="${song.name}" style="padding:0;border:none;background:none;cursor:pointer;width:100%;">
          <img src="${imgSrc}" alt="cover" style="width:100%;border-radius:8px 8px 0 0;display:block;">
          <div style="width:100%;box-sizing:border-box;text-align:left;padding:0.5em 0;background:#222;color:#fff;border-radius:0 0 8px 8px;">
            ${song.name}
          </div>
        </button>
      `;
      grid.appendChild(div);
    });
    grid.querySelectorAll(".play-btn").forEach((btn) => {
      btn.onclick = () => showPlayerBar(btn.dataset.url, btn.dataset.name);
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

// ====== PLAYER BAR ======
function showPlayerBar(url, name) {
  playerAudio.pause();
  playerAudio.currentTime = 0;
  playerAudio.src = url;
  playerTitle.textContent = name;
  playerBar.style.display = "flex";
  playerAudio.play();
  playerPause.textContent = "⏸️";
}
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
fetch("music/songs.json")
  .then((res) => res.json())
  .then((songs) => {
    allSongs = songs;
    renderSidebarPlaylists();
    renderDefaultContent();
  });
