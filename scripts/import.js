import fs from "fs";
import path from "path";

const replaceInFile = (filePath, search, replace) => {
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(search, replace);
  fs.writeFileSync(filePath, content);
};

const distFolders = ["dist-cjs", "dist-es"];
distFolders.forEach((folder) => {
  fs.readdirSync(folder).forEach((file) => {
    if (file.endsWith(".js") || file.endsWith(".mjs") || file.endsWith(".cjs")) {
      const filePath = path.join('packages/**/' + folder, file);
      replaceInFile(filePath, `require('console')`, `import console from 'console';`);
    }
  });
});
