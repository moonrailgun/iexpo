import { CommandModule } from "yargs";
import { bundleJsPackage } from "../utils/bundle";
import got, { RequestError } from "got";
import { getFileConfig } from "../utils/config";
import { chalk, fs, path } from "zx";
import FormData from "form-data";
import _ from "lodash";
import simpleGit from "simple-git";

export const updateCommand: CommandModule = {
  command: "update",
  describe: "create a update and upload",
  builder: undefined,
  async handler() {
    const git = simpleGit();
    const hash = await git.revparse("HEAD");
    const isClean = (await git.status()).isClean();
    const branch = (await git.branch()).current;
    const message = (await git.log()).latest?.message;

    const config = await getFileConfig();
    if (!config.url || !config.apikey || !config.projectId) {
      console.log(chalk.red("Please run `ecus init` before."));
      return;
    }

    const zipPath = await bundleJsPackage();
    const buffer = await fs.readFile(zipPath);

    const form = new FormData();
    form.append("file", buffer, "tmp.zip");
    form.append("gitInfo", JSON.stringify({ hash, isClean, branch, message }));

    console.log("Uploading to remote:", config.url);
    try {
      const res = await got.put(
        `${config.url}/api/${config.projectId}/upload`,
        {
          headers: {
            Authorization: `Bearer ${config.apikey}`,
          },
          body: form,
        },
      );

      console.log(
        "Uploaded completed, deployment id:",
        _.get(JSON.parse(res.body), "id"),
      );
    } catch (err) {
      if (err instanceof RequestError) {
        console.log(err.response?.body);
      }

      throw err;
    }
  },
};
