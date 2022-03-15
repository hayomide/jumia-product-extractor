import "dotenv/config";

import { dirname } from "path";
import { fileURLToPath } from "url";

// import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));

const executablePath = process.env.EXECUTABLE_PATH;
const headless = !(process.env.CHROME_NON_HEADLESS * 1);
const _2CaptchaToken = process.env.TWO_CAPTCHA_TOKEN;

export { __dirname, executablePath, headless, _2CaptchaToken };
