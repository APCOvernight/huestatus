'use strict'

const uuidv4 = require('uuid/v4')

class mockModule {
  constructor (config, emitter) {
    this.config = config
    this.emitter = emitter
  }

  get instanceName () {
    return uuidv4()
  }

  async change (status, message) {
    await this.emitter.emit('change', this.instanceName, status, message)
  }

  async start () {
    console.error(`No start method defined on ${this.name} module`)
  }
}

module.exports = mockModule
