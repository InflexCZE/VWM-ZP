import { Parameter } from '../models'

export async function get(name: string, defaultValue: number = 0) {
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

export async function set(name: string, value: number) {
  const instance = await get(name)
  await instance.update({ value })
}
