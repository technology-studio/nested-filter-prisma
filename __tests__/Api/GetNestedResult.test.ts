/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-04-25T17:04:58+02:00
 * @Copyright: Technology Studio
**/

import { invokeResolver } from '../Utils'
import {
  POST,
  LEVEL_1_ID_INFO,
  LEVEL_1_POST_NESTED_RESULT_NODE,
  AUTHOR,
} from '../Data'
import { Author, Post } from '@prisma/client'
import { ResultCacheImpl } from '@txo/nested-filter-prisma'

describe('getNestedResult', () => {
  test('getNestedResult - return existing value', async () => {
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Post' })

      expect(result).toEqual(POST)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE })
  })

  test('getNestedResult - throw exception for existing result', async () => {
    return expect(
      invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
        const result = await context.getNestedResult({ type: 'Author' })

        expect(result).toEqual(POST)
        return source.id
      }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE }),
    ).rejects.toThrow(/^Nested result for \(Author\) is not present\.$/)
  })

  test('getNestedResult - return fallback value', async () => {
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet })

      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE })
    expect(onGet).toBeCalledTimes(1)
  })

  test('getNestedResult - return null value', async () => {
    const onGet = jest.fn(async (): Promise<Author | null> => null)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult<'Author', null>({ type: 'Author', onGet, cacheKey: '<id>' })

      expect(result).toEqual(null)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE })
    expect(onGet).toBeCalledTimes(1)
  })

  test('getNestedResult - return explicitly added result value if add result enabled', async () => {
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      await context.getNestedResult({ type: 'Author', onGet, addNestedResult: true })
      const result = await context.getNestedResult({ type: 'Author', onGet })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE })
    expect(onGet).toBeCalledTimes(1)
  })

  test('getNestedResult - return cached value', async () => {
    const resultCache = new ResultCacheImpl()
    const onGet = jest.fn(async (): Promise<Author> => AUTHOR)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet, cacheKey: AUTHOR.id })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE, resultCache })

    expect(onGet).toBeCalledTimes(1)
    await invokeResolver<Post, undefined, string>(async (source, args, context, info) => {
      const result = await context.getNestedResult({ type: 'Author', onGet, cacheKey: AUTHOR.id })
      expect(result).toEqual(AUTHOR)
      return source.id
    }, POST, undefined, LEVEL_1_ID_INFO, { rootNestedResultNode: LEVEL_1_POST_NESTED_RESULT_NODE, resultCache })
    expect(onGet).toBeCalledTimes(1)
  })
})
