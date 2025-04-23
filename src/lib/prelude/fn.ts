export type ExtractAsync<$Fn extends Any> = $Fn extends (...args: any[]) => infer __return__
  ? (...args: Parameters<$Fn>) => Extract<__return__, Promise<any>>
  : never

export type Any = (...args: any[]) => any

export type AnyAsync = (...args: any[]) => Promise<any>
