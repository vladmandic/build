/**
 * Creates changelog in markdown format from git log as part of the build process
 */

import * as fs from 'fs';
import * as log from '@vladmandic/pilogger';
import dayjs from 'dayjs';
import simpleGit from 'simple-git/promise';

const git = simpleGit();

const header = (app, url) => `# ${app.name}  

  Version: **${app.version}**  
  Description: **${app.description}**  
  
  Author: **${app.author}**  
  License: **${app.license}**  
  Repository: **<${url}>**  
  
## Changelog
  `;

export async function run(config, packageJson) {
  if (!fs.existsSync('.git')) {
    log.warn('No valid git repository:', '.git');
    return;
  }
  const gitLog = await git.log();
  const gitRemote = await git.listRemote(['--get-url']) || '';
  const gitUrl = gitRemote.replace('\n', '');
  const branch = await git.branchLocal();
  const entries = [...gitLog.all].sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  if (config.log.debug) log.data('Git Log:', entries);

  let previous = '';
  let text = header(packageJson, gitUrl);
  const headings: Array<string> = [];
  for (const l of entries) {
    const msg = l.message.toLowerCase();
    if ((l.refs !== '') || msg.match(/^[0-99].[0-99].[0-99]/)) {
      const dt = dayjs(l.date).format('YYYY/MM/DD');
      let ver = msg.match(/[0-99].[0-99].[0-99]/) ? msg : l.refs;
      ver = ver.replace('tag: v', '').replace('tag: ', 'release: ').split(',')[0];
      const heading = `\n### **${ver}** ${dt} ${l.author_email}\n\n`;
      if (!headings.includes(heading) && !ver.startsWith('tag')) {
        headings.push(heading);
        text += heading;
      }
    } else if ((msg.length > 2) && !msg.startsWith('update') && (previous !== msg)) {
      previous = msg;
      text += `- ${msg}\n`;
    }
  }

  fs.writeFileSync(config.changelog.output, text);
  log.state('ChangeLog:', { repository: gitUrl, branch: branch.current, output: config.changelog.output });
}
