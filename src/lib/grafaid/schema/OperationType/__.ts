import type { OperationTypeMutation, OperationTypeQuery, OperationTypeSubscription } from './_.ts'

export * as OperationType from './_.ts'
export type OperationType = OperationTypeQuery | OperationTypeMutation | OperationTypeSubscription
