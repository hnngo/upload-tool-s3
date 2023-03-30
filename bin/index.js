var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { listBucket, listFoldersOfBucket, uploadToS3, createBucket, } from "./aws.js";
import { promptBucketChoiceQuestion, promptFolderChoiceQuestion, promptFlattenFolderChoiceQuestion, promptNameQuestion, NEW_BUCKET_CHOICE, CURRENT_FOLDER_CHOICE, NEW_FOLDER_CHOICE, } from "./inquirer.js";
import { program } from "commander";
function parseArgumentsCLI() {
    program
        .argument("<filepath>", "Path to the file to process")
        .parse(process.argv);
    const filepath = program.args[0];
    return { filepath };
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        let selectedBucket = "";
        let selectedFolder = "";
        let prefix = "";
        const { filepath } = parseArgumentsCLI();
        const allBuckets = yield listBucket();
        const { bucket } = yield promptBucketChoiceQuestion(allBuckets);
        if (bucket === NEW_BUCKET_CHOICE) {
            while (!selectedBucket) {
                let newBucketName = "";
                while (!newBucketName) {
                    newBucketName = (yield promptNameQuestion("bucket")).name;
                }
                // Create new bucket
                const { error } = yield createBucket(newBucketName);
                if (!error) {
                    selectedBucket = newBucketName;
                }
            }
        }
        else {
            selectedBucket = bucket;
        }
        // Because user might choose sub-folder, so it should be in a while loop
        while (true) {
            const subFolderList = yield listFoldersOfBucket(bucket, prefix);
            const { folder } = yield promptFolderChoiceQuestion(subFolderList
                .map((folder) => (!!prefix ? folder.replace(prefix, "") : folder))
                .map((folder) => folder.replace("/", "")));
            if (folder === CURRENT_FOLDER_CHOICE) {
                selectedFolder = prefix;
                break;
            }
            else if (folder === NEW_FOLDER_CHOICE) {
                let folderName = "";
                // Keep asking till user input the folder name
                while (!folderName) {
                    folderName = (yield promptNameQuestion("folder")).name;
                }
                selectedFolder = prefix + folderName + "/";
                break;
            }
            else {
                prefix += folder + "/";
            }
        }
        const { keepParentFolder } = yield promptFlattenFolderChoiceQuestion();
        yield uploadToS3(selectedBucket, filepath, selectedFolder, keepParentFolder);
    });
}
main();
