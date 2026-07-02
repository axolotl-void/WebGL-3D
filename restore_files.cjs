const fs = require('fs');
const path = require('path');

const transcriptPath = '/Users/yogiprasetyasadewa/.gemini/antigravity-ide/brain/e0dcec4f-3af8-47ca-afce-d9c3fa633f7e/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

const filesToRestore = {
  '/Users/yogiprasetyasadewa/Documents/02_Portofolio/porto-webGL/src/App.jsx': '',
  '/Users/yogiprasetyasadewa/Documents/02_Portofolio/porto-webGL/src/scenes/MainScene.jsx': '',
  '/Users/yogiprasetyasadewa/Documents/02_Portofolio/porto-webGL/src/scenes/SecondScene.jsx': '',
  '/Users/yogiprasetyasadewa/Documents/02_Portofolio/porto-webGL/src/components/transitions/FadeTransition.jsx': ''
};

for (const line of lines) {
  if (!line) continue;
  const entry = JSON.parse(line);
  if (entry.type === 'VIEW_FILE' && entry.status === 'DONE') {
    for (const filePath of Object.keys(filesToRestore)) {
      if (entry.content.includes(`File Path: \`file://${filePath}\``)) {
        filesToRestore[filePath] = entry.content;
      }
    }
  }
}

for (const [filePath, content] of Object.entries(filesToRestore)) {
  if (content) {
    // Extract everything after "The following code has been modified..."
    const match = content.match(/leading space\.\n([\s\S]+)\nThe above content shows/);
    if (match) {
      const codeLines = match[1].split('\n').map(l => {
        const colonIdx = l.indexOf(':');
        if (colonIdx > 0 && !isNaN(parseInt(l.substring(0, colonIdx)))) {
          return l.substring(colonIdx + 2); // remove "line_num: "
        }
        return l;
      });
      fs.writeFileSync(filePath, codeLines.join('\n'));
      console.log(`Restored ${filePath}`);
    }
  } else {
    console.log(`Could not find content for ${filePath}`);
  }
}
