/**
 * @Author: Rostislav Simonik <rostislav.simonik@technologystudio.sk>
 * @Date: 2021-06-05T15:06:45+02:00
 * @Copyright: Technology Studio
**/

import { is } from '@txo/types'
import { ResolverArguments } from '@txo-peer-dep/nested-filter-prisma'
import { Log } from '@txo/log'

import {
  MappingResult,
  MappingResultMap,
  MappingResultMode,
  MappingResultOptions,
  NestedFilterMapping,
  Type,
} from '../Model'

const log = new Log('txo.nested-filter-prisma.Api.Mapping')

const resolveObjectMappingValue = async <WHERE extends Record<string, unknown>>(
  type: Type,
  mappingValueMap: Record<string, unknown>,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments,
): Promise<MappingResult<WHERE>> => {
  const keyList = Object.keys(mappingValueMap)

  const resultMap: Record<string, MappingResult<unknown>> = {}
  for await (const key of keyList) {
    const mappingValue = mappingValueMap[key]
    const subResult = await resolveMappingValue(type, mappingValue, resultOptions, resolverArguments)
    log.debug('resolveObjectMappingValue, subresult', { subResult, mappingValue, key })
    if (subResult.mode !== MappingResultMode.INVALID) {
      resultOptions = subResult.options
    }
    resultMap[key] = subResult
  }

  if (keyList.length === 0 || keyList.every(key => resultMap[key].mode === MappingResultMode.ASSIGN)) {
    return {
      mode: MappingResultMode.ASSIGN,
      options: resultOptions,
      where: mappingValueMap as WHERE,
    }
  }

  if (keyList.some(key => resultMap[key].mode === MappingResultMode.INVALID)) {
    return {
      mode: MappingResultMode.INVALID,
      options: resultOptions,
    }
  }

  if (keyList.every(key => resultMap[key].mode === MappingResultMode.IGNORE)) {
    return {
      mode: MappingResultMode.IGNORE,
      options: resultOptions,
    }
  }

  log.debug('resolveObjectMappingValue', { resultMap })

  return {
    mode: MappingResultMode.MERGE,
    where: keyList.filter(key => resultMap[key].mode !== MappingResultMode.IGNORE).reduce((where: Record<string, WHERE>, key) => {
      where[key] = is(resultMap[key].where) as WHERE
      return where
    }, {}) as WHERE,
    options: resultOptions,
  }
}

const resolveArrayMappingValue = async <WHERE>(
  type: Type,
  mappingValueList: unknown[],
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments,
): Promise<MappingResult<WHERE[]>> => {
  const resultList = []
  for await (const mappingValue of mappingValueList) {
    const subResult = await resolveMappingValue(type, mappingValue, resultOptions, resolverArguments)
    if (subResult.mode !== MappingResultMode.INVALID) {
      resultOptions = subResult.options
    }
    resultList.push(subResult)
  }

  if (resultList.length === 0 || resultList.every(({ mode }) => mode === MappingResultMode.ASSIGN)) {
    return {
      mode: MappingResultMode.ASSIGN,
      options: resultOptions,
      where: mappingValueList as WHERE[],
    }
  }

  if (resultList.some(({ mode }) => mode === MappingResultMode.INVALID)) {
    return {
      mode: MappingResultMode.INVALID,
      options: resultOptions,
    }
  }

  if (resultList.every(({ mode }) => mode === MappingResultMode.IGNORE)) {
    return {
      mode: MappingResultMode.IGNORE,
      options: resultOptions,
    }
  }

  return {
    mode: MappingResultMode.MERGE,
    where: resultList.filter(({ mode }) => mode !== MappingResultMode.IGNORE).map(({ where }) => is(where) as WHERE),
    options: resultOptions,
  }
}

export const resolveMappingValue = async (
  type: Type,
  mappingValue: unknown,
  resultOptions: MappingResultOptions,
  resolverArguments: ResolverArguments,
): Promise<MappingResult<unknown>> => {
  switch (typeof mappingValue) {
    case 'object': {
      if (Array.isArray(mappingValue)) {
        return resolveArrayMappingValue(type, mappingValue, resultOptions, resolverArguments)
      }
      if (mappingValue) {
        return resolveObjectMappingValue(type, mappingValue as Record<string, unknown>, resultOptions, resolverArguments)
      }
      break
    }
    case 'function': {
      log.debug('resolveMappingValue function', { type, resultOptions })
      return mappingValue(type, resultOptions, resolverArguments)
    }
  }
  return {
    mode: MappingResultMode.ASSIGN,
    options: resultOptions,
    where: mappingValue,
  }
}

export const resolveMapping = async <WHERE>(
  mapping: NestedFilterMapping<WHERE>,
  resolverArguments: ResolverArguments,
): Promise<MappingResultMap<WHERE>> => {
  const mappingResultMap: MappingResultMap<WHERE> = {}
  for await (const _type of Object.keys(mapping)) {
    const type: Type = _type as Type

    mappingResultMap[type] = await resolveMappingValue(
      type,
      mapping[type],
      { typeIgnoreRuleList: [], typeUsageRuleList: [] },
      resolverArguments,
    ) as MappingResult<WHERE>
  }
  log.debug('resolveMapping', { mappingResultMap })
  return mappingResultMap
}
