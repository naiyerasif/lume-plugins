import { merge } from 'lume/core/utils.ts'

import type { Helper, Site } from 'lume/core.ts'

export interface Options {
	/** Reading speed in words per minute */
	wpm: number,

	/** Name of the filter */
	name: string
}

export const defaults: Options = {
	wpm: 250,
	name: 'readingTime'
}

/** A plugin to estimate the reading time of raw content */
export default function (userOptions?: Partial<Options>) {
	const options = merge(defaults, userOptions)

	return (site: Site) => {
		site.addEventListener('beforeBuild', () => {
			site.filter(options.name, filter as Helper)

			function filter(text: string, userOptions?: Partial<Options>): number {
				const options = merge(defaults, userOptions)
			
				const wordCount = text.trim().split(/\s+/g).length
				const minutes = wordCount / options.wpm
			
				if (minutes < 1) return 1
			
				const readingTime = Math.ceil(parseFloat(minutes.toFixed(2)))
				return readingTime
			}
		})
	}
}
