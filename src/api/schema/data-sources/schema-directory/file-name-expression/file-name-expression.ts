import { Path } from '@wollybeard/kit'

export type Expression = ExpressionVersioned | ExpressionSingle

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

  const versioned = parseExpressionVersionedSerialized(serializedExpression)
  if (versioned) return { ...versioned, filePath: fileName, type: `FileNameExpressionVersioned` }

  const single = parseExpressionSingleSerialized(serializedExpression)
  if (single) return { ...single, filePath: fileName, type: `FileNameExpressionSingle` }

  return null
}

// ----

export interface ExpressionVersioned {
  type: `FileNameExpressionVersioned`
  date: Date
  filePath: string
}

const parseExpressionVersionedSerialized = (
  serializedExpression: string,
): Pick<ExpressionVersioned, `date`> | null => {
  const match = expressionVersionedSerializedPattern.exec(serializedExpression)
  if (!match) return null
  const { year, month, day } = match.groups as { year: string; month: string; day: string }
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  return { date }
}

const expressionVersionedSerializedPattern = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/

// export const isExpressionVersioned = (expression: Expression): expression is ExpressionVersioned => {
//   return expression.type === `FileNameExpressionVersioned`
// }

// ----

export interface ExpressionSingle {
  type: `FileNameExpressionSingle`
  filePath: string
}

const parseExpressionSingleSerialized = (
  serializedExpression: string,
): {} | null => {
  if (serializedExpression === `schema`) {
    return {}
  }
  return null
}

// ----

// export interface ExpressionLatest {
//   type: `FileNameExpressionLatest`
//   filePath: string
// }

// const parseExpressionLatestSerialized = (serializedExpression: string): null | {} => {
//   if (serializedExpression === `latest`) return {}
//   return null
// }

// export const isExpressionLatest = (expression: Expression): expression is ExpressionLatest => {
//   return expression.type === `FileNameExpressionLatest`
// }
