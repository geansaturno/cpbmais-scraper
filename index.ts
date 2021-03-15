import { CPBScraper } from './CPBScraper'
import { CPBStorage } from './CPBStorage'

class Main {
  constructor () {
    const cpbScrapper = new CPBScraper()
    cpbScrapper.getWeekLessons().then((lessons) => {
      console.log('lessons', lessons)

      const cpbStorage = new CPBStorage()

      cpbStorage.storeLessons(lessons).then(() => {
        console.log('Lessons saved')
        cpbStorage.end()
      }).catch(e => {
        console.error(e)
      })
    }).catch(e => {
      console.log('ocorreu um erro', e)
    })
  }
}

// eslint-disable-next-line no-new
new Main()
