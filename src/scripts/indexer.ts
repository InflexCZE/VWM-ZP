import * as Indexer from '../services/indexer'
import * as Parameter from '../services/parameter'

async function index() {
  await Indexer.TriggerIndexUpdate(await Parameter.get('minCommonRatings'))
}

console.log('Starting')
const start = Date.now()

index()

process.on('exit', () => {
  console.log('Done')
  console.log(`Total time: ${Date.now() - start} ms`)
})
