async function requestPermissions() {
    try {
      const result = await window.electronAPI.requestVideoAudioPermission();
      
      if (result.success) {
        console.log('Permissions granted:', result.stream);
      } else {
        console.error('Permissions denied:', result.error);
      }
    } catch (err) {
      console.error('Error during permission request:', err);
    }
  }
  
  // Call the function when the window is fully loaded
  window.addEventListener('DOMContentLoaded', () => {
    requestPermissions();
  });
  