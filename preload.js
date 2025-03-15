const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electron', {
  getUserMedia: async (constraints) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices", error);
      throw error;
    }
  }
});
