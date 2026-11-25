import demo from '../../../../../bin/demo?raw';
import { usageCommands } from '#lib/reference/usage.ts';
import { commandGroups, type CommandGroup } from '#lib/reference/commands.ts';

export const prerender = true;

// The hand-written list, plus any command the usage block has that the list
// does not, so a new command shows here the day it lands in bin/demo.
export function load(): { groups: CommandGroup[] } {
	const known = new Set(commandGroups.flatMap((g) => g.commands.map((c) => c.name)));
	const extra = usageCommands(demo)
		.filter((c) => !known.has(c.name))
		.map((c) => ({ name: c.name, usage: `demo-video ${c.name} <project>`, text: c.text }));
	const groups = extra.length ? [...commandGroups, { title: 'More', commands: extra }] : commandGroups;
	return { groups };
}
