module.exports = {
  hue: {
    host: null,
    port: 80,
    username: null,
    timeout: 15000,
    statuses: {
      alert: {
        hue: 0,
        brightness: 254,
        saturation: 254,
        flashing: true
      },
      ok: {
        hue: 25500,
        brightness: 254,
        saturation: 254,
        flashing: false
      },
      warning: {
        hue: 12750,
        brightness: 254,
        saturation: 254,
        flashing: false
      },
      working: {
        hue: 46920,
        brightness: 254,
        saturation: 254,
        flashing: false
      }
    }
  },
  modules: [],
  reporters: []
}
