import { CPBScraper } from './CPBScraper'

class Main {
  constructor () {
    const cpbScrapper = new CPBScraper()
    cpbScrapper.getWeekLessons().then((lessons) => {
      console.log('lessons', lessons)
    }).catch(e => {
      console.log('ocorreu um erro', e)
    })
  }
}

// eslint-disable-next-line no-new
new Main()
