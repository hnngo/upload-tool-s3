import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import AWS, { AWSError } from "aws-sdk";
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
  return new Promise<string[]>((resolve, reject) => {
    s3.listBuckets((err: AWSError, data: AWS.S3.ListBucketsOutput) => {
      if (err || !data.Buckets) {
        return resolve([]);
      }
      const buckets: string[] = [];
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
export const listFoldersOfBucket = (
  bucketName: string,
  prefix: string
): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    s3.listObjectsV2(
      { Bucket: bucketName, Prefix: prefix, Delimiter: "/" },
      (err: AWSError, data: AWS.S3.ListObjectsV2Output) => {
        if (err || !data.CommonPrefixes) {
          return resolve([]);
        }
        const folders: string[] = [];
        data.CommonPrefixes.forEach((folder) => {
          if (folder.Prefix) {
            folders.push(folder.Prefix);
          }
        });
        resolve(folders);
      }
    );
  });
};

// Upload a file to S3
export const putObject = (
  bucketName: string,
  fileName: string,
  s3UploadingPath: string
): Promise<{ error: number | string }> => {
  let awsFilePath = s3UploadingPath + fileName;
  if (fileName.includes("/")) {
    awsFilePath =
      s3UploadingPath + fileName.slice(fileName.lastIndexOf("/") + 1);
  }

  return new Promise<{ error: number | string }>((resolve) => {
    // Prepare the s3 uploading path
    let fileContent;
    try {
      fileContent = fs.readFileSync(fileName);
    } catch (error) {
      console.log(chalk.red("Error reading file: " + fileName));
      return;
    }

    // Uploading logic
    s3.putObject(
      { Bucket: bucketName, Key: awsFilePath, Body: fileContent },
      (err: AWSError) => {
        if (err) {
          console.log(chalk.red(`Unsuccessfully uploaded ${fileName}`));
          return resolve({ error: err.message });
        } else {
          console.log(
            chalk.green(
              `Successfully uploaded ${fileName} to s3://${bucketName}/${awsFilePath}`
            )
          );
          return resolve({ error: 0 });
        }
      }
    );
  });
};

// Upload a folder to S3
export const uploadToS3 = (
  bucketName: string,
  uploadingPath: string,
  s3UploadingPath: string,
  keepParentFolder: boolean = false
) => {
  return new Promise(async (resolve) => {
    const stats = fs.statSync(uploadingPath);

    // Check if this is a directory or not
    if (stats.isDirectory()) {
      const files = fs.readdirSync(uploadingPath);
      const result: Record<string, {}> = {};
      for (const file of files) {
        const filePath = path.join(uploadingPath, file);
        const uploadingResult = await putObject(
          bucketName,
          filePath,
          keepParentFolder
            ? path.join(s3UploadingPath, path.basename(uploadingPath)) + "/"
            : s3UploadingPath
        );
        result[filePath] = uploadingResult;
      }
      resolve(result);
    } else {
      resolve(putObject(bucketName, uploadingPath, s3UploadingPath));
    }
  });
};

// List all buckets in S3
export const createBucket = (bucketName: string) => {
  return new Promise<{ error: number | string }>((resolve) => {
    s3.createBucket({ Bucket: bucketName }, (err: AWSError) => {
      if (err && err.message) {
        console.log(chalk.red(err.message));
        return resolve({ error: err.message });
      } else {
        console.log(
          chalk.green(`Successfully created new bucket s3://${bucketName}`)
        );
        return resolve({ error: 0 });
      }
    });
  });
};
