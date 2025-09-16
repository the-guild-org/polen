import {
  getNamedType,
  type GraphQLNamedType,
  isInputObjectType,
  isInterfaceType,
  isNamedType,
  isObjectType,
} from 'graphql'
import * as Types from './type.js'

export type Any =
  | Types.Enum
  | Types.InputObject
  | Types.Interface
  | Types.Object
  | Types.Scalar
  | Types.Union
  | Types.List<any>
  | Types.NonNull<any>

export type Memberable = Types.Enum | Types.Union
export const isMemberable = (value: unknown): value is Memberable => {
  return false // TODO: implement
}

export type Field = Types.InputField | Types.OutputField

export type Argable = Types.Directive | Types.OutputField
export const isArgable = (value: unknown): value is Argable => {
  return false // TODO: implement
}

export type Typeable = Types.Argument | Field
export const isTypable = (value: unknown): value is Typeable => {
  return false // TODO: implement
}

export const getTypeableNamedType = (value: Typeable): Named => {
  return getNamedType(value.type)
}

export type Input = Types.Enum | Types.Scalar | Types.InputObject
export const isInput = (value: unknown): value is Input => {
  return false // TODO: implement
}

export type Output = Types.Enum | Types.Scalar | Types.Interface | Types.Union | Types.Object
export const isOutput = (value: unknown): value is Output => {
  return false // TODO: implement
}

export type Named = GraphQLNamedType
export const isNamed = (type: unknown): type is Named => {
  return isNamedType(type)
}

export type Fielded = FieldedInput | FieldedOutput
export const isFielded = (type: unknown): type is Fielded => {
  return isFieldedOutput(type) || isFieldedInput(type)
}

export type FieldedOutput = Types.Interface | Types.Object
export const isFieldedOutput = (type: unknown): type is FieldedOutput => {
  return isInterfaceType(type) || isObjectType(type)
}

export type FieldedInput = Types.InputObject
export const isFieldedInput = (type: unknown): type is FieldedInput => {
  return isInputObjectType(type)
}

export type Directiveable =
  | Types.Object // OBJECT
  | Types.Interface // INTERFACE
  | Types.Union // UNION
  | Types.Scalar // SCALAR
  | Types.Enum // ENUM
  | Types.InputObject // INPUT_OBJECT
  | Types.OutputField // FIELD_DEFINITION
  | Types.InputField // INPUT_FIELD_DEFINITION
  | Types.Argument // ARGUMENT_DEFINITION

export const isDirectiveable = (value: unknown): value is Directiveable => {
  return Types.isObject(value)
    || Types.isInterface(value)
    || Types.isUnion(value)
    || Types.isScalar(value)
    || Types.isEnum(value)
    || Types.isInputObject(value)
    || Types.isOutputField(value)
    || Types.isInputField(value)
    || Types.isArgument(value)
}
