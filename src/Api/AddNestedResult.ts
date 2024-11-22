/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2022-05-08T14:05:41+02:00
 * @Copyright: Technology Studio
**/

import { Log } from '@txo/log'

import {
  type AddNestedResultAttributes,
  AddNestedResutMode,
  type NestedArgMap,
  type NestedResultNode,
  type Type,
} from '../Model/Types'

const log = new Log('txo.nested-filter-prisma.src.Api.AddNestedResult')

export const addNestedResultFactory = (
  nestedResultNode: NestedResultNode | undefined,
  nestedArgMap: NestedArgMap,
) => <TYPE extends Type>({
  type, result, mode,
}: AddNestedResultAttributes<TYPE>): void => {
  if (nestedResultNode) {
    if (mode === AddNestedResutMode.CHILDREN) {
      nestedResultNode.childrenNestedArgMap[type] = result
    } else {
      nestedArgMap[type] = result
      nestedResultNode.nestedArgMap[type] = result
    }
    log.debug('addNestedResult', { nestedArgMap })
  }
}
