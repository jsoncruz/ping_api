import { logger } from '@adonisjs/ace'
import { Ioc, IocContract } from '@adonisjs/fold'

import { EventsList } from '@ioc:Adonis/Core/Event'

import ScannersController from 'App/Controllers/Http/ScannersController'

export default class Server {
  protected container: IocContract
  private teste = 0
  constructor () {
    this.container = new Ioc()
    this.container.singleton('scanner/instance', () => {
      return new ScannersController({
        request: 'http://177.21.14.214:880/webrunstudio/wsConsEquMonExt.rule?sys=SDK',
        ticket: 'http://177.21.14.214:880/webrunstudio/wsMonExt.rule?sys=SDK',
      })
    })
  }
  public async handleServer ({ action }: EventsList['server:manager']) {
    const singleton: ScannersController = this.container.use('scanner/instance')
    console.log('>>>>>>', this.teste++)
    try {
      switch (action) {
        case 'start':
          await singleton.boot()
          await singleton.ignitor()
          break
        case 'stop':
          await singleton.stop()
          break
        case 'restart':
          await singleton.reboot()
          break
        default:
          console.log(action)
      }
    } catch (exception) {
      logger.fatal(exception)
    }
  }
}
