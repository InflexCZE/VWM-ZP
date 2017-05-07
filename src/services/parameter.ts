import { Parameter } from '../models'

async function getInstance(name: string, defaultValue: number = 0) {
  const [instance] = await Parameter.findOrCreate({
    where: {
      name
    },
    defaults: {
      value: defaultValue
    }
  })

  return instance
}

export async function get(name: string, defaultValue: number = 0) {
  const instance  = await getInstance(name, defaultValue)
  return instance.value
}

export async function set(name: string, value: number) {
  const instance = await getInstance(name)
  await instance.update({ value })
}
