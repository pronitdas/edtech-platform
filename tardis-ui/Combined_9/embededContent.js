document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("videoPlayPause")
    .addEventListener("click", playVideo);
  document.getElementById("videoRewind").addEventListener("click", rewindVideo);
  document
    .getElementById("videoFastForward")
    .addEventListener("click", fastForwardVideo);

  function playVideo() {
    const videoPlayer = document.getElementById("embeded-video-on-blackboard");
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }

  function fastForwardVideo() {
    const videoPlayer = document.getElementById("embeded-video-on-blackboard");
    videoPlayer.currentTime += 10;
  }

  function rewindVideo() {
    const videoPlayer = document.getElementById("embeded-video-on-blackboard");
    videoPlayer.currentTime -= 10;
  }
});
