import puppeter, { Browser, Page } from 'puppeteer'

import { Lesson } from './domains/Lessons'

export class CPBScraper {
    private brownser !: Browser
    private page !: Page

    async getWeekLessons () : Promise<Lesson[]> {
      if (!this.brownser) {
        this.brownser = await puppeter.launch()
      }

      let lessons : Lesson[] = []

      try {
        await this.goToWeekLessonPage()

        const [weekLessons, introduction] = await Promise.all([
          this.getLessons(),
          this.getIntroductionLesson()
        ])

        lessons = weekLessons
        lessons.unshift(introduction)
      } catch (error) {
        console.error('Error', error)
      } finally {
        this.brownser.close()
      }

      return lessons
    }

    private async getLessons () : Promise<Lesson[]> {
      const selectors = ['#licaoSegunda', '#licaoTerca', '#licaoQuarta', '#licaoQuinta', '#licaoQuinta', '#licaoSexta']

      return Promise.all(
        selectors.map(async selector => {
          let [content, day, title] = await Promise.all([
            this.page.$eval(`${selector} .conteudoLicaoDia`, (el: Element) => el.textContent?.trim()),
            this.page.$eval(`${selector} .descriptionText`, (el:Element) => el.textContent?.trim()),
            this.page.$eval(`${selector} .titleLicaoDay`, (el) => el.textContent?.trim())
          ])

          if (content && day && title) {
            content = content.replace(/Esse tipo de conteúdo não está disponível nesse navegador./g, '').trim()

            return {
              content,
              title,
              day
            }
          }

          throw new Error('There is a problem to retrive data')
        }))
    }

    private async getIntroductionLesson () : Promise<Lesson> {
      const selector = '#licaoSabado'
      let [content, day, title, verse, image] = await Promise.all([
        this.page.$eval(`${selector} .conteudoLicaoDia`, (el: Element) => el.textContent?.trim()),
        this.page.$eval(`${selector} .diaSabadoLicao`, (el:Element) => el.textContent?.trim()),
        this.page.$eval(`${selector} .titleLicao`, (el) => el.textContent?.trim()),
        this.page.$eval(`${selector} .versoMemorizar`, (el) => el.textContent?.trim()),
        this.page.$eval(`${selector} .imageLicao`, (el) => el.getAttribute('style')?.trim())
      ])

      if (content && day && title) {
        content = content.replace(/Esse tipo de conteúdo não está disponível nesse navegador./g, '').trim()

        if (image) {
          const imageMatch = image.match(/background-image: url\((.*)\)/)

          if (imageMatch?.length) {
            image = imageMatch[1]
          } else {
            throw new Error('Could not retive image src')
          }
        }

        return {
          content,
          title,
          verse,
          image,
          day
        }
      }

      throw new Error('There is a problem to retrive data')
    }

    private async goToWeekLessonPage () : Promise<void> {
      this.page = await this.brownser.newPage()

      await this.page.goto('https://mais.cpb.com.br/licao-adultos/')

      const lessonLink = await this.page.$eval('.mdl-card a', (link) => link.getAttribute('href'))

      if (!lessonLink) {
        throw new Error('Lesson Link not found')
      }

      await this.page.goto(lessonLink)
    }
}
