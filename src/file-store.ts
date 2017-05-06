import * as path from 'path'
import * as fs from 'fs'

export default class FileStore {
  private path: string
  private store: {
    ttl: {
      [key: string]: number
    }

    data: {
      [key: string]: any
    }
  }

  constructor() {
    this.path = path.join(__dirname, '../.session.json')

    try {
      this.store = JSON.parse(fs.readFileSync(this.path, 'utf8'))
    }
    catch (err) {
      this.store = {
        ttl: {},
        data: {}
      }
    }
  }

  get(sid: string) {
    if (this.store.data[sid] && this.store.ttl[sid] <= Date.now()) {
      this.destroy(sid)
    }

    return this.store.data[sid]
  }


  set(sid: string, data: any, ttl: number) {
    this.store.data[sid] = data
    this.store.ttl[sid] = Date.now() + ttl

    this.save()
  }

  destroy(sid: string) {
    delete this.store.data[sid]
    delete this.store.ttl[sid]

    this.save()
  }

  private save() {
    fs.writeFileSync(this.path, JSON.stringify(this.store), { encoding: 'utf8' })
  }
}
