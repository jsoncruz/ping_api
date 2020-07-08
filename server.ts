/*
|--------------------------------------------------------------------------
| AdonisJs Server
|--------------------------------------------------------------------------
|
| The contents in this file is meant to bootstrap the AdonisJs application
| and start the HTTP server to accept incoming connections. You must avoid
| making this file dirty and instead make use of `lifecycle hooks` provided
| by AdonisJs service providers for custom code.
|
*/

import 'reflect-metadata'

import { Ignitor } from '@adonisjs/core/build/src/Ignitor'
import { HttpServer } from '@adonisjs/core/build/src/Ignitor/HttpServer'

import sourceMapSupport from 'source-map-support'

sourceMapSupport.install({ handleUncaughtExceptions: false })

class ServerManager {
  public httpServer: HttpServer
  constructor () {
    this.httpServer = new Ignitor(__dirname).httpServer()
  }
  public async stop () {
    await this.httpServer.close()
  }
  public async start () {
    await this.httpServer.start().catch(console.error)
  }
}

const service = new ServerManager()
service.start()

export { ServerManager, service }
