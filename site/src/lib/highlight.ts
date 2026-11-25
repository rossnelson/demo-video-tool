/**
 * A small highlighter for the site's own code samples: comments and strings
 * in JavaScript, comments and the command name in shell. The input is the
 * site's own text; it is escaped before any markup goes in.
 */
export type Lang = 'js' | 'sh' | 'text';

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(code: string, lang: Lang): string {
	if (lang === 'text') return escape(code);
	if (lang === 'sh') {
		return code
			.split('\n')
			.map((line) => {
				const hash = line.search(/(^|\s)#/);
				const body = hash < 0 ? line : line.slice(0, hash);
				const comment = hash < 0 ? '' : line.slice(hash);
				const cmd = escape(body).replace(/^(\s*)(demo-video|brew|export|echo|mkdir|\$EDITOR|open)\b/, '$1<span class="t-cmd">$2</span>');
				return cmd + (comment ? `<span class="t-com">${escape(comment)}</span>` : '');
			})
			.join('\n');
	}
	// js: one pass over comments, strings and template strings.
	const re = /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)/g;
	let out = '';
	let last = 0;
	for (const m of code.matchAll(re)) {
		out += escape(code.slice(last, m.index));
		out += m[1] ? `<span class="t-com">${escape(m[1])}</span>` : `<span class="t-str">${escape(m[2])}</span>`;
		last = (m.index ?? 0) + m[0].length;
	}
	return out + escape(code.slice(last));
}
