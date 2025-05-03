import type { FormattedExecutionResult, GraphQLFormattedError } from 'graphql'
// import { CONTENT_TYPE_GQL, CONTENT_TYPE_JSON } from '../../http.js'
import { isRecordLikeObject } from '#lib/prelude/prelude.js'

export interface RequestConfig {
  query: string
  variables?: Record<string, unknown> // Variables
  operationName?: string
}

export const parseExecutionResult = (result: unknown): FormattedExecutionResult => {
  if (typeof result !== `object` || result === null) {
    throw new Error(`Invalid execution result: result is not object`)
  }

  if (`errors` in result) {
    if (
      !Array.isArray(result.errors) ||
      result.errors.some(
        error =>
          !(isRecordLikeObject(error) && `message` in error &&
            typeof error[`message`] === `string`),
      )
    ) {
      throw new Error(`Invalid execution result: errors is not array of formatted errors`) // prettier-ignore
    }
    result.errors.forEach(maybeError => {
      if (!isFormattedError(maybeError)) {
        throw new Error(`Invalid value in errors array.`) // prettier-ignore
      }
    })
  }

  // todo add test coverage for case of null. @see https://github.com/graffle-js/graffle/issues/739
  if (`data` in result) {
    if (!isRecordLikeObject(result.data) && result.data !== null) {
      throw new Error(`Invalid execution result: data is not plain object`) // prettier-ignore
    }
  }

  if (`extensions` in result) {
    if (!isRecordLikeObject(result.extensions)) {
      throw new Error(`Invalid execution result: extensions is not plain object`) // prettier-ignore
    }
  }

  return result
}

// /**
//  * @see https://graphql.github.io/graphql-over-http/draft/#sec-Media-Types
//  */
// export const CONTENT_TYPE_REC = CONTENT_TYPE_JSON

// /**
//  * @see https://graphql.github.io/graphql-over-http/draft/#sec-Accept
//  * @see https://graphql.github.io/graphql-over-http/draft/#sec-Legacy-Watershed
//  */
// export const ACCEPT_REC = `${CONTENT_TYPE_GQL}; charset=utf-8, ${CONTENT_TYPE_JSON}; charset=utf-8`

// export const postRequestHeadersRec = {
//   accept: ACCEPT_REC,
//   'content-type': CONTENT_TYPE_REC,
// }

// export const getRequestHeadersRec = {
//   accept: ACCEPT_REC,
// }

export const getRequestEncodeSearchParameters = (
  request: RequestConfig,
): Record<string, string> => {
  return {
    query: request.query,
    ...(request.variables ? { variables: JSON.stringify(request.variables) } : {}),
    ...(request.operationName ? { operationName: request.operationName } : {}),
  }
}
export type getRequestEncodeSearchParameters = typeof getRequestEncodeSearchParameters

export const postRequestEncodeBody = (input: RequestConfig): BodyInit => {
  return JSON.stringify({
    query: input.query,
    variables: input.variables,
    operationName: input.operationName,
  })
}

export type postRequestEncodeBody = typeof postRequestEncodeBody

// todo make this more robust
export const isFormattedError = (error: unknown): error is GraphQLFormattedError => {
  return isRecordLikeObject(error) && `message` in error && typeof error[`message`] === `string`
}
