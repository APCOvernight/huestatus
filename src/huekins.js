'use strict'

class HueKins {
  constructor (config, light) {
    this.config = config
    this.light = light
  }

  async start () {
    setInterval(async () => {
      this.light.log('Something went wrong')
      await this.light.alert()
    }, 5000)
  }
}

module.exports = HueKins
