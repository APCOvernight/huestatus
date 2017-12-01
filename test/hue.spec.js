/* eslint-disable no-unused-expressions */

const chai = require('chai')
chai.use(require('sinon-chai'))
const expect = chai.expect
const sinon = require('sinon')
const Hue = require('../src/Hue')

let HuejayMock
let connectionMock
let consoleMock

const mockConfig = {
  hue: {
    statuses: {

    }
  },
  modules: {

  },
  debug: false
}

describe('Hue Class', () => {
  beforeEach(() => {
    consoleMock = sinon.stub(console, 'info')

    HuejayMock = sinon.stub(require('huejay'), 'Client').returns({
      bridge: {
        get: () => {}
      },
      lights: {
        getAll: () => []
      }
    })
  })

  afterEach(() => {
    HuejayMock.restore()
    consoleMock.restore()
  })

  it('Loads config object', () => {
    const hue = new Hue(mockConfig)

    expect(hue.config).to.be.an('object')
    expect(hue.config.debug).to.be.false

    expect(HuejayMock).to.be.calledOnce
  })

  it('Loads HueJay connection', () => {
    const hue = new Hue(mockConfig)

    expect(hue.connection).to.be.an('object')

    expect(HuejayMock).to.be.calledOnce
  })

  it('Load bridge info on init', async () => {
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.bridge, 'get').resolves({
      name: 'Hue Bridge',
      id: 1,
      modelId: 'v1'
    })

    await hue.init()

    expect(hue.bridge).to.be.an('object')
    expect(consoleMock).to.not.be.called

    connectionMock.restore()
  })

  it('Log bridge info on init if debug is called', async () => {
    mockConfig.debug = true
    const hue = new Hue(mockConfig)
    connectionMock = sinon.stub(hue.connection.bridge, 'get').resolves({
      name: 'Hue Bridge',
      id: 1,
      modelId: 'v1'
    })

    await hue.init()

    expect(hue.bridge).to.be.an('object')
    expect(consoleMock).to.be.calledWith('Retrieved bridge Hue Bridge')
    expect(consoleMock).to.be.calledWith('  Id: 1')
    expect(consoleMock).to.be.calledWith('  Model Id: v1')

    connectionMock.restore()
    mockConfig.debug = false
  })
})
