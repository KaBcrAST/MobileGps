import TrackPlayer from 'react-native-track-player';

module.exports = async function() {

  TrackPlayer.addEventListener('remote-play', () => {
    TrackPlayer.play();
  });

  TrackPlayer.addEventListener('remote-pause', () => {
    TrackPlayer.pause();
  });

  TrackPlayer.addEventListener('remote-stop', () => {
    TrackPlayer.stop();
  });

  TrackPlayer.addEventListener('remote-jump-forward', async (data) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position + data.interval);
  });

  TrackPlayer.addEventListener('remote-jump-backward', async (data) => {
    const position = await TrackPlayer.getPosition();
    await TrackPlayer.seekTo(position - data.interval);
  });

  TrackPlayer.addEventListener('playback-track-changed', () => {
  });

  TrackPlayer.addEventListener('playback-state', (state) => {
  });
};