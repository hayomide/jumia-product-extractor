/* scrape */
import { join } from "path";

// import { writeFile } from "fs/promises";

import ObjectsToCsv from "objects-to-csv";

import spiderCore from "spider-core";
import { executablePath, headless, __dirname } from "../config";

const proxiesFile = join(__dirname, "./proxies.txt");
const categoriesData = join(__dirname, "./files/categories.csv");

const { launchBrowser } = spiderCore;

const visitJumia = async () => {
    const [createNewPage, exitBrowser] = await launchBrowser({ executablePath, headless, proxiesFile });
    const [page] = await createNewPage();
    if (!page) return console.error("Page was not opened");

    const url = "https://www.jumia.com.ng/";

    let categoriesInfo = [];

    try {
        console.log(`Opening ${url} ...\n`);
        await page.goto(url, { waitUntil: "networkidle0", timeout: 60 * 1000 });
    } catch (err) {
        console.error("Unable to open url", err);
        return categoriesInfo;
    }

    try {
        console.log("Extracting categories...");
        const categories = await page.evaluate(() => {
            const catsInfo = [];
            const categories = document.querySelectorAll(".cat > a");

            categories.forEach((category) => {
                const categoryName = category.innerHTML;

                const categoryUrl = category.href;

                catsInfo.push({ category: categoryName, Url: categoryUrl });
            });

            return catsInfo;
        });

        categoriesInfo = [...categoriesInfo, ...new Set(categories)];

        console.log(categoriesInfo);
    } catch (err) {
        console.error("Could not extarct categories!", err);
    }

    await page.waitForTimeout(5000000);

    console.log("Saving to Csv...");
    new ObjectsToCsv(categoriesInfo)
        .toDisk(categoriesData)
        .then(console.log("Category sucessfuly saved in Csv format"))
        .catch((e) => console.error("Could not save category in Csv format!", e));

    await exitBrowser();
    return categoriesInfo;
};

export default visitJumia;
