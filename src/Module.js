'use strict'

class mockModule {
  constructor (config, emitter, name) {
    this.config = config
    this.emitter = emitter
    this.name = name
  }

  async change (status, message) {
    await this.emitter.emit('change', this.name, status, message)
  }

  async start () {
    console.error(`No start method defined on ${this.name} module`)
  }
}

module.exports = mockModule
