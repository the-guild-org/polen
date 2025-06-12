import { computed, reactive } from '@vue/reactivity'
import type { ComputedRef, UnwrapRefSimple } from '@vue/reactivity'

type Join<$Data> = (chunks: $Data[]) => $Data
type Create<$Data> = () => $Data

interface DataTypeOperations<$Data> {
  join: Join<$Data>
  create: Create<$Data>
}

export const create = <$Data extends object = object>(dataTypeOperations: DataTypeOperations<$Data>) => {
  return new ExtensibleData<$Data>(dataTypeOperations)
}

export class ExtensibleData<$Data extends object = object> {
  public value: ComputedRef<$Data> = computed(() => {
    const namespacedDataItems = Array.from(this.namespacedReactiveData.values())
    const data = this.dataTypeOperations.join(namespacedDataItems as $Data[])
    return data
  })

  private namespacedReactiveData = reactive(new Map<string, $Data>())

  private dataTypeOperations: DataTypeOperations<$Data>

  constructor(dataTypeOperations: DataTypeOperations<$Data>) {
    this.dataTypeOperations = dataTypeOperations
  }

  get(namespace: string): $Data {
    if (!this.namespacedReactiveData.has(namespace)) {
      const data = this.dataTypeOperations.create()
      this.namespacedReactiveData.set(namespace, data as UnwrapRefSimple<$Data>)
    }
    return this.namespacedReactiveData.get(namespace)! as $Data
  }
}
