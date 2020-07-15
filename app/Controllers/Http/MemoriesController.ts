import { mean as _mean } from 'lodash'
import { cpu, mem, drive, os, netstat } from 'node-os-utils'
import { cpus } from 'os'

import { RequestProps } from 'App/Controllers/Http/ApisController'

export interface InMemoryCached {
  id: number;
  current: number;
  maximum: number;
}
export type MemoryRetriever = 'status' | 'air' | 'original' | 'usage'
export type StatusProps = 'start' | 'stop'

export default class MemoriesController {
  protected dataType: MemoryRetriever
  protected status: StatusProps
  protected onAir: Array<InMemoryCached>
  protected servers: Array<RequestProps>
  constructor (_type: MemoryRetriever, _status: StatusProps, _air: Array<InMemoryCached>, _servers: Array<RequestProps>) {
    this.dataType = _type
    this.status = _status
    this.onAir = _air
    this.servers = _servers
  }

  public async parser () {
    switch (this.dataType) {
      case 'status':
        return JSON.stringify({ status: this.status })
      case 'air':
        return JSON.stringify(this.onAir)
      case 'original':
        return JSON.stringify(this.servers)
      case 'usage':
        return await this.usage()
    }
  }

  private async usage () {
    const append = await (async () => {
      try {
        return {
          memory: await (async () => {
            const { totalMemMb, freeMemMb, usedMemMb } = await mem.info()
            return { total: `${totalMemMb}mb`, free: `${freeMemMb}mb`, usage: `${usedMemMb}mb` }
          })(),
          disk: await (async () => {
            const { totalGb, freeGb, usedPercentage } = await drive.info('/')
            return { total: `${totalGb}gb`, free: `${freeGb}gb`, usage: `${usedPercentage}%` }
          })(),
          netstat: await (async () => await netstat.stats())(),
        }
      } catch (exception) {
        return exception
      }
    })()
    return JSON.stringify({
      os: {
        hostname: os.hostname(),
        system: await os.oos(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: this.convertSeconds(os.uptime()),
      },
      cpu: {
        model: cpu.model(),
        cores: cpu.count(),
        clock: _mean(cpus().map(({ speed }) => speed)).toFixed(1).concat('mhz'),
        usage: `${await cpu.usage()}%`,
      },
      ...append,
    })
  }

  private convertSeconds (n: number) {
    let hour = 0
    let minute = 0
    let second = n
    while (second > 59) {
      second = second - 60
      minute++
      if (minute > 59) {
        minute = 0
        hour++
      }
    }
    return `${hour}:${minute}:${second}`
  }
}
