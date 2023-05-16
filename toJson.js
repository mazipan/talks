const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

const writeFile = (pathFile, contentString) => {
  fs.writeFile(path.resolve(pathFile), contentString, function (err) {
    if (err) {
      return console.log(`❌ Error write file ${pathFile}`, err);
    }
    console.log(`✅ Success write file ${pathFile}`);
  });
};

const main = async () => {
  try {
    const readmeContent = await fs.readFileSync(path.resolve('./README.md'), {
      encoding: 'utf-8',
    });
    const html = md.render(readmeContent);
    const $ = cheerio.load(html);

    let objResult = {};
    $('h3')
      .map((i, el) => {
        const year = $(el).text();
        const data = $(el)
          .nextUntil('h3', 'h4')
          .map((_, h4) => {
            const title = $(h4).text();
            const data = $(h4)
              .next('ul')
              .children()
              .map((_, li) => {
                const text = $(li).text();
                if (text.includes('Event Link')) {
                  if (text.includes('here')) {
                    const link = $(li)
                      .children('a')
                      .map((_, a) => {
                        return $(a).attr('href');
                      })
                      .get();
                    return `Link: ${link}`;
                  }
                  return `Link: NOT_AVAILABLE`;
                } else if (text.includes('Slide')) {
                  if (text.includes('here')) {
                    const link = $(li)
                      .children('a')
                      .map((_, a) => {
                        return $(a).attr('href');
                      })
                      .get();
                    return `Slide: ${link}`;
                  }
                  return `Slide: NOT_AVAILABLE`;
                }
                return text;
              })
              .get();

            const formatteddata = {};
            data.forEach((item) => {
              const itemSplit = item.split(':');
              const t = itemSplit[0].trim().toLowerCase().replace(/\s/g, '_');
              if (t === 'link') {
                const v = item.replace('Link:', '').trim();
                const vArray = v.split(',');
                formatteddata[t] = vArray;
              } else if (t === 'slide') {
                const v = item.replace('Slide:', '').trim();
                formatteddata[t] = v;
              } else if (t === 'location') {
                const v = itemSplit[1].trim();
                formatteddata['place'] = v;
              } else {
                const v = itemSplit[1].trim();
                formatteddata[t] = v;
              }
            });
            const id = `${title
              .toLowerCase()
              .replace(/\./g, '')
              .replace(/[^\w ]/, '')
              .replace(/\s/g, '')}`;

            if (id.includes('topic:')) {
              return null;
            }

            return {
              id: `${title
                .toLowerCase()
                .replace(/\./g, '')
                .replace(/[^\w ]/, '')
                .replace(/\s/g, '')}`,
              event: title,
              ...formatteddata,
            };
          })
          .get()
          .filter(Boolean);

        objResult = {
          ...objResult,
          ...{
            [year]: data,
          },
        };

        return {
          [year]: data,
        };
      })
      .get();

    writeFile('./all-talks.json', JSON.stringify(objResult, null, 2));
    writeFile('./all-talks.js', `const talks = ${JSON.stringify(objResult, null, 2)};
    
export default talks;
    
    `);
    writeFile('./all-talks-node.js', `module.exports = ${JSON.stringify(objResult, null, 2)};
    `);
  } catch (error) {
    console.error('❌ Error read file README.md', error);
  }
};

main();
