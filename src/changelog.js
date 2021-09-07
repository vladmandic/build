/**
 * Creates changelog in markdown format from git log as part of the build process
 */

const fs = require('fs');
const dayjs = require('dayjs');
const simpleGit = require('simple-git/promise');
const log = require('@vladmandic/pilogger');

const data = fs.readFileSync('package.json');
const app = JSON.parse(data);

const git = simpleGit();

let text = `# ${app.name}  

Version: **${app.version}**  
Description: **${app.description}**  

Author: **${app.author}**  
License: **${app.license}** </LICENSE>  
Repository: **<${app.repository.url}>**  

## Changelog
`;

async function update(f) {
  if (!fs.existsSync('.git')) {
    log.warn('No valid git repository:', '.git');
    return;
  }
  const gitLog = await git.log();
  const gitUrl = await git.listRemote(['--get-url']);
  const entries = [...gitLog.all].sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));

  let previous = '';
  const headings = [];
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

  fs.writeFileSync(f.log, text);
  log.state('ChangeLog:', { repository: gitUrl.replace('\n', ''), output: f.log });
}

exports.update = update;
