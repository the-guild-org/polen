import * as Remark from 'remark'
import RemarkGfm from 'remark-gfm'
import RemarkHtml from 'remark-html'

export const parse = async (content: string): Promise<string> => {
  const result = await Remark.remark()
    .use(RemarkGfm)
    .use(RemarkHtml)
    .process(content)

  return String(result)
}

export const parseSync = (content: string): string => {
  const result = Remark.remark()
    .use(RemarkGfm)
    .use(RemarkHtml)
    .processSync(content)

  return String(result)
}
