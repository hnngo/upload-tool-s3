import {
  listBucket,
  listFoldersOfBucket,
  uploadToS3,
  createBucket,
} from "./aws.js";
import {
  promptBucketChoiceQuestion,
  promptFolderChoiceQuestion,
  promptFlattenFolderChoiceQuestion,
  promptNameQuestion,
  NEW_BUCKET_CHOICE,
  CURRENT_FOLDER_CHOICE,
  NEW_FOLDER_CHOICE,
} from "./inquirer.js";
import { program } from "commander";

function parseArgumentsCLI() {
  program
    .argument("<filepath>", "Path to the file to process")
    .parse(process.argv);

  const filepath = program.args[0];
  return { filepath };
}

async function main() {
  let selectedBucket: string = "";
  let selectedFolder: string = "";
  let prefix = "";

  const { filepath } = parseArgumentsCLI();
  const allBuckets = await listBucket();
  const { bucket } = await promptBucketChoiceQuestion<{ bucket: string }>(
    allBuckets
  );

  if (bucket === NEW_BUCKET_CHOICE) {
    while (!selectedBucket) {
      let newBucketName = "";
      while (!newBucketName) {
        newBucketName = (await promptNameQuestion("bucket")).name;
      }

      // Create new bucket
      const { error } = await createBucket(newBucketName);
      if (!error) {
        selectedBucket = newBucketName;
      }
    }
  } else {
    selectedBucket = bucket;
  }

  // Because user might choose sub-folder, so it should be in a while loop
  while (true) {
    const subFolderList: string[] = await listFoldersOfBucket(bucket, prefix);
    const { folder } = await promptFolderChoiceQuestion(
      subFolderList
        .map((folder) => (!!prefix ? folder.replace(prefix, "") : folder))
        .map((folder) => folder.replace("/", ""))
    );

    if (folder === CURRENT_FOLDER_CHOICE) {
      selectedFolder = prefix;
      break;
    } else if (folder === NEW_FOLDER_CHOICE) {
      let folderName: string = "";

      // Keep asking till user input the folder name
      while (!folderName) {
        folderName = (await promptNameQuestion("folder")).name;
      }
      selectedFolder = prefix + folderName + "/";
      break;
    } else {
      prefix += folder + "/";
    }
  }

  const { keepParentFolder } = await promptFlattenFolderChoiceQuestion();
  await uploadToS3(selectedBucket, filepath, selectedFolder, keepParentFolder);
}

main();
