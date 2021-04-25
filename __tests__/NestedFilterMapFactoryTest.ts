/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T12:04:81+02:00
 * @Copyright: Technology Studio
**/

import { createNestedFilterMap } from '@txo/nested-filter-prisma/src'
import { nestedFilterList } from '../example/NestedFilters'

test('createNestedFilterMap - shoud pass', () => {
  const nestedFilterMap = createNestedFilterMap(nestedFilterList)
  expect(nestedFilterMap).toBe({})
})
