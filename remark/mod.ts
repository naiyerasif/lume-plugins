import loader from 'lume/core/loaders/text.ts'
import { merge } from 'lume/core/utils.ts'
import rehypeRaw from 'https://esm.sh/rehype-raw@6.1.1'
import rehypeSanitize from 'https://esm.sh/rehype-sanitize@5.0.1'
import rehypeStringify from 'https://esm.sh/rehype-stringify@9.0.3'
import remarkGfm from 'https://esm.sh/remark-gfm@3.0.1'
import remarkParse from 'https://esm.sh/remark-parse@10.0.1'
import remarkRehype from 'https://esm.sh/remark-rehype@10.1.0'
import { unified, Processor } from 'https://esm.sh/unified@10.1.2'

import type { Data, Engine, Helper, Site } from 'lume/core.ts'

export interface Options {
	/** List of extensions this plugin applies to */
	extensions: string[],

	/** List of remark plugins to use */
	remarkPlugins?: unknown[],

	/** List of rehype plugins to use */
	rehypePlugins?: unknown[],

	/** Flag to turn on HTML sanitization to prevent XSS */
	sanitize?: boolean,

	/** Flag to override the default plugins */
	overrideDefaultPlugins?: boolean
}

// Default options
export const defaults: Options = {
	extensions: ['.md'],
	// By default, GitHub-flavored markdown is enabled
	remarkPlugins: [remarkGfm]
}

/** Template engine to render Markdown files with Remark */
export class MarkdownEngine implements Engine {
	engine: Processor

	constructor(engine: Processor) {
		this.engine = engine
	}

	deleteCache() {}

	async render(content: string, data?: Data, filename?: string): Promise<string> {
		return (await this.engine.process({ value: content, data: data || {}, path: filename })).toString()
	}

	renderSync(content: string, data?: Data, filename?: string): string {
		return this.engine.processSync({ value: content, data: data || {}, path: filename }).toString()
	}

	addHelper() {}
}

/** Register the plugin to support Markdown */
export default function (userOptions?: Partial<Options>) {
	const options = merge(defaults, userOptions)

	return function (site: Site) {
		const plugins = []

		// Add remark-parse to generate MDAST
		plugins.push(remarkParse)

		if (!options.overrideDefaultPlugins) {
			// Add default remark plugins
			defaults.remarkPlugins?.forEach((defaultPlugin) => plugins.push(defaultPlugin))
		}

		// Add remark plugins
		options.remarkPlugins?.forEach((plugin) => plugins.push(plugin))

		// Add remark-rehype to generate HAST
		plugins.push([remarkRehype, { allowDangerousHtml: true }])

		if (options.sanitize) {
			// Add rehype-raw to convert raw HTML to HAST
			plugins.push(rehypeRaw)
		}

		// Add rehype plugins
		options.rehypePlugins?.forEach((plugin) => plugins.push(plugin))

		if (options.sanitize) {
			// Add rehype-sanitize to make sure HTML is safe
			plugins.push(rehypeSanitize)
			// Add rehype-stringify to output HTML ignoring raw HTML nodes
			plugins.push(rehypeStringify)
		} else {
			// Add rehype-stringify to output HTML
			plugins.push([rehypeStringify, { allowDangerousHtml: true }])
		}

		// @ts-ignore: This expression is not callable
		const engine = unified()

		// Register all plugins
		// @ts-ignore: let unified take care of loading all the plugins
		engine.use(plugins)

		// Load the pages
		const remarkEngine = new MarkdownEngine(engine)
		site.loadPages(options.extensions, loader, remarkEngine)

		// Register the md and mdAsync filters
		site.filter('md', filter as Helper)
		site.filter('mdAsync', filterAsync as Helper, true)

		async function filterAsync(content: string | Data): Promise<string | Data> {
			if (typeof content === 'string') {
				return (await remarkEngine.render(content)).trim()
			} else {
				const processed = (await remarkEngine.render(content.content as string, content)).trim()
				content.content = processed
				return content
			}
		}

		function filter(content: string | Data): string | Data {
			if (typeof content === 'string') {
				return remarkEngine.renderSync(content).trim()
			} else {
				const processed = remarkEngine.renderSync(content.content as string, content).trim()
				content.content = processed
				return content
			}
		}
	}
}
