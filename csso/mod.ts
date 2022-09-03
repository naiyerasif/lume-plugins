import { Page } from 'lume/core/filesystem.ts'
import { minify } from 'https://unpkg.com/csso@5.0.5/dist/csso.esm.js'

import type { Site } from 'lume/core.ts'

/** A plugin to minify all CSS files */
export default function () {
	return (site: Site) => {
		const options = {
			extensions: ['.css']
		}

		site.loadAssets(options.extensions)
		site.process(options.extensions, minifyStyles)

		function minifyStyles(file: Page) {
			if (typeof file.content === 'string') {
				file.content = minify(file.content).css
			}
		}
	}
}
