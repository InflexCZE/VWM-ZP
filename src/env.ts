import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

const env = process.env

if (env.ENV_DIR) {
  const filenames = fs.readdirSync(process.env.ENV_DIR)
  filenames.forEach((filename) => {
    env[filename] = fs.readFileSync(path.resolve(env.ENV_DIR, filename))
  })
}
else {
  dotenv.config({
    silent: true
  })
}

export default env
