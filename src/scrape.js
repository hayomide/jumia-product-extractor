/* scrape */
import { join } from "path";

import spiderCore from "spider-core";
import { executablePath, headless, __dirname } from "../config";

const proxiesFile = join(__dirname, "./proxies.txt");

const { launchBrowser } = spiderCore;

const catScrape = async () => {
    const [createNewPage, exitBrowser] = await launchBrowser({ executablePath, headless, proxiesFile });
    const [page] = await createNewPage();
    if (!page) return console.error("Page was not opened");

    const url = "https://www.jumia.com.ng/";

    try {
        console.log(`Opening ${url} ...\n`);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });
    } catch (err) {
        console.error("Unable to open url", err);
        await exitBrowser();
    }

    const prdExtract = async () => {
        try {
            const catExtract = await page.evaluate(() => {
                let productExtract = [];

                const cardInfo = document.querySelectorAll(".info");

                cardInfo.forEach((product) => {
                    const productName = product.querySelector("h3.name").innerText;

                    let originalPrice = "",
                        discountPrice = "",
                        discountPercent = "",
                        review = "";
                    try {
                        originalPrice = product.querySelector("div.s-prc-w .old").innerText;
                    } catch (e) {}

                    try {
                        discountPrice = product.querySelector(".prc").innerText;
                    } catch (e) {}

                    try {
                        discountPercent = product.querySelector("div.s-prc-w > ._dsct").innerText;
                    } catch (e) {}

                    try {
                        review = product.querySelector(".rev").innerText.replace("\n", " ");
                    } catch (e) {}

                    productExtract.push({
                        productName,
                        originalPrice,
                        discountPrice,
                        discountPercent,
                        review,
                    });
                });

                return productExtract;
            });
            console.log("CategoryExtract =>", catExtract);
            console.log("Done scrapping the Product");
        } catch (e) {
            console.error("Could not extract products", e);
        }
    };

    await prdExtract();

    for (i = 0; i < 36; i++) {
        try {
            await page.evaluate(() => {
                document.querySelector('a[aria-label="Next Page"]').click();
            });
            await page.waitForNavigation({ waitUntil: "networkidle0" });
            await prdExtract();
        } catch (e) {
            console.error("Unable to Click the Next Button", e);
            await page.waitForTimeout(300000);
        }
    }

    await exitBrowser();
};

// const visitJumia = async () => {
//     const [createNewPage, exitBrowser] = await launchBrowser({ executablePath, headless, proxiesFile });
//     const [page] = await createNewPage();
//     if (!page) return console.error("Page was not opened");

//     const url = "https://www.jumia.com.ng/";

//     try {
//         console.log(`Opening ${url} ...\n`);
//         await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60 * 1000 });
//     } catch (err) {
//         return console.error("Unable to open url", err);
//     }

//     await exitBrowser();
// };

export default catScrape;
