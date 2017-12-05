/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const events = require('events')
const Module = require('../src/Module')

const mockConfig = {
  name: 'mySuperModule'
}

describe('Module base class', () => {
  it('Should throw error if base start method is called', async () => {
    const module = new Module(mockConfig, new events.EventEmitter())

    expect(module.start).to.be.a('function')

    try {
      await module.start()
      expect(0).to.equal(1)
    } catch (e) {
      expect(e.message).to.contain('No start method defined on')
    }
  })

  it('Should have a generateInstanceName method that returns a string', async () => {
    const module = new Module(mockConfig, new events.EventEmitter())
    const module2 = new Module(mockConfig, new events.EventEmitter())
    expect(module.generateInstanceName()).to.be.a('string')
    expect(module.generateInstanceName()).to.match(/^mySuperModule/)

    expect(module.instanceName).to.not.equal(module2.instanceName)
  })

  it('Change method should call event emitter', async () => {
    const module = new Module(mockConfig, new events.EventEmitter())
    const spy = sinon.spy()
    expect(module.change).to.be.a('function')

    module.emitter.on('change', spy)

    module.change('ok', 'All Passing')

    expect(spy).to.be.calledOnce
  })
})
