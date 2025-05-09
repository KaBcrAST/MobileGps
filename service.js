import TrackPlayer from 'react-native-track-player';

module.exports = async function() {
  // Cette fonction est appelée lorsque le service est démarré
  // Elle doit être exportée de cette façon pour TrackPlayer

  // Configurer les écouteurs d'événements pour les contrôles à distance
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
    // Vous pouvez ajouter du code ici si nécessaire
  });

  TrackPlayer.addEventListener('playback-state', (state) => {
    // Vous pouvez suivre l'état de lecture ici si nécessaire
    console.log('Playback state changed:', state);
  });
};