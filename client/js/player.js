// HTML5 Video Player and Playback Progress Handling

export function setupPlayer(videoUrl, options = {}) {
  const playerView = document.getElementById('player-view');
  playerView.innerHTML = `
    <div class="video-wrapper">
      <video id="html5-video" controls autoplay>
        <source src="${videoUrl}" type="video/mp4" />
        Browser Anda tidak mendukung tag video.
      </video>
      <button id="close-player">Tutup</button>
    </div>
  `;

  const video = document.getElementById('html5-video');
  const closeBtn = document.getElementById('close-player');

  closeBtn.addEventListener('click', () => {
    video.pause();
    playerView.classList.add('hidden');
  });
}
