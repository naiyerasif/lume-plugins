import { merge } from 'lume/core/utils.ts'

import type { Helper, Site } from 'lume/core.ts'

export type TransformFunction = (readingTime: number) => string

export interface Options {
	/** Reading speed in words per minute */
	wpm: number,

	/** Name of the filter */
	name: string,

	/** Transformation function to generate a readable message */
	transform?: TransformFunction
}

export const defaults: Options = {
	wpm: 250,
	name: 'readingTime',
	transform(readingTime) {
		return `${readingTime} min read`
	}
}

function isTransformFunction(fn: unknown): fn is TransformFunction {
	return (typeof fn === 'function')
}

/** A plugin to estimate the reading time of raw content */
export default function (userOptions?: Partial<Options>) {
	const options = merge(defaults, userOptions)

	return (site: Site) => {
		site.addEventListener('beforeBuild', () => {
			site.filter(options.name, filter as Helper)

			function filter(text: string, userOptions?: Partial<Options>): number | string {
				const options = merge(defaults, userOptions)
			
				const wordCount = text.trim().split(/\s+/g).length
				const minutes = wordCount / options.wpm

				const readingTime = minutes > 1 ? Math.ceil(parseFloat(minutes.toFixed(2))) : 1
				return isTransformFunction(options['transform']) ? options.transform(readingTime) : readingTime
			}
		})
	}
}
