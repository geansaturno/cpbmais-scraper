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

        const [weekLessons, introduction, auxiliar] = await Promise.all([
          this.getLessons(),
          this.getIntroductionLesson(),
          this.getAuxiliaryLesson()
        ])

        lessons = weekLessons
        lessons.unshift(introduction)
        lessons.push(auxiliar)
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
            this.getTextContent(`${selector} .conteudoLicaoDia`),
            this.getTextContent(`${selector} .descriptionText`),
            this.getTextContent(`${selector} .titleLicaoDay`)
          ])

          if (content && day && title) {
            content = this.cleanBrownserError(content)

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
      let [content, day, title, verse, image, kicker] = await Promise.all([
        this.getTextContent(`${selector} .conteudoLicaoDia`),
        this.getTextContent(`${selector} .diaSabadoLicao`),
        this.getTextContent(`${selector} .titleLicao`),
        this.getTextContent(`${selector} .versoMemorizar`),
        this.getTextContent(`${selector} .imageLicao`),
        this.getTextContent(`${selector} .numberLicao`)
      ])

      if (content && day && title) {
        content = this.cleanBrownserError(content)

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
          day,
          kicker
        }
      }

      throw new Error('There is a problem to retrive data')
    }

    private async getAuxiliaryLesson () : Promise<Lesson> {
      const selector = '#licaoAuxiliar'
      let [content, title, kicker] = await Promise.all([
        this.getTextContent(`${selector} .conteudoLicaoDia`),
        this.getTextContent(`${selector} .titleLicaoAuxiliar`),
        this.getTextContent(`${selector} .numberLicao`)
      ])

      if (content && title && kicker) {
        content = this.cleanBrownserError(content)

        return {
          content,
          title,
          kicker
        }
      }

      throw new Error('There is a problem to retrive data')
    }

    private getTextContent (selector: string): Promise<string | undefined> {
      return this.page.$eval(selector, (el: Element) => el.textContent?.trim())
    }

    private cleanBrownserError (text: string) :string {
      return text.replace(/Esse tipo de conteúdo não está disponível nesse navegador./g, '').trim()
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
