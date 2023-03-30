var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import chalk from "chalk";
dotenv.config();
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();
// List all buckets in S3
export const listBucket = () => {
    return new Promise((resolve, reject) => {
        s3.listBuckets((err, data) => {
            if (err || !data.Buckets) {
                return resolve([]);
            }
            const buckets = [];
            data.Buckets.forEach((bucket) => {
                if (bucket.Name) {
                    buckets.push(bucket.Name);
                }
            });
            resolve(buckets);
        });
    });
};
// List all folders of a bucket in S3
export const listFoldersOfBucket = (bucketName, prefix) => {
    return new Promise((resolve, reject) => {
        s3.listObjectsV2({ Bucket: bucketName, Prefix: prefix, Delimiter: "/" }, (err, data) => {
            if (err || !data.CommonPrefixes) {
                return resolve([]);
            }
            const folders = [];
            data.CommonPrefixes.forEach((folder) => {
                if (folder.Prefix) {
                    folders.push(folder.Prefix);
                }
            });
            resolve(folders);
        });
    });
};
// Upload a file to S3
export const putObject = (bucketName, fileName, s3UploadingPath) => {
    let awsFilePath = s3UploadingPath + fileName;
    if (fileName.includes("/")) {
        awsFilePath =
            s3UploadingPath + fileName.slice(fileName.lastIndexOf("/") + 1);
    }
    return new Promise((resolve) => {
        // Prepare the s3 uploading path
        let fileContent;
        try {
            fileContent = fs.readFileSync(fileName);
        }
        catch (error) {
            console.log(chalk.red("Error reading file: " + fileName));
            return;
        }
        // Uploading logic
        s3.putObject({ Bucket: bucketName, Key: awsFilePath, Body: fileContent }, (err) => {
            if (err) {
                console.log(chalk.red(`Unsuccessfully uploaded ${fileName}`));
                return resolve({ error: err.message });
            }
            else {
                console.log(chalk.green(`Successfully uploaded ${fileName} to s3://${bucketName}/${awsFilePath}`));
                return resolve({ error: 0 });
            }
        });
    });
};
// Upload a folder to S3
export const uploadToS3 = (bucketName, uploadingPath, s3UploadingPath, keepParentFolder = false) => {
    return new Promise((resolve) => __awaiter(void 0, void 0, void 0, function* () {
        const stats = fs.statSync(uploadingPath);
        // Check if this is a directory or not
        if (stats.isDirectory()) {
            const files = fs.readdirSync(uploadingPath);
            const result = {};
            for (const file of files) {
                const filePath = path.join(uploadingPath, file);
                const uploadingResult = yield putObject(bucketName, filePath, keepParentFolder
                    ? path.join(s3UploadingPath, path.basename(uploadingPath)) + "/"
                    : s3UploadingPath);
                result[filePath] = uploadingResult;
            }
            resolve(result);
        }
        else {
            resolve(putObject(bucketName, uploadingPath, s3UploadingPath));
        }
    }));
};
// List all buckets in S3
export const createBucket = (bucketName) => {
    return new Promise((resolve) => {
        s3.createBucket({ Bucket: bucketName }, (err) => {
            if (err && err.message) {
                console.log(chalk.red(err.message));
                return resolve({ error: err.message });
            }
            else {
                console.log(chalk.green(`Successfully created new bucket s3://${bucketName}`));
                return resolve({ error: 0 });
            }
        });
    });
};
