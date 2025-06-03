import * as Remark from 'remark'
import RemarkHtml from 'remark-html'

export const parse = async (content: string): Promise<string> => {
  const result = await Remark.remark()
    .use(RemarkHtml)
    .process(content)

  return String(result)
}
