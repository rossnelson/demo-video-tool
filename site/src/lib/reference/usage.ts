/**
 * The command names in a bin/demo usage block: the comment lines that start
 * with "#   <word>". The line "#   demo-video <command> …" is the synopsis.
 */
export function usageCommands(script: string): { name: string; text: string }[] {
	const out: { name: string; text: string }[] = [];
	for (const line of script.split('\n')) {
		if (!line.startsWith('#')) {
			if (out.length) break;
			continue;
		}
		const m = /^#   (-{0,2}[a-z][a-z-]*)(?=\s|$)(.*)$/.exec(line);
		if (!m || ['demo-video', 'demo', 'bin'].includes(m[1])) continue;
		const text = m[2].replace(/^(\s+<[^>]+>|\s+\[[^\]]+\])+/, '').trim();
		out.push({ name: m[1], text });
	}
	return out;
}
