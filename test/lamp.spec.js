/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const Lamp = require('../src/Lamp')

let consoleMock
let saveMock

const mockConfig = {
  hue: {
    statuses: require('../lib/default-config').hue.statuses
  },
  debug: false
}

let lightMock

const lightsMock = {
  save: () => {}
}

describe('Lamp Class', () => {
  beforeEach(() => {
    consoleMock = sinon.stub(console, 'info')
    saveMock = sinon.stub(lightsMock, 'save').resolves(true)
    lightMock = {
      hue: 1000,
      brightness: 254,
      saturation: 254,
      alert: 'none'
    }
  })

  afterEach(() => {
    consoleMock.restore()
    saveMock.restore()
  })

  it('Loads config object', () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.config).to.be.an('object')
    expect(lamp.config.debug).to.be.false
  })

  it('Saves initial state', () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.initialState).to.be.an('object')
    expect(lamp.initialState.hue).to.equal(1000)
  })

  it('Change status to alert', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.alert()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.alert.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to working', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.working()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.working.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to ok', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.ok()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.ok.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Change status to warning', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    expect(lamp.isDirty).to.be.false

    await lamp.warning()

    expect(lamp.isDirty).to.be.true
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)
    expect(saveMock).to.be.calledOnce
  })

  it('Reset sets light back to initial state', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.warning()
    expect(lamp.light.hue).to.equal(require('../lib/default-config').hue.statuses.warning.hue)

    await lamp.reset()

    expect(lamp.light.hue).to.equal(1000)
    expect(saveMock).to.be.calledTwice
  })

  it('Reset ignores if light is already in intial state', async () => {
    const lamp = new Lamp(mockConfig, lightMock, lightsMock)

    await lamp.reset()

    expect(saveMock).to.not.be.called
  })
})

describe('Status Precedence tests', function () {
  it('if the statuses are OK, ALERT, then the status should become ALERT', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'alert'])
    expect(newStatus).to.equal('alert')
  })

  it('if the statuses are OK, WORKING then the status should become WORKING', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working'])
    expect(newStatus).to.equal('working')
  })

  it('if the statuses are OK, WORKING and WARNING then the status should become WARNING', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working', 'warning'])
    expect(newStatus).to.equal('warning')
  })

  it('if the statuses are OK, WORKING, ALERT and WARNING then the status should become ALERT', async () => {
    const newStatus = new Lamp(mockConfig, lightMock, lightsMock)._worstCaseScenario(['ok', 'working', 'alert', 'warning'])
    expect(newStatus).to.equal('alert')
  })
})
