import { Path } from '#dep/path/index.js'

export type Expression = ExpressionPrevious

export const parseOrThrow = (fileNameOrSerializedExpression: string): Expression => {
  const result = parse(fileNameOrSerializedExpression)
  if (!result) throw new Error(`Invalid serialized expression: ${fileNameOrSerializedExpression}`)

  return result
}

export const parse = (fileName: string): null | Expression => {
  const path = Path.parse(fileName)
  if (path.ext !== `.graphql`) {
    throw new Error(
      `If file name is provided, must be .graphql. Got: ${fileName}`,
    )
  }
  const serializedExpression = path.name

  const previous = parseExpressionPreviousSerialized(serializedExpression)
  if (previous) return { ...previous, filePath: fileName, type: `FileNameExpressionPrevious` }

  // const latest = parseExpressionLatestSerialized(serializedExpression)
  // if (latest) return { ...latest, filePath: fileName, type: `FileNameExpressionLatest` }

  return null
}

// ----

export interface ExpressionPrevious {
  type: `FileNameExpressionPrevious`
  date: Date
  filePath: string
}

const parseExpressionPreviousSerialized = (
  serializedExpression: string,
): Pick<ExpressionPrevious, `date`> | null => {
  const match = expressionPreviousSerializedPattern.exec(serializedExpression)
  if (!match) return null
  const { year, month, day } = match.groups as { year: string, month: string, day: string }
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return { date }
}

const expressionPreviousSerializedPattern = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/

// export const isExpressionPrevious = (expression: Expression): expression is ExpressionPrevious => {
//   return expression.type === `FileNameExpressionPrevious`
// }

// ----

// export interface ExpressionLatest {
//   type: `FileNameExpressionLatest`
//   filePath: string
// }

// // eslint-disable-next-line
// const parseExpressionLatestSerialized = (serializedExpression: string): null | {} => {
//   if (serializedExpression === `latest`) return {}
//   return null
// }

// export const isExpressionLatest = (expression: Expression): expression is ExpressionLatest => {
//   return expression.type === `FileNameExpressionLatest`
// }
