// export namespace GraphqlPatch {
//   export interface GraphqlPatch {
//     changes: Change[]
//   }

//   export type Change =
//     | Capability.Change
//     | Field.Change
//     | Arguments.Change
//     | Type.Change
//     | UnionType.Change
//     | OutputObjectType.Change
//     | InputObjectType.Change

//   // ---------

//   export namespace Capability {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//     }

//     export namespace Difference {
//       export type Difference = Directive

//       export interface Directive {
//         type: `Directive`
//         difference: GenericDifference.GenericDifference
//       }
//     }
//   }

//   // ---------

//   export namespace Type {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//     }

//     export namespace Difference {
//       export type Difference =
//         | Removed
//         | Added

//       export interface Removed {
//         type: `Removed`
//       }

//       export interface Added {
//         type: `Added`
//       }
//     }
//   }

//   // ---------

//   export namespace InputObjectType {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//     }

//     export namespace Difference {
//       export type Difference = GenericDifference.GenericDifference
//     }
//   }

//   // ---------

//   export namespace UnionType {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//     }

//     export namespace Difference {
//       export type Difference = Member

//       export interface Member {
//         type: `Member`
//         difference: GenericDifference.GenericDifference
//       }
//     }
//   }

//   export namespace OutputObjectType {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//     }

//     export namespace Difference {
//       export type Difference = Interface

//       export interface Interface {
//         type: `Interface`
//         difference: `Added` | `Removed`
//       }
//     }
//   }

//   // ---------

//   export namespace Arguments {
//     export interface Change extends ChangeBase {
//       difference: Difference
//       location: Location
//     }

//     export interface Difference {
//       added: null | [string, ...string[]]
//       removed: null | [string, ...string[]]
//       oneOf: null | `Added` | `Removed`
//     }

//     export interface Location {
//       type: string
//       field: string
//     }
//   }

//   // ---------

//   export namespace Field {
//     export interface Change extends ChangeBase {
//       difference: Difference.Difference
//       location: Location
//     }

//     export interface Location {
//       type: string
//     }

//     export namespace Difference {
//       export type Difference =
//         | Type
//         | GenericDifference.GenericDifference

//       export interface Type {
//         type: `Type`
//         after: string
//         before: string
//       }
//     }
//   }

//   // ---------

//   export interface ChangeBase {
//     name: string
//     description?: string
//   }

//   // ---------

//   export namespace GenericDifference {
//     export type GenericDifference = Added | Removed

//     export interface Removed {
//       type: `Removed`
//     }

//     export interface Added {
//       type: `Added`
//     }
//   }
// }
