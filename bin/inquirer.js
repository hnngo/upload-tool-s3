import inquirer from "inquirer";
import chalk from "chalk";
export const NEW_BUCKET_CHOICE = "New bucket";
export const generateBucketQuestion = (choices) => [
    {
        type: "list",
        name: "bucket",
        message: chalk.green("Please select which bucket?"),
        choices: [...choices, NEW_BUCKET_CHOICE],
    },
];
export const CURRENT_FOLDER_CHOICE = "Current folder";
export const NEW_FOLDER_CHOICE = "New folder";
export const generateFolderQuestion = (choices) => [
    {
        type: "list",
        name: "folder",
        message: chalk.green("Please select which folder?"),
        choices: [CURRENT_FOLDER_CHOICE, ...choices, NEW_FOLDER_CHOICE],
    },
];
// Prompt asking for bucket choice
export const promptBucketChoiceQuestion = (choices) => {
    return new Promise((resolve) => {
        inquirer.prompt(generateBucketQuestion(choices)).then(resolve);
    });
};
// Prompt asking for folder choice
export const promptFolderChoiceQuestion = (choices) => {
    return new Promise((resolve) => {
        inquirer.prompt(generateFolderQuestion(choices)).then(resolve);
    });
};
// Prompt asking for flatten folder choice
export const promptFlattenFolderChoiceQuestion = () => {
    return new Promise((resolve) => {
        inquirer
            .prompt([
            {
                type: "confirm",
                name: "keepParentFolder",
                message: chalk.green("Do you want to keep parent folder?"),
            },
        ])
            .then(resolve);
    });
};
// Prompt asking for a name
export const promptNameQuestion = (type) => {
    return new Promise((resolve) => {
        inquirer
            .prompt([
            {
                type: "text",
                name: "name",
                message: chalk.green(`What is the new ${type} name?`),
            },
        ])
            .then(resolve);
    });
};
