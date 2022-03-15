/* scrape */
import { join } from "path";
import { readFile } from "fs/promises";
import neatCsv from "neat-csv";

// import { writeFile } from "fs/promises";

import ObjectsToCsv from "objects-to-csv";

import spiderCore from "spider-core";
import { executablePath, headless, __dirname } from "../config";

const proxiesFile = join(__dirname, "./proxies.txt");
const mainCategories = join(__dirname, "./files/categories.csv");
const subCategoriesData = join(__dirname, "./files/Subcategories.csv");

const { launchBrowser } = spiderCore;

const visitCategory = async (page, url) => {
    let subCategories = [];

    try {
        console.log(`Opening ${url}...\n`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });
    } catch (err) {
        console.error("Unable to open url", err);
        return subCategories;
    }

    try {
        console.log("Extracting Sub categories...");
        const categories = await page.evaluate((url) => {
            const catsInfo = [];
            const categories = document.querySelectorAll('a[class*="-db"]');

            const reg = url.match(/\b(?=ng)\w.*/g);
            const newReg = reg[0].replaceAll("ng/", "");

            categories.forEach((category) => {
                let subCategoryName;
                let subCategoryUrl;
                let categoryName;

                try {
                    subCategoryName = category.innerText;
                } catch (e) {
                    console.log(e);
                }

                try {
                    subCategoryUrl = category.href;
                } catch (e) {
                    console.log(e);
                }

                try {
                    categoryName = newReg.replaceAll("/", "");
                } catch (e) {
                    console.log(e);
                }

                catsInfo.push({
                    Category: categoryName,
                    "Category_url": url,
                    "Sub_category": subCategoryName,
                    "Sub_category_url": subCategoryUrl,
                });
            });

            return catsInfo;
        }, url);

        subCategories = [...subCategories, ...new Set(categories)];

        console.log(subCategories);
    } catch (err) {
        console.error("Could not extarct categories!", err);
    }

    // await closePage();
    return subCategories;
};

const getSubCategories = async () => {
    const [createNewPage, exitBrowser] = await launchBrowser({ executablePath, headless, proxiesFile });

    const [page] = await createNewPage();
    if (!page) return console.error("Page was not opened");

    let subCat = [];

    await readFile(mainCategories)
        .then(neatCsv)
        .then(async (data) => {
            const categoriesLenght = data.length;
            if (!Array.isArray(data) || categoriesLenght < 1)
                return console.log("No data to work with!, categories file is empty");
            const urls = data.map((x) => x.Url);

            for (const url of urls) {
                if (!url || typeof url !== "string") return console.log("Invalid url!");
                const newCategories = await visitCategory(page, url);

                subCat = [...subCat, ...new Set(newCategories)];

                console.log(newCategories.length, "New Sub categories extracted...");
                console.log("Total of", subCat.length, "Sub categories.\n");
            }
        });

    console.log();
    await exitBrowser();

    console.log("Saving sub categories to csv...");
    new ObjectsToCsv(subCat)
        .toDisk(subCategoriesData)
        .then(console.log("Sub categories sucessfully saved to Csv.."))
        .catch((e) => console.error("Sub categories data could not be saved!", e));
};

export default getSubCategories;
