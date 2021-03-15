import mongoose from 'mongoose'
import { Lesson } from './domains/Lessons'

export class CPBStorage {
    private LessonModel = mongoose.model('Lesson', new mongoose.Schema({
      day: String,
      title: String,
      content: String,
      image: String,
      verse: String
    }))

    constructor () {
      mongoose.connect('mongodb://localhost:27017/cpbmais', { useNewUrlParser: true, useUnifiedTopology: true })
    }

    storeLessons (lessons: Lesson[]): Promise<void> {
      return new Promise((resolve, reject) => {
        Promise.all(lessons.map(lesson => new this.LessonModel(lesson).save())).then(() => {
          resolve()
        }).catch(e => {
          reject(e)
        })
      })
    }

    end (): void {
      mongoose.disconnect()
    }
}
